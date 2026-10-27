import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createStorage, uploadInfo, MAX_UPLOAD_SIZE } from "../storage.mjs";
import { createNormalizer, legacyIdentifier } from "../migration.mjs";

beforeEach(() => {
  process.env.SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SECRET_KEY = "sb_secret_synthetic_test_key";
  process.env.SUPABASE_STORAGE_BUCKET = "business-media";
});
test("signed upload is private-authorized and returns only scoped public/upload URLs", async () => {
  let called;
  const storage = createStorage(async (url, init) => {
    called = { url, init };
    return Response.json({ url: "/object/upload/sign/business-media/owner/a.png?token=temporary" });
  });
  const result = await storage.sign({ filename: "image.PNG", size: 100 }, { id: "owner" });
  assert.match(called.url, /^https:\/\/project.supabase.co\/storage\/v1\/object\/upload\/sign\/business-media\/owner\//);
  assert.equal(called.init.headers.apikey, process.env.SUPABASE_SECRET_KEY);
  assert.equal(called.init.headers["x-upsert"], "false");
  assert.equal(result.content_type, "image/png");
  assert.match(result.url, /\/object\/public\/business-media\/owner\//);
  assert.ok(!JSON.stringify(result).includes(process.env.SUPABASE_SECRET_KEY));
});
test("untrusted filenames, empty/oversized files and failed signing never pretend success", async () => {
  for (const [filename, size] of [["a.exe", 10], ["a.png", 0], ["a.png", MAX_UPLOAD_SIZE + 1]]) assert.throws(() => uploadInfo(filename, size));
  const storage = createStorage(async () => Response.json({ message: "denied" }, { status: 403 }));
  await assert.rejects(() => storage.sign({ filename: "a.png", size: 10 }, { id: "owner" }), error => error.status === 502);
  assert.throws(() => uploadInfo("a.png.html", 10));
});
test("malformed provider URL and path traversal are rejected", async () => {
  const storage = createStorage(async () => Response.json({ url: "https://attacker.example/upload" }));
  await assert.rejects(() => storage.sign({ filename: "a.png", size: 10 }, { id: "owner" }), error => error.status === 502);
  await assert.rejects(() => storage.legacy("../private"), error => error.status === 404);
  await assert.rejects(() => storage.sign({ filename: "a.png", size: 10 }, { id: "../other" }), error => error.status === 400);
});
test("legacy relative and approved absolute URLs are recursively remapped without changing other content", () => {
  const filename = "a".repeat(32) + ".png";
  const normalizer = createNormalizer(new Set(["https://old.example"]));
  const original = { _id: "mongo", id: "same-id", business_name: "نام فارسی", profile_image: "/api/uploads/" + filename, gallery: [{ id: "g", url: "https://old.example/api/uploads/" + filename }], theme: { banner_url: "https://external.example/picture.png" }, working_hours: [{ day: "سه‌شنبه", enabled: true, open_time: "09:00", close_time: "18:00" }] };
  const mapped = normalizer.normalize("pages", original, name => "https://storage.example/" + name);
  assert.equal(mapped.id, original.id);
  assert.equal(mapped.profile_image, "https://storage.example/legacy/" + filename);
  assert.equal(mapped.gallery[0].url, mapped.profile_image);
  assert.equal(mapped.business_name, "نام فارسی");
  assert.equal(mapped.theme.banner_url, original.theme.banner_url);
  assert.equal(mapped.working_hours[0].day, "tuesday");
  assert.equal(normalizer.references.size, 1);
  assert.ok(!("_id" in mapped));
  assert.equal(original.working_hours[0].day, "سه‌شنبه");
});
test("unconfigured absolute legacy origins stop migration instead of leaving broken images", () => {
  const filename = "b".repeat(32) + ".png";
  assert.throws(() => createNormalizer().normalize("pages", { profile_image: "https://unconfigured.example/api/uploads/" + filename }), /LEGACY_UPLOAD_ORIGINS/);
});
test("migration preserves passwords, IDs, plans and date values and assigns stable IDs only where needed", () => {
  const normalizer = createNormalizer();
  const user = { _id: "mongo", id: "same", password_hash: "$2b$legacy", plan: "pro", created_at: new Date("2026-01-01T00:00:00Z") };
  const mapped = normalizer.normalize("users", user);
  assert.equal(mapped.password_hash, user.password_hash); assert.equal(mapped.plan, "pro"); assert.equal(mapped.created_at, "2026-01-01T00:00:00.000Z");
  assert.equal(legacyIdentifier("users", user), "same");
  assert.equal(legacyIdentifier("link_clicks", { _id: "abc" }), legacyIdentifier("link_clicks", { _id: "abc" }));
  assert.notEqual(legacyIdentifier("link_clicks", { _id: "abc" }), legacyIdentifier("link_clicks", { _id: "xyz" }));
  assert.equal(normalizer.normalize("pages", { id: "p" }).working_hours.length, 7);
});
