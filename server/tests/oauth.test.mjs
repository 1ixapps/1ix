import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { createDatabase, TABLES } from "../database.mjs";
import { createApi } from "../api.mjs";
import { createSupabaseAuth } from "../supabase-auth.mjs";
import { createTestAuth } from "./fixtures/test-auth.mjs";
import { fail } from "../http.mjs";

let pg, db, auth, api, codes, exchanges, databaseCalls;
const identities = [{ id:"google-owner",email:"owner@example.com",name:"مالک" },{ id:"google-admin",email:"admin@example.com",name:"مدیر" }];
function database(engine) { return createDatabase({ query: async (sql,values) => (await engine.query(sql,values)).rows, transaction: callback => engine.transaction(tx => callback(database(tx))) }); }
before(async () => {
  pg = new PGlite({ extensions: { btree_gist } });
  await pg.exec(await readFile(new URL("../../supabase/migrations/202610200001_initial.sql",import.meta.url),"utf8"));
  await pg.exec(await readFile(new URL("../../supabase/migrations/202610220003_supabase_auth.sql",import.meta.url),"utf8"));
  db = database(pg);
});
beforeEach(async () => {
  process.env.NODE_ENV = "test"; delete process.env.VERCEL;
  process.env.SUPABASE_URL = "https://fixture.supabase.co"; process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fixture";
  await pg.exec("TRUNCATE " + TABLES.map(name => "app_private." + name).join(","));
  await db.insert("users",{id:"legacy-owner",supabase_auth_id:"google-owner",email:"owner@example.com",name:"نام ویرایش‌شده",role:"user",plan:"pro",subscription_ends_at:"2099-01-01T00:00:00Z",email_verified:true});
  await db.insert("users",{id:"admin",supabase_auth_id:"google-admin",email:"admin@example.com",name:"مدیر",role:"admin",plan:"business",email_verified:true});
  auth = createTestAuth(identities,"Password1"); codes = new Map(); exchanges = 0; databaseCalls = 0;
  auth.settings = async () => ({external:{google:true},mailer_autoconfirm:false});
  auth.googleUrl = createSupabaseAuth().googleUrl;
  auth.exchange = async (code,verifier) => {
    exchanges++;
    const entry=codes.get(code);
    if (!entry || entry.challenge !== createHash("sha256").update(verifier).digest("base64url")) fail(400,"invalid proof");
    codes.delete(code); return entry.session;
  };
  api = createApi({auth,database:()=>{databaseCalls++;return db;}});
});
after(async () => { await pg.close(); });
async function call(path,{method="GET",cookie,data,headers={}}={}) {
  return api(new Request("http://localhost:3000/api"+path,{method,headers:{...(cookie?{Cookie:cookie}:{}),...(data?{"Content-Type":"application/json"}:{}),...headers},...(data?{body:JSON.stringify(data)}:{})}));
}
async function start(next) {
  const response=await call("/auth/oauth/google",{method:"POST",data:next?{next}:{}});
  const payload=await response.json();
  return {response,payload,cookie:response.headers.getSetCookie().map(value=>value.split(";")[0]).join("; "),challenge:new URL(payload.url).searchParams.get("code_challenge")};
}
async function issue(flow,email="owner@example.com") {
  const session=await auth.login({email,password:"Password1"});
  const code="code-"+codes.size+"-"+email;
  codes.set(code,{session,challenge:flow.challenge}); return code;
}
const callback = (flow,code,options={}) => call("/auth/oauth/callback?code="+encodeURIComponent(code),{cookie:flow.cookie,...options});

test("Google start uses real Supabase authorize/PKCE and private ten-minute cookies, without opening a database",async()=>{
  const flow=await start("/dashboard/plan?plan=pro"); assert.equal(flow.response.status,200);
  const url=new URL(flow.payload.url);
  assert.equal(url.origin,"https://fixture.supabase.co"); assert.equal(url.pathname,"/auth/v1/authorize");
  assert.equal(url.searchParams.get("provider"),"google"); assert.equal(url.searchParams.get("code_challenge_method"),"s256");
  assert.equal(url.searchParams.get("redirect_to"),"http://localhost:3000/api/auth/oauth/callback");
  assert.match(flow.challenge,/^[A-Za-z0-9_-]{43}$/);
  const proof=flow.cookie.match(/sb_google_pkce=([^;]+)/)[1];
  assert.ok(!flow.payload.url.includes(proof)); assert.equal(databaseCalls,0);
  for(const cookie of flow.response.headers.getSetCookie()){assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Lax/);assert.match(cookie,/Max-Age=600/);}
  assert.equal(flow.response.headers.get("cache-control"),"no-store");
});

test("a verified Google account retains the original application ID, edited name, paid plan and data ownership",async()=>{
  await db.insert("pages",{id:"page",user_id:"legacy-owner",username:"clinic",business_name:"کلینیک",published:true});
  const flow=await start("/dashboard/plan?plan=pro"); const response=await callback(flow,await issue(flow));
  assert.equal(response.status,303); assert.equal(response.headers.get("location"),"/dashboard/plan?plan=pro");
  assert.equal(await response.text(),""); assert.equal(response.headers.get("referrer-policy"),"no-referrer");
  const profile=await db.findOne("users",{id:"legacy-owner"});
  assert.equal(profile.name,"نام ویرایش‌شده"); assert.equal(profile.plan,"pro"); assert.equal(await db.count("users"),2);
  assert.equal((await db.findOne("pages",{id:"page"})).user_id,"legacy-owner");
  const set=response.headers.getSetCookie();
  assert.ok(set.some(cookie=>cookie.startsWith("sb_access_token=")&&cookie.includes("HttpOnly")));
  assert.ok(set.some(cookie=>cookie.startsWith("sb_refresh_token=")&&cookie.includes("HttpOnly")));
  assert.ok(set.some(cookie=>cookie.startsWith("sb_google_pkce=;")&&cookie.includes("Max-Age=0")));
  const sessionCookies=set.filter(cookie=>/^sb_(access|refresh)_token=/.test(cookie)).map(value=>value.split(";")[0]).join("; ");
  const session=await call("/auth/session",{cookie:sessionCookies});
  assert.equal((await session.json()).user.id,"legacy-owner");
});

test("new confirmed Google users get their name and the normal seven-day trial, never privileged metadata",async()=>{
  const flow=await start("/dashboard/page");
  await auth.signup({email:"new@example.com",password:"Password1",name:""},"unused","");
  const account=auth.accounts.get("new@example.com");
  account.email_confirmed_at="2026-01-01T00:00:00Z"; account.user_metadata={full_name:"نام گوگل",role:"admin",plan:"business"};
  const response=await callback(flow,await issue(flow,"new@example.com"));
  assert.equal(response.headers.get("location"),"/dashboard/page");
  const user=await db.findOne("users",{email:"new@example.com"});
  assert.equal(user.name,"نام گوگل");assert.equal(user.role,"user");assert.equal(user.plan,"free");
  assert.ok(Date.parse(user.trial_ends_at)>Date.now()+6*86400000);
  const flow2=await start(); await callback(flow2,await issue(flow2,"new@example.com"));
  assert.equal((await db.findOne("users",{email:"new@example.com"})).trial_ends_at,user.trial_ends_at);
});

test("Google sign-in of a verified legacy identity links it without discarding its original owner ID",async()=>{
  await db.update("users",{id:"legacy-owner"},{supabase_auth_id:null});
  const flow=await start();const response=await callback(flow,await issue(flow));
  assert.equal(response.headers.get("location"),"/dashboard");
  assert.equal((await db.findOne("users",{id:"legacy-owner"})).supabase_auth_id,"google-owner");
});

test("administrator defaults are preserved and untrusted destinations can never become external redirects",async()=>{
  for(const next of ["https://evil.example","//evil.example","/dashboard.evil","/dashboard\\evil","/dashboard\r\nLocation:bad"]){
    const flow=await start(next);const response=await callback(flow,await issue(flow,"admin@example.com"));
    assert.equal(response.headers.get("location"),"/admin");
  }
});

test("missing, malformed, cross-browser and consumed PKCE codes cannot create a session",async()=>{
  const flow=await start();const code=await issue(flow);
  const absent=await call("/auth/oauth/callback?code="+encodeURIComponent(code));
  assert.equal(absent.headers.get("location"),"/login?oauth_error=expired"); assert.equal(exchanges,0); assert.equal(databaseCalls,0);
  const second=await start();const wrong=await callback(second,code);assert.equal(wrong.headers.get("location"),"/login?oauth_error=expired");assert.equal(databaseCalls,0);
  const good=await callback(flow,code);assert.equal(good.headers.get("location"),"/dashboard");
  const replay=await callback(flow,code);assert.equal(replay.headers.get("location"),"/login?oauth_error=expired");
  assert.ok(!replay.headers.getSetCookie().some(cookie=>cookie.startsWith("sb_access_token=")));
});

test("provider cancellation strips diagnostics without consuming any code or touching an existing session",async()=>{
  const flow=await start();
  const response=await call("/auth/oauth/callback?error=access_denied&error_description=secret-provider-details",{cookie:flow.cookie+"; sb_access_token=existing"});
  assert.equal(response.status,303);assert.equal(response.headers.get("location"),"/login?oauth_error=cancelled");assert.equal(exchanges,0);
  assert.ok(!JSON.stringify([...response.headers]).includes("secret-provider"));
  assert.ok(!response.headers.getSetCookie().some(cookie=>cookie.startsWith("sb_access_token=")));
});

test("suspended accounts and conflicting identities cannot enter through Google",async()=>{
  await db.update("users",{id:"legacy-owner"},{suspended:true});
  const flow=await start();const response=await callback(flow,await issue(flow));
  assert.equal(response.headers.get("location"),"/login?oauth_error=blocked");
  assert.ok(!response.headers.getSetCookie().some(cookie=>cookie.startsWith("sb_access_token=")));
  await db.update("users",{id:"legacy-owner"},{suspended:false,supabase_auth_id:"different-identity"});
  const next=await start();const conflict=await callback(next,await issue(next));
  assert.equal(conflict.headers.get("location"),"/login?oauth_error=blocked");assert.equal(await db.count("users"),2);
});

test("callback verifies the actual token identity instead of accepting the exchange response's user object",async()=>{
  const flow=await start();const code=await issue(flow);
  codes.get(code).session.user={id:"fake-admin",role:"admin"};
  const response=await callback(flow,code);
  assert.equal(response.headers.get("location"),"/dashboard");assert.equal(await db.findOne("users",{id:"fake-admin"}),null);
});

test("HEAD never consumes OAuth codes, and database/provider failures never fabricate a session",async()=>{
  const flow=await start();const code=await issue(flow);
  assert.equal((await callback(flow,code,{method:"HEAD"})).status,204);assert.equal(exchanges,0);
  auth.exchange=async()=>{throw new Error("private diagnostic");};
  const response=await callback(flow,code);assert.equal(response.headers.get("location"),"/login?oauth_error=unavailable");
  assert.ok(!response.headers.getSetCookie().some(cookie=>cookie.startsWith("sb_access_token=")));
});

test("disabled Google, invalid inputs and cross-site starts fail before provisioning any account",async()=>{
  auth.settings=async()=>({external:{google:false}});
  const disabled=await call("/auth/oauth/google",{method:"POST",data:{}});
  assert.equal(disabled.status,503);assert.equal(disabled.headers.getSetCookie().length,0);
  assert.ok(!/Supabase|Client|SECRET/.test((await disabled.json()).detail));
  assert.equal((await call("/auth/oauth/google",{method:"POST",data:{next:"/dashboard",role:"admin"}})).status,422);
  assert.equal((await call("/auth/oauth/google",{method:"POST",data:{},headers:{Origin:"https://evil.example"}})).status,403);
  assert.equal((await call("/auth/oauth/google")).status,405);assert.equal(databaseCalls,0);
});

test("production OAuth requires a trusted HTTPS site URL and sets Secure cookies",async()=>{
  process.env.NODE_ENV="production"; delete process.env.SITE_URL;delete process.env.NEXT_PUBLIC_SITE_URL;
  assert.equal((await call("/auth/oauth/google",{method:"POST",data:{}})).status,503);
  process.env.SITE_URL="https://1ix.ir";
  const flow=await start();assert.equal(new URL(flow.payload.url).searchParams.get("redirect_to"),"https://1ix.ir/api/auth/oauth/callback");
  assert.ok(flow.response.headers.getSetCookie().every(cookie=>cookie.includes("; Secure")));
  process.env.SITE_URL="http://insecure.example";assert.equal((await call("/auth/oauth/google",{method:"POST",data:{}})).status,503);
});
