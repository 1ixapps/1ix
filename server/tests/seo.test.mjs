import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { createDatabase } from "../database.mjs";
import { readPublicPage, readSitemapPages } from "../public-site.mjs";
import { absoluteUrl, canonicalPagePath, classifyPath, isPreview, pageSeo, serializeJsonLd, siteOrigin, siteStructuredData } from "../../shared/seo.mjs";

test("canonical URLs stay on the configured site and unknown routes are not indexable pages", () => {
  assert.equal(siteOrigin("not a URL"), "https://1ix.ir");
  assert.equal(siteOrigin("javascript:bad"), "https://1ix.ir");
  assert.equal(siteOrigin("https://owner:password@example.com"), "https://1ix.ir");
  assert.equal(siteOrigin("https://1ix.ir/with-path"), "https://1ix.ir");
  assert.equal(absoluteUrl("//evil.example", "https://1ix.ir"), "https://1ix.ir/");
  assert.equal(canonicalPagePath("Clinic"), "/u/clinic");
  for (const path of ["/", "/pricing"]) assert.ok(["home","pricing"].includes(classifyPath(path)));
  for (const path of ["/login","/signup","/auth/confirm","/dashboard/settings","/admin/users"]) assert.equal(classifyPath(path), "private");
  for (const path of ["/unknown","/dashboard/unknown","/u/","/r/a/b"]) assert.equal(classifyPath(path), "missing");
  assert.equal(classifyPath("/r/test-link"), "redirect");
});

test("metadata uses the real business SEO settings and never inherits the home title", () => {
  assert.notEqual(pageSeo("/").title, pageSeo("/pricing").title);
  const page = { username: "clinic", business_name: "کلینیک تست", bio: "شرح کسب‌وکار", seo: { title: "عنوان انتخابی", description: "شرح انتخابی", keywords: "کلینیک، نوبت, خدمات" } };
  assert.deepEqual(pageSeo("/u/clinic", page), { title: "عنوان انتخابی", description: "شرح انتخابی", path: "/u/clinic", keywords: ["کلینیک", "نوبت", "خدمات"] });
  assert.equal(pageSeo("/u/clinic", { ...page, seo: {} }).description, page.bio);
});

test("structured data identifies the real site and safely escapes script boundaries", () => {
  const data = siteStructuredData("https://1ix.ir");
  assert.deepEqual(data["@graph"].map(item => item["@type"]), ["Organization","WebSite","SoftwareApplication"]);
  const encoded = serializeJsonLd({ name: "</script><script>bad&more</script>" });
  assert.ok(!encoded.includes("<")); assert.ok(!encoded.includes("&"));
  assert.deepEqual(JSON.parse(encoded), { name: "</script><script>bad&more</script>" });
  assert.ok(!JSON.stringify(data).includes("aggregateRating"));
});

test("Preview deployments are noindex independently of the production canonical domain", () => {
  const previous = process.env.VERCEL_ENV;
  try {
    process.env.VERCEL_ENV = "preview"; assert.equal(isPreview(), true);
    process.env.VERCEL_ENV = "production"; assert.equal(isPreview(), false);
    delete process.env.VERCEL_ENV; assert.equal(isPreview(), false);
  } finally { if (previous === undefined) delete process.env.VERCEL_ENV; else process.env.VERCEL_ENV = previous; }
});

test("standalone setup matches all migrations, is repeatable and public SEO reads never change analytics", async () => {
  const names = ["202610200001_initial.sql","202610200002_storage.sql","202610220003_supabase_auth.sql"];
  const source = await readFile(new URL("../../supabase/SETUP.sql", import.meta.url), "utf8");
  for (const name of names) assert.ok(source.includes((await readFile(new URL("../../supabase/migrations/" + name, import.meta.url), "utf8")).replace(/\r\n/g,"\n").trim()), name + " must match");
  const pg = new PGlite({ extensions: { btree_gist } });
  try {
    await pg.exec("CREATE SCHEMA storage; CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); CREATE ROLE anon; CREATE ROLE authenticated;");
    await pg.exec(source); await pg.exec(source);
    const db = createDatabase({ query: async (sql, values) => (await pg.query(sql, values)).rows, transaction: () => { throw new Error("Public SEO must not write"); } });
    const live = { id:"live", username:"clinic", user_id:"owner", business_name:"کلینیک", published:true, views:8, updated_at:"2026-10-22T00:00:00Z" };
    for (const page of [live, { ...live,id:"draft",username:"draft",user_id:"other",published:false }, { ...live,id:"suspended",username:"suspended",user_id:"suspended-owner",suspended:true }]) await db.insert("pages",page);
    await db.insert("services",{id:"active",user_id:"owner",active:true,title:"مشاوره"});
    await db.insert("services",{id:"hidden",user_id:"owner",active:false,title:"غیرفعال"});
    await db.insert("services",{id:"other",user_id:"other",active:true,title:"دیگر"});
    assert.equal(await readPublicPage(db,"draft"), null); assert.equal(await readPublicPage(db,"suspended"),null);
    const publicData = await readPublicPage(db,"CLINIC"); assert.equal(publicData.page.username,"clinic");
    assert.deepEqual(publicData.services.map(service => service.id), ["active"]);
    const sitemap = await readSitemapPages(db);
    assert.deepEqual(sitemap, [{ username:"clinic",updated_at:live.updated_at }]);
    assert.equal((await db.findOne("pages",{id:"live"})).views,8);
    const verification = await pg.exec(await readFile(new URL("../../supabase/VERIFY.sql",import.meta.url),"utf8"));
    assert.equal(verification[0].rows.length,12);
    assert.ok(verification[0].rows.every(row => row.rls_enabled && !row.anon_read && !row.authenticated_read));
  } finally { await pg.close(); }
});
