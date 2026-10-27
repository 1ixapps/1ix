import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createSupabaseAuth } from "../supabase-auth.mjs";
import { fromPostgres } from "../database.mjs";

beforeEach(() => {
  for (const name of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"]) delete process.env[name];
  process.env.SUPABASE_URL = "https://test-project.supabase.co";
  process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_isolated_test";
  process.env.SUPABASE_SECRET_KEY = "server_secret_must_not_be_used_for_login";
});

test("Supabase signup sends only name metadata, password and a PKCE challenge using the public key", async () => {
  let called;
  const auth = createSupabaseAuth(async (url, init) => { called = { url, init }; return Response.json({ user: { id: "auth-id" } }); });
  await auth.signup({ email: "new@example.com", password: "secret-password", name: "کاربر", role: "admin" }, "https://app.example/auth/confirm", "challenge");
  const input = JSON.parse(called.init.body);
  assert.deepEqual(input.data, { name: "کاربر" });
  assert.equal(input.code_challenge_method, "s256");
  assert.equal(called.init.headers.apikey, process.env.SUPABASE_PUBLISHABLE_KEY);
  assert.equal(called.init.headers.Authorization, undefined);
  assert.equal(called.init.redirect, "error");
  assert.ok(!JSON.stringify(called).includes(process.env.SUPABASE_SECRET_KEY));
  assert.equal(new URL(called.url).searchParams.get("redirect_to"), "https://app.example/auth/confirm");
});

test("Supabase login, rotation, verification, PKCE exchange and password reset follow real REST contracts", async () => {
  const calls = [];
  const auth = createSupabaseAuth(async (url, init) => { calls.push({ url, init }); return Response.json({ id: "user" }); });
  await auth.login({ email: "user@example.com", password: "password" });
  await auth.refresh("refresh");
  await auth.getUser("access");
  await auth.exchange("one-time-code", "verifier");
  await auth.verify({ token_hash: "hash", type: "email" });
  await auth.updatePassword("access", "new-password");
  await auth.logout("access");
  assert.equal(new URL(calls[0].url).searchParams.get("grant_type"), "password");
  assert.deepEqual(JSON.parse(calls[1].init.body), { refresh_token: "refresh" });
  assert.equal(calls[2].init.method, "GET"); assert.equal(calls[2].init.headers.Authorization, "Bearer access");
  assert.deepEqual(JSON.parse(calls[3].init.body), { auth_code: "one-time-code", code_verifier: "verifier" });
  assert.equal(calls[5].init.method, "PUT"); assert.equal(calls[5].init.headers.Authorization, "Bearer access");
  assert.equal(new URL(calls[6].url).searchParams.get("scope"), "local");
});

test("Supabase errors are translated without leaking provider secrets or raw diagnostics", async () => {
  for (const [status, code, expected] of [[400,"invalid_credentials",401],[400,"email_not_confirmed",403],[422,"weak_password",422],[429,"over_email_send_rate_limit",429],[400,"email_address_not_authorized",503],[400,"otp_expired",400],[500,"unknown",502]]) {
    const auth = createSupabaseAuth(async () => Response.json({ error_code: code, msg: "private provider diagnostic" }, { status }));
    await assert.rejects(() => auth.login({}), error => error.status === expected && !error.detail.includes("private"));
  }
  const unavailable = createSupabaseAuth(async () => { throw new Error("private network error"); });
  await assert.rejects(() => unavailable.settings(), error => error.status === 502 && !error.detail.includes("private"));
});

test("Auth fails closed without its public key instead of using the elevated storage key", async () => {
  delete process.env.SUPABASE_PUBLISHABLE_KEY; delete process.env.SUPABASE_ANON_KEY;
  let called = false;
  const auth = createSupabaseAuth(async () => { called = true; return Response.json({}); });
  await assert.rejects(() => auth.settings(), error => error.status === 503);
  assert.equal(called, false);
});

test("Postgres.js adapter uses typed JSON helpers for documents, filters, patches, nulls and arrays", async () => {
  let received;
  const client = {
    json: value => ({ marker: "typed-json", value }),
    unsafe: async (text, values) => { received = values; return []; },
  };
  const db = fromPostgres(client);
  const values = [{ name: "فارسی", enabled: true }, "user@example.com", ["a","b"], null, 7];
  await db.query("SELECT $1::jsonb, $2::jsonb, $3::jsonb, $4::jsonb, $5", [...values.slice(0, 4).map(JSON.stringify), 7]);
  assert.deepEqual(received, [...values.slice(0, 4).map(value => ({ marker: "typed-json", value })), 7]);
});
test("database structural errors are explained as a service problem, not bad signup input", async () => {
  const { safeError } = await import("../http.mjs");
  const response = safeError({ code: "23514", message: "private raw DB values" });
  assert.equal(response.status, 503);
  const data = await response.json();
  assert.ok(data.detail.includes("ذخیره"));
  assert.ok(!data.detail.includes("private"));
});

const authEnvironmentNames = ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
test("official Next.js publishable and legacy anon env names are accepted", () => {
  const saved = Object.fromEntries(authEnvironmentNames.map(name => [name, process.env[name]]));
  try {
    for (const name of authEnvironmentNames) delete process.env[name];
    process.env.NEXT_PUBLIC_SUPABASE_URL = " https://next-project.supabase.co/ ";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = " sb_publishable_next_example ";
    assert.deepEqual(createSupabaseAuth().config(), { url: "https://next-project.supabase.co", key: "sb_publishable_next_example" });
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "legacy-public-anon-fixture";
    assert.equal(createSupabaseAuth().config().key, "legacy-public-anon-fixture");
    process.env.SUPABASE_URL = "https://server-project.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_server";
    assert.deepEqual(createSupabaseAuth().config(), { url: "https://server-project.supabase.co", key: "sb_publishable_server" });
  } finally {
    for (const name of authEnvironmentNames) if (saved[name] === undefined) delete process.env[name]; else process.env[name] = saved[name];
  }
});
test("configuration failures show a safe user-facing message without infrastructure names", () => {
  const saved = Object.fromEntries(authEnvironmentNames.map(name => [name, process.env[name]]));
  try {
    for (const name of authEnvironmentNames) delete process.env[name];
    assert.throws(() => createSupabaseAuth().config(), error => error.status === 503 && error.detail.includes("سرویس ورود") && !/Supabase|SUPABASE|سوپابیس/.test(error.detail));
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://next-project.supabase.co";
    assert.throws(() => createSupabaseAuth().config(), error => error.status === 503 && error.detail.includes("سرویس ورود") && !/Supabase|SUPABASE|سوپابیس|server_secret/.test(error.detail));
  } finally {
    for (const name of authEnvironmentNames) if (saved[name] === undefined) delete process.env[name]; else process.env[name] = saved[name];
  }
});

test("profile edits use the authenticated user endpoint and whitelist name metadata only", async () => {
  let called;
  const auth = createSupabaseAuth(async (url, init) => { called = { url, init }; return Response.json({ id: "user" }); });
  await auth.updateProfile("access", { name: "علی محمدی", role: "admin", email: "other@example.com" });
  assert.equal(new URL(called.url).pathname, "/auth/v1/user");
  assert.equal(called.init.method, "PUT");
  assert.equal(called.init.headers.Authorization, "Bearer access");
  assert.deepEqual(JSON.parse(called.init.body), { data: { name: "علی محمدی" } });
  assert.equal(called.init.headers.apikey, process.env.SUPABASE_PUBLISHABLE_KEY);
});

test("technical storage failures give an actionable user message without configuration instructions", async () => {
  const { createStorage } = await import("../storage.mjs");
  const { safeError } = await import("../http.mjs");
  process.env.SUPABASE_STORAGE_BUCKET = "business-media";
  const storage = createStorage(async () => Response.json({ error: "private provider diagnostics" }, { status: 503 }));
  let failure;
  try { await storage.sign({ filename: "test.png", size: 100 }, { id: "owner" }); }
  catch (error) { failure = error; }
  assert.ok(failure, "storage failure must not be reported as success");
  assert.equal(failure.status, 502);
  const result = await safeError(failure).json();
  assert.match(result.detail, /دوباره تلاش/);
  assert.ok(!/Storage|Supabase|تنظیمات|پیکربندی|private/.test(result.detail));
});
