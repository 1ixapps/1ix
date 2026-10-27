import test, { before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import bcrypt from "bcryptjs";
import { createDatabase, TABLES, compileWhere } from "../database.mjs";
import { createApi } from "../api.mjs";
import { publicUser } from "../auth.mjs";
import { HttpError } from "../http.mjs";
import { tokenFor, createTestAuth } from "./fixtures/test-auth.mjs";
import { availability, lastDays, tehranDate } from "../booking.mjs";
import { defaultHours, normalizeDay } from "../validation.mjs";

process.env.JWT_SECRET = "isolated-next-api-test-secret-which-is-not-production";
const password = "Test@12345";
let pg, db, api, token, otherToken, adminToken, otpSent, resetSent, auth;
const users = [
  { id: "owner", name: "مالک", email: "owner@example.com", role: "user", plan: "pro" },
  { id: "other", name: "کاربر دیگر", email: "other@example.com", role: "user", plan: "free" },
  { id: "admin", name: "مدیر", email: "admin@example.com", role: "admin", plan: "business" },
];
function database(engine) {
  return createDatabase({
    query: async (sql, values) => (await engine.query(sql, values)).rows,
    transaction: callback => engine.transaction(tx => callback(database(tx))),
  });
}
const storage = {
  sign: async (input, user) => ({ signed_url: "https://storage.example/upload?token=signed", url: "https://storage.example/public/" + user.id + "/image.png", filename: user.id + "/image.png", content_type: "image/png" }),
  legacy: async filename => "https://storage.example/public/legacy/" + filename,
  put: async name => "https://storage.example/public/" + name,
};
const options = () => ({ database: () => db, storage, auth, sendOtp: async (phone, code) => { otpSent = { phone, code }; }, sendReset: async (email, reset) => { resetSent = { email, token: reset }; } });
async function call(path, { method = "GET", data, auth = token, headers = {} } = {}) {
  const response = await api(new Request("http://localhost/api" + path, { method, headers: { ...(auth ? { Authorization: "Bearer " + auth } : {}), ...(data !== undefined ? { "Content-Type": "application/json" } : {}), ...headers }, ...(data !== undefined ? { body: JSON.stringify(data) } : {}) }));
  let value = null;
  if (response.headers.get("content-type")?.includes("application/json")) value = await response.json();
  return { response, data: value, status: response.status };
}
const future = (offset = 7) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
async function createPage() {
  return (await call("/pages", { method: "POST", data: { username: "clinic", business_name: "کلینیک تست", category: "clinic" } })).data;
}
async function publish() {
  await createPage();
  const hours = defaultHours().map(day => ({ ...day, enabled: true }));
  const result = await call("/pages/me", { method: "PATCH", data: { published: true, working_hours: hours, booking: { lead_time_hours: 0, advance_days: 60, slot_minutes: 30, buffer_minutes: 0, enabled: true, holidays: [], confirmation_message: "ثبت شد" } } });
  assert.equal(result.status, 200);
  return result.data;
}
before(async () => {
  pg = new PGlite({ extensions: { btree_gist } });
  await pg.exec(await readFile(new URL("../../supabase/migrations/202610200001_initial.sql", import.meta.url), "utf8"));
  await pg.exec(await readFile(new URL("../../supabase/migrations/202610220003_supabase_auth.sql", import.meta.url), "utf8"));
  db = database(pg);
});
beforeEach(async () => {
  await pg.exec("TRUNCATE " + TABLES.map(table => "app_private." + table).join(","));
  for (const user of users) await db.insert("users", { ...user, supabase_auth_id: user.id, password_hash: bcrypt.hashSync(password, 4), created_at: "2026-01-01T00:00:00.000Z", phone_verified: false });
  token = await tokenFor(users[0]); otherToken = await tokenFor(users[1]); adminToken = await tokenFor(users[2]);
  auth = createTestAuth(users, password); otpSent = resetSent = null; api = createApi(options());
});
after(async () => { await pg?.close(); });

test("health and pricing work even before configuring a cloud database", async () => {
  const noDatabase = createApi({ database: () => { throw new Error("must not connect"); } });
  for (const path of ["/health", "/public/plans", "/"]) {
    const response = await noDatabase(new Request("http://localhost/api" + path));
    assert.equal(response.status, 200);
  }
});
test("SQL filters are parameterized and all tables are private with row-level security", async () => {
  const injected = "' OR 1=1 --";
  const query = compileWhere({ $or: [{ name: { $regex: injected, $options: "i" } }, { email: injected }], role: { $ne: "admin" } });
  assert.ok(!query.text.includes(injected));
  assert.ok(query.values.some(value => value.includes(injected)));
  assert.throws(() => compileWhere({ "id');DROP TABLE users;--": "x" }));
  const rows = await pg.query("SELECT relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='app_private' AND c.relkind='r'");
  assert.equal(rows.rows.length, TABLES.length);
  assert.ok(rows.rows.every(row => row.relrowsecurity));
});
test("register requires Supabase email confirmation before provisioning the seven-day trial", async () => {
  const result = await call("/auth/register", { method: "POST", auth: null, data: { name: "کاربر تازه", email: "New@Example.com", password } });
  assert.equal(result.status, 202); assert.equal(result.data.email, "new@example.com");
  assert.equal(result.data.confirmation_required, true); assert.ok(!result.data.access_token);
  assert.equal(await db.findOne("users", { email: "new@example.com" }), null);
  assert.equal((await call("/auth/login", { method: "POST", auth: null, data: { email: "new@example.com", password } })).status, 403);
  const confirmed = await call("/auth/verify-email", { method: "POST", auth: null, data: { token_hash: "new@example.com", type: "email" } });
  assert.equal(confirmed.status, 200); assert.equal(confirmed.data.user.plan, "pro"); assert.equal(confirmed.data.user.trial_active, true);
  assert.ok(!JSON.stringify(confirmed.data).includes("password_hash"));
  assert.ok(confirmed.response.headers.getSetCookie().some(cookie => cookie.includes("HttpOnly")));
  const stored = await db.findOne("users", { email: "new@example.com" });
  assert.equal(stored.plan, "free"); assert.ok(!stored.password_hash);
});

test("login, me, refresh and logout retain the existing response and cookie contracts", async () => {
  const login = await call("/auth/login", { method: "POST", auth: null, data: { email: users[0].email, password } });
  assert.equal(login.status, 200); assert.ok(login.data.access_token);
  assert.equal((await call("/auth/me", { auth: login.data.access_token })).data.id, "owner");
  const refresh = await tokenFor(users[0], "refresh");
  const refreshed = await call("/auth/refresh", { method: "POST", auth: null, headers: { Cookie: "sb_refresh_token=" + refresh } });
  assert.equal(refreshed.status, 200); assert.ok(refreshed.data.access_token);
  assert.equal((await auth.getUser(refreshed.data.access_token)).id, "owner");
  assert.equal((await call("/auth/refresh", { method: "POST", auth: null, headers: { Cookie: "sb_refresh_token=" + token } })).status, 401);
  const logout = await call("/auth/logout", { method: "POST" });
  assert.ok(logout.response.headers.getSetCookie().every(cookie => cookie.includes("Max-Age=0")));
});
test("login delegates attempt limits to the Supabase Auth boundary", async () => {
  const statuses = [];
  for (let index = 0; index < 6; index++) statuses.push((await call("/auth/login", { method: "POST", auth: null, data: { email: "missing@example.com", password: "wrong" } })).status);
  assert.deepEqual(statuses, [401, 401, 401, 401, 401, 429]);
});
test("free trials expire while paid demo accounts keep their explicit plan", () => {
  const expired = new Date(Date.now() - 1000).toISOString();
  assert.equal(publicUser({ ...users[0], trial_ends_at: expired }).plan, "pro");
  assert.equal(publicUser({ ...users[1], trial_ends_at: expired }).plan, "free");
  assert.equal(publicUser({ ...users[0], subscription_ends_at: expired }).plan, "free");
});
test("Supabase recovery changes the password and preserves application account identifiers", async () => {
  const requested = await call("/auth/forgot-password", { method: "POST", auth: null, data: { email: users[0].email } });
  assert.equal(requested.status, 200);
  const pkceCookie = requested.response.headers.getSetCookie().find(value => value.startsWith("sb_pkce=")).split(";")[0];
  const exchanged = await call("/auth/exchange", { method: "POST", auth: null, headers: { Cookie: pkceCookie }, data: { code: users[0].email } });
  assert.equal(exchanged.status, 200);
  const input = { password: "Changed@12345" };
  assert.equal((await call("/auth/reset-password", { method: "POST", auth: exchanged.data.access_token, data: input })).status, 200);
  assert.equal((await call("/auth/login", { method: "POST", auth: null, data: { email: users[0].email, password: input.password } })).status, 200);
  assert.equal((await db.findOne("users", { email: users[0].email })).id, users[0].id);
});

test("phone verification uses the real delivery adapter and updates the same user", async () => {
  assert.equal((await call("/auth/phone/request-otp", { method: "POST", data: { phone: "09121234567" } })).status, 200);
  assert.equal(otpSent.phone, "09121234567"); assert.match(otpSent.code, /^\d{6}$/);
  assert.equal((await call("/auth/phone/verify-otp", { method: "POST", data: { phone: otpSent.phone, code: otpSent.code } })).status, 200);
  assert.equal((await call("/auth/me")).data.phone_verified, true);
  assert.equal(await db.count("phone_otps"), 0);
});
test("protected/admin endpoints reject unauthorized, cross-role and suspended accounts", async () => {
  assert.equal((await call("/pages/me", { auth: null })).status, 401);
  assert.equal((await call("/admin/users")).status, 403);
  await db.update("users", { id: "owner" }, { suspended: true });
  assert.equal((await call("/pages/me")).status, 403);
});
test("page creation, nested editor settings, publish checks and deletion retain real persistence", async () => {
  const page = await createPage(); assert.equal(page.working_hours.length, 7);
  assert.equal((await call("/public/page/clinic", { auth: null })).status, 404);
  const updated = await call("/pages/me", { method: "PATCH", data: { bio: "متن فارسی", gallery: [{ id: "photo", url: "https://example.com/a.png", caption: "نمونه‌کار" }], theme: { primary_color: "#123456" }, published: true } });
  assert.equal(updated.status, 200); assert.equal(updated.data.theme.primary_color, "#123456");
  assert.equal(updated.data.gallery[0].caption, "نمونه‌کار");
  assert.equal((await call("/pages/me", { auth: otherToken })).data, null);
  assert.equal((await call("/pages/check-username/CLINIC", { auth: null })).data.available, false);
  assert.equal((await call("/public/page/clinic", { auth: null })).status, 200);
  assert.equal((await db.findOne("pages", { id: page.id })).views, 1);
  assert.equal((await call("/pages", { method: "POST", data: { username: "second-page", business_name: "x" } })).status, 400);
  await call("/pages/me", { method: "DELETE" });
  assert.equal((await call("/pages/me")).data, null);
});
test("link CRUD, click history, redirect and owner isolation are preserved", async () => {
  const created = await call("/links", { method: "POST", data: { slug: "Campaign", destination: "https://example.com/?a=1", title: "کمپین" } });
  assert.equal(created.status, 200); assert.equal(created.data.slug, "campaign");
  assert.equal((await call("/links/resolve/campaign", { auth: null })).data.destination, "https://example.com/?a=1");
  assert.equal((await call("/r/campaign", { auth: null })).status, 302);
  const stats = await call("/links/" + created.data.id + "/stats");
  assert.equal(stats.data.link.clicks, 2); assert.equal(stats.data.clicks.length, 2);
  assert.equal((await call("/links/" + created.data.id, { method: "PATCH", auth: otherToken, data: { title: "steal" } })).status, 404);
  await call("/links/" + created.data.id, { method: "PATCH", data: { active: false } });
  assert.equal((await call("/r/campaign", { auth: null })).status, 404);
  await call("/links/" + created.data.id, { method: "DELETE" });
  assert.equal((await call("/links")).data.length, 0);
});
test("service CRUD and ownership are enforced", async () => {
  const created = await call("/services", { method: "POST", data: { title: "ویزیت", price: 200000, duration_minutes: 45 } });
  assert.equal(created.status, 200);
  const path = "/services/" + created.data.id;
  assert.equal((await call(path, { method: "PATCH", data: { price: 300000 } })).data.price, 300000);
  assert.equal((await call(path, { method: "DELETE", auth: otherToken })).status, 404);
  assert.equal((await call(path, { method: "DELETE" })).status, 200);
});
test("public booking respects availability, service duration, overlaps, confirmation and notifications", async () => {
  await publish();
  const service = (await call("/services", { method: "POST", data: { title: "مشاوره", duration_minutes: 60, price: 0 } })).data;
  const date = future();
  const slots = await call("/appointments/available-slots/clinic?date=" + date + "&service_id=" + service.id, { auth: null });
  assert.ok(slots.data.slots.includes("10:00"));
  const input = { customer_name: "مشتری", customer_phone: "09120001122", date, time: "10:00", service_id: service.id };
  const booked = await call("/public/page/clinic/book", { method: "POST", auth: null, data: input });
  assert.equal(booked.status, 200); assert.equal(booked.data.message, "ثبت شد");
  assert.equal((await call("/public/page/clinic/book", { method: "POST", auth: null, data: { ...input, time: "10:30" } })).status, 400);
  assert.equal((await call("/notifications/unread-count")).data.count, 1);
  const appt = await db.findOne("appointments", { id: booked.data.appointment_id });
  assert.equal(appt.service_title, "مشاوره"); assert.equal(appt.duration_minutes, 60);
  const afterSlots = await call("/appointments/available-slots/clinic?date=" + date, { auth: null });
  assert.ok(!afterSlots.data.slots.includes("10:30"));
});
test("the database rejects overlapping active appointments, including owner writes and updates", async () => {
  const date = future();
  const input = { customer_name: "علی", customer_phone: "09120000000", date, time: "10:00" };
  const first = await call("/appointments", { method: "POST", data: input });
  assert.equal(first.status, 200);
  assert.equal((await call("/appointments", { method: "POST", data: { ...input, time: "10:15" } })).status, 400);
  assert.equal((await call("/appointments/" + first.data.id, { method: "PATCH", auth: otherToken, data: { status: "canceled" } })).status, 404);
  await call("/appointments/" + first.data.id, { method: "PATCH", data: { status: "canceled" } });
  assert.equal((await call("/appointments", { method: "POST", data: input })).status, 200);
});
test("customers and calendar retain aggregation contracts", async () => {
  const date = future();
  const appointment = (await call("/appointments", { method: "POST", data: { customer_name: "علی", customer_phone: "09120000000", date, time: "09:00" } })).data;
  await call("/appointments/" + appointment.id, { method: "PATCH", data: { status: "completed" } });
  const customer = (await call("/appointments/customers")).data[0];
  assert.equal(customer.total, 1); assert.equal(customer.completed, 1); assert.equal(customer.phone, "09120000000");
  const calendar = await call("/appointments/calendar?year=" + date.slice(0, 4) + "&month=" + Number(date.slice(5, 7)));
  assert.equal(calendar.data.by_date[date][0].id, appointment.id);
});
test("notification reads, deletion and unread count remain owner scoped", async () => {
  const created = (await call("/notifications", { method: "POST", data: { title: "تست", body: "بدنه" } })).data;
  await call("/notifications/" + created.id + "/read", { method: "POST", auth: otherToken });
  assert.equal((await call("/notifications/unread-count")).data.count, 1);
  await call("/notifications/read-all", { method: "POST" });
  assert.equal((await call("/notifications/unread-count")).data.count, 0);
  await call("/notifications/" + created.id, { method: "DELETE" });
  assert.equal((await call("/notifications")).data.length, 0);
});
test("statistics use actual data and Tehran date buckets", async () => {
  await publish();
  const link = (await call("/links", { method: "POST", data: { slug: "stats", destination: "https://example.com" } })).data;
  await call("/links/resolve/stats", { auth: null });
  const stats = (await call("/stats/overview?days=3")).data;
  assert.equal(stats.clicks_series.length, 7); assert.equal(stats.totals.clicks, 1);
  assert.equal(stats.top_links[0].slug, link.slug); assert.equal(stats.tz, "Asia/Tehran");
  assert.equal(tehranDate("2026-10-20T22:00:00Z"), "2026-10-21");
  assert.equal(lastDays(14).length, 14);
  const adminStats = await call("/admin/stats/timeseries?days=500", { auth: adminToken });
  assert.equal(adminStats.status, 200); assert.equal(adminStats.data.users_series.length, 90);
});
test("admin search, plan changes, announcements and support tickets preserve their contracts", async () => {
  assert.equal((await call("/admin/users?q=مالک", { auth: adminToken })).data.length, 1);
  const update = await call("/admin/users/other", { auth: adminToken, method: "PATCH", data: { plan: "pro", password_hash: "must-be-ignored" } });
  assert.equal(update.status, 200); assert.equal(update.data.plan, "pro"); assert.ok(!("password_hash" in update.data));
  assert.equal((await call("/auth/me", { auth: otherToken })).data.plan, "pro");
  const ticket = await call("/public/support", { auth: null, method: "POST", data: { name: "مشتری", email: "hello@example.com", subject: "سؤال", message: "سلام" } });
  assert.equal((await call("/admin/tickets/" + ticket.data.id, { auth: adminToken, method: "PATCH", data: { status: "resolved" } })).data.status, "resolved");
  const announcement = (await call("/admin/announcements", { auth: adminToken, method: "POST", data: { title: "خبر", body: "متن" } })).data;
  assert.equal((await call("/admin/announcements", { auth: adminToken })).data.length, 1);
  await call("/admin/announcements/" + announcement.id, { auth: adminToken, method: "DELETE" });
  assert.equal((await call("/admin/announcements", { auth: adminToken })).data.length, 0);
});
test("invalid input, unknown routes and cross-site mutations fail safely", async () => {
  assert.equal((await call("/appointments", { method: "POST", data: { customer_name: "x", customer_phone: "123", date: "2026-02-30", time: "25:00" } })).status, 422);
  assert.equal((await call("/links", { method: "POST", data: { destination: "javascript:alert(1)" } })).status, 422);
  assert.equal((await call("/pages", { method: "POST", headers: { Origin: "https://attacker.example" }, data: {} })).status, 403);
  assert.equal((await call("/not-a-route", { auth: null })).status, 404);
  const unsigned = await call("/uploads/sign", { auth: null, method: "POST", data: { filename: "a.png", size: 20 } });
  assert.equal(unsigned.status, 401);
  const signed = await call("/uploads/sign", { method: "POST", data: { filename: "a.png", size: 20 } });
  assert.equal(signed.status, 200); assert.equal(signed.data.content_type, "image/png");
});

test("readiness checks PostgreSQL while liveness stays independent and API prefixes are exact", async () => {
  assert.equal((await call("/health/ready", { auth: null })).data.status, "ready");
  const broken = createApi({ database: () => { throw Object.assign(new Error("secret must not be returned"), { code: "CONFIGURATION" }); } });
  const response = await broken(new Request("http://localhost/api/health/ready"));
  assert.equal(response.status, 503);
  assert.ok(!JSON.stringify(await response.json()).includes("secret"));
  assert.equal((await api(new Request("http://localhost/apiary"))).status, 404);
  assert.equal((await call("/health", { method: "HEAD", auth: null })).status, 200);
});

test("legacy day aliases and nested builder items retain valid defaults and identifiers", async () => {
  for (const [day, expected] of [["سه‌شنبه", "tuesday"], ["yek-shanbe", "sunday"], ["جمعه", "friday"], ["THU", "thursday"]]) assert.equal(normalizeDay(day), expected);
  const created = await call("/pages", { method: "POST", data: { username: "defaults", business_name: "تست", category: null, bio: null } });
  assert.equal(created.status, 200);
  const updated = await call("/pages/me", { method: "PATCH", data: {
    gallery: [{ url: "https://example.com/a.png" }], testimonials: [{ author: "مشتری", text: "ممنون" }],
    faqs: [{ question: "ساعت کاری؟", answer: "طبق برنامه" }], price_list: [{ title: "ویزیت", price: "۲۰۰۰۰۰" }],
    working_hours: [{ day: "سه‌شنبه", enabled: true, open_time: "09:00", close_time: "18:00" }],
  } });
  assert.equal(updated.status, 200);
  const ids = ["gallery", "testimonials", "faqs", "price_list"].map(key => updated.data[key][0].id);
  assert.ok(ids.every(id => /^[a-f0-9-]{36}$/.test(id)));
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(updated.data.working_hours[0].day, "tuesday");
});

test("availability never advertises a slot blocked by a previously saved booking buffer", async () => {
  const page = await publish();
  const date = future();
  await db.insert("appointments", { id: "old-buffer", user_id: "owner", date, time: "10:00", duration_minutes: 30, buffer_minutes: 60, status: "confirmed" });
  const result = await availability(db, page, date, null);
  assert.ok(!result.slots.includes("10:30"));
  assert.ok(!result.slots.includes("11:00"));
  assert.ok(result.slots.includes("11:30"));
  const booked = await call("/public/page/clinic/book", { method: "POST", auth: null, data: { customer_name: "مشتری", customer_phone: "09120000000", date, time: "11:30" } });
  assert.equal(booked.status, 200);
});

test("booking validates holidays, working hours, lead time, horizon and service ownership", async () => {
  const page = await publish();
  const now = new Date("2030-01-01T06:30:00Z");
  page.booking = { ...page.booking, advance_days: 2, lead_time_hours: 2 };
  assert.equal((await availability(db, page, "2029-12-31", null, now)).reason, "past");
  assert.equal((await availability(db, page, "2030-01-04", null, now)).reason, "too_far");
  const today = await availability(db, page, "2030-01-01", null, now);
  assert.ok(!today.slots.includes("11:30")); assert.ok(today.slots.includes("12:00"));
  page.booking.holidays = ["2030-01-02"];
  assert.equal((await availability(db, page, "2030-01-02", null, now)).reason, "holiday");
  page.booking.holidays = [];
  page.working_hours = page.working_hours.map(day => ({ ...day, enabled: false }));
  assert.equal((await availability(db, page, "2030-01-02", null, now)).reason, "closed");
  page.working_hours = defaultHours().map(day => ({ ...day, enabled: true }));
  await db.insert("services", { id: "foreign-service", user_id: "other", active: true, duration_minutes: 30 });
  await assert.rejects(() => availability(db, page, "2030-01-02", "foreign-service", now), error => error.status === 400);
  page.booking.enabled = false;
  assert.equal((await availability(db, page, "2030-01-02", null, now)).reason, "disabled");
});

test("simultaneous public requests create exactly one appointment and one notification", async () => {
  await publish();
  const data = { customer_name: "مشتری", customer_phone: "09120000000", date: future(), time: "10:00" };
  const results = await Promise.all([call("/public/page/clinic/book", { method: "POST", auth: null, data }), call("/public/page/clinic/book", { method: "POST", auth: null, data })]);
  assert.deepEqual(results.map(result => result.status).sort(), [200, 400]);
  assert.equal(await db.count("appointments"), 1);
  assert.equal(await db.count("notifications"), 1);
});

test("notification failures roll back both manual and public appointment creation", async () => {
  await publish();
  api = createApi({ ...options(), database: () => ({ ...db, transaction: callback => db.transaction(tx => callback({
    ...tx, insert: async (entity, document) => {
      if (entity === "notifications") throw new Error("simulated notification failure");
      return tx.insert(entity, document);
    },
  })) }) });
  for (const path of ["/appointments", "/public/page/clinic/book"]) {
    const result = await call(path, { method: "POST", data: { customer_name: "مشتری", customer_phone: "09120000000", date: future(), time: "10:00" } });
    assert.equal(result.status, 503);
    assert.equal(await db.count("appointments"), 0);
    assert.equal(await db.count("notifications"), 0);
  }
});

test("phone OTP resend and guess limits persist, expiry is enforced, and codes are single-use", async () => {
  const request = { method: "POST", data: { phone: "09121234567" } };
  assert.equal((await call("/auth/phone/request-otp", request)).status, 200);
  assert.equal((await call("/auth/phone/request-otp", request)).status, 429);
  const challenge = { ...otpSent };
  const invalid = challenge.code === "000000" ? "111111" : "000000";
  for (let index = 0; index < 5; index++) assert.equal((await call("/auth/phone/verify-otp", { method: "POST", data: { phone: challenge.phone, code: invalid } })).status, 400);
  assert.equal((await db.findOne("phone_otps", { user_id: "owner" })).attempts, 5);
  assert.equal((await call("/auth/phone/verify-otp", { method: "POST", data: challenge })).status, 429);
  assert.equal((await call("/auth/me")).data.phone_verified, false);
  await db.update("phone_otps", { user_id: "owner" }, { attempts: 0, expires_at: new Date(Date.now() - 1000).toISOString() });
  assert.equal((await call("/auth/phone/verify-otp", { method: "POST", data: challenge })).status, 400);
  await db.update("phone_otps", { user_id: "owner" }, { expires_at: new Date(Date.now() + 60000).toISOString() });
  assert.equal((await call("/auth/phone/verify-otp", { method: "POST", data: challenge })).status, 200);
  assert.equal((await call("/auth/phone/verify-otp", { method: "POST", data: challenge })).status, 400);
});

test("failed SMS delivery never reports success and removes only that challenge", async () => {
  api = createApi({ ...options(), sendOtp: async () => { throw Object.assign(new Error("delivery secret"), { code: "SMS_UNAVAILABLE" }); } });
  const failed = await call("/auth/phone/request-otp", { method: "POST", data: { phone: "09121234567" } });
  assert.equal(failed.status, 503); assert.equal(await db.count("phone_otps"), 0);
  assert.ok(!JSON.stringify(failed.data).includes("secret"));
});

test("legacy reset tokens and unverified sessions cannot change passwords", async () => {
  const result = await call("/auth/reset-password", { method: "POST", auth: null, data: { token: "old-reset-token", password: "Different@123" } });
  assert.equal(result.status, 401);
  assert.equal((await call("/auth/login", { method: "POST", auth: null, data: { email: users[0].email, password } })).status, 200);
});

test("old private JWTs are rejected and new Supabase session cookies are Secure", async () => {
  assert.equal((await call("/auth/me", { auth: "legacy-private-jwt" })).status, 401);
  assert.equal((await call("/auth/me", { auth: await tokenFor(users[0], "refresh") })).status, 401);
  const previous = process.env.VERCEL; process.env.VERCEL = "1";
  try {
    const login = await call("/auth/login", { method: "POST", auth: null, data: { email: users[0].email, password } });
    assert.equal(login.status, 200);
    assert.ok(login.response.headers.getSetCookie().every(cookie => cookie.includes("; Secure") && cookie.includes("HttpOnly") && cookie.includes("SameSite=Lax")));
  } finally { if (previous === undefined) delete process.env.VERCEL; else process.env.VERCEL = previous; }
});

test("SQL setup is repeatable without clearing records or exposing an existing private bucket", async () => {
  await pg.exec(await readFile(new URL("../../supabase/migrations/202610200001_initial.sql", import.meta.url), "utf8"));
  assert.equal(await db.count("users"), 3);
  await pg.exec("CREATE SCHEMA IF NOT EXISTS storage; CREATE TABLE IF NOT EXISTS storage.buckets (id text PRIMARY KEY, name text, public boolean, file_size_limit bigint, allowed_mime_types text[])");
  const source = await readFile(new URL("../../supabase/migrations/202610200002_storage.sql", import.meta.url), "utf8");
  await pg.exec(source); await pg.exec(source);
  const first = (await pg.query("SELECT * FROM storage.buckets WHERE id='business-media'")).rows[0];
  assert.equal(first.public, true); assert.equal(Number(first.file_size_limit), 5242880);
  await pg.exec("UPDATE storage.buckets SET public=false WHERE id='business-media'");
  await pg.exec(source);
  assert.equal((await pg.query("SELECT public FROM storage.buckets WHERE id='business-media'")).rows[0].public, false);
});

test("registration fails clearly without creating a profile if email confirmation is disabled", async () => {
  auth.settings = async () => ({ mailer_autoconfirm: true });
  const result = await call("/auth/register", { method: "POST", auth: null, data: { name: "کاربر تست", email: "atomic-registration@example.com", password } });
  assert.equal(result.status, 503);
  assert.equal(await db.findOne("users", { email: "atomic-registration@example.com" }), null);
});

test("verified legacy identities retain their original ID, pages, role and paid plan", async () => {
  await createPage();
  await db.update("users", { id: "owner" }, { supabase_auth_id: null });
  const identity = auth.accounts.get(users[0].email); identity.id = "new-auth-uuid";
  const login = await call("/auth/login", { method: "POST", auth: null, data: { email: users[0].email, password } });
  assert.equal(login.status, 200); assert.equal(login.data.user.id, "owner"); assert.equal(login.data.user.plan, "pro");
  assert.equal((await db.findOne("users", { id: "owner" })).supabase_auth_id, "new-auth-uuid");
  assert.equal((await call("/pages/me", { auth: login.data.access_token })).data.user_id, "owner");
});

test("untrusted user metadata can never grant admin access or a paid plan", async () => {
  await auth.signup({ email: "attacker@example.com", password, name: "new" }, "", "challenge");
  auth.accounts.get("attacker@example.com").user_metadata = { name: "new", role: "admin", plan: "business", user_id: "owner" };
  const confirmed = await call("/auth/verify-email", { method: "POST", auth: null, data: { token_hash: "attacker@example.com", type: "email" } });
  assert.equal(confirmed.status, 200); assert.equal(confirmed.data.user.role, "user");
  assert.equal((await db.findOne("users", { email: "attacker@example.com" })).plan, "free");
  assert.equal((await call("/admin/users", { auth: confirmed.data.access_token })).status, 403);
});

test("confirmation links require the browser PKCE proof and unconfirmed identities are denied", async () => {
  assert.equal((await call("/auth/exchange", { method: "POST", auth: null, data: { code: "code" } })).status, 400);
  const identity = auth.accounts.get(users[0].email);
  delete identity.email_confirmed_at;
  assert.equal((await call("/auth/me")).status, 403);
  assert.equal((await call("/auth/verify-email", { method: "POST", auth: null, data: { token_hash: "invalid", type: "email" } })).status, 400);
});

test("refresh rotates the HttpOnly refresh cookie and revoked tokens cannot be used", async () => {
  const login = await call("/auth/login", { method: "POST", auth: null, data: { email: users[0].email, password } });
  const refresh = login.response.headers.getSetCookie().find(value => value.startsWith("sb_refresh_token=")).split(";")[0];
  const rotated = await call("/auth/refresh", { method: "POST", auth: null, headers: { Cookie: refresh } });
  assert.equal(rotated.status, 200);
  assert.notEqual(rotated.response.headers.getSetCookie().find(value => value.startsWith("sb_refresh_token=")).split(";")[0], refresh);
  assert.equal((await call("/auth/refresh", { method: "POST", auth: null, headers: { Cookie: refresh } })).status, 401);
});

test("email-only signup derives a readable display name without bypassing verification or the trial", async () => {
  const result = await call("/auth/register", { method: "POST", auth: null, data: { email: "Ali.Mohammadi+news@Example.com", password } });
  assert.equal(result.status, 202);
  assert.equal(auth.accounts.get("ali.mohammadi+news@example.com").user_metadata.name, "ali mohammadi");
  assert.equal(await db.findOne("users", { email: "ali.mohammadi+news@example.com" }), null);
  const confirmed = await call("/auth/verify-email", { method: "POST", auth: null, data: { token_hash: "ali.mohammadi+news@example.com", type: "email" } });
  assert.equal(confirmed.status, 200);
  assert.equal(confirmed.data.user.name, "ali mohammadi");
  assert.equal(confirmed.data.user.trial_active, true);
});

test("profile name updates persist in both Supabase metadata and the app without affecting ownership or plans", async () => {
  const changed = await call("/auth/me", { method: "PATCH", data: { name: "  علی محمدی  " } });
  assert.equal(changed.status, 200);
  assert.equal(changed.data.name, "علی محمدی");
  assert.equal(changed.data.id, "owner");
  assert.equal(changed.data.role, "user");
  assert.equal(changed.data.plan, "pro");
  assert.ok(!JSON.stringify(changed.data).includes("password_hash"));
  assert.equal(auth.accounts.get(users[0].email).user_metadata.name, "علی محمدی");
  assert.equal((await db.findOne("users", { id: "other" })).name, users[1].name);
  assert.equal((await call("/auth/me")).data.name, "علی محمدی");
  const login = await call("/auth/login", { method: "POST", auth: null, data: { email: users[0].email, password } });
  assert.equal(login.data.user.name, "علی محمدی");
});

test("profile updates reject unauthenticated, empty, oversized and privileged changes", async () => {
  assert.equal((await call("/auth/me", { method: "PATCH", auth: null, data: { name: "x" } })).status, 401);
  for (const data of [{ name: "  " }, { name: "x".repeat(121) }, { name: "x", role: "admin" }, { name: "x", plan: "business" }, { name: "x", id: "other" }, { name: "x", email: "other@example.com" }]) {
    assert.equal((await call("/auth/me", { method: "PATCH", data })).status, 422);
  }
  assert.equal((await call("/auth/me")).data.name, users[0].name);
  assert.equal(auth.accounts.get(users[0].email).user_metadata.name, users[0].name);
});

test("an unavailable Supabase profile update never returns success or changes the app name", async () => {
  auth.updateProfile = async () => { throw new HttpError(502, "دوباره تلاش کن."); };
  assert.equal((await call("/auth/me", { method: "PATCH", data: { name: "نام جدید" } })).status, 502);
  assert.equal((await db.findOne("users", { id: "owner" })).name, users[0].name);
});

test("missing signup fields have explicit Persian labels and name is never required", async () => {
  for (const data of [{}, { email: "valid@example.com" }, { password }]) {
    const result = await call("/auth/register", { method: "POST", auth: null, data });
    assert.equal(result.status, 422);
    assert.ok(result.data.detail.length > 0);
    assert.ok(result.data.detail.every(issue => ["email", "password"].includes(issue.loc[1])));
    assert.ok(result.data.detail.every(issue => /ایمیل|رمز عبور/.test(issue.msg) && issue.msg !== "Required"));
  }
});

test("older signup clients sending an empty name also get an email-derived display name", async () => {
  const result = await call("/auth/register", { method: "POST", auth: null, data: { name: "   ", email: "sara_nail@example.com", password } });
  assert.equal(result.status, 202);
  assert.equal(auth.accounts.get("sara_nail@example.com").user_metadata.name, "sara nail");
});

test("anonymous bootstrap needs neither a database connection nor configured authentication", async () => {
  const handler = createApi({ database: () => { throw new Error("must not connect"); }, auth: { getUser: () => { throw new Error("must not verify"); } } });
  const response = await handler(new Request("http://localhost/api/auth/session"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { user: null });
  assert.match(response.headers.get("cache-control"), /no-store/);
});

test("dashboard reload restores a valid access cookie without a client token or unnecessary refresh", async () => {
  let checks = 0;
  const getUser = auth.getUser;
  auth.getUser = async (...args) => { checks++; return getUser(...args); };
  auth.refresh = async () => { throw new Error("must not rotate a valid session"); };
  const result = await call("/auth/session", { auth: null, headers: { Cookie: "sb_access_token=" + token } });
  assert.equal(result.status, 200);
  assert.equal(result.data.user.id, "owner");
  assert.deepEqual(Object.keys(result.data), ["user"]);
  assert.equal(checks, 1);
  assert.ok(!JSON.stringify(result.data).includes("password_hash"));
});

test("reload can rotate a refresh-only cookie and return the same account with no readable tokens", async () => {
  for (const access of ["", "sb_access_token=expired; "]) {
    const refresh = await tokenFor(users[0], "refresh");
    const result = await call("/auth/session", { auth: null, headers: { Cookie: access + "sb_refresh_token=" + refresh } });
    assert.equal(result.status, 200);
    assert.equal(result.data.user.id, "owner");
    assert.equal(result.data.access_token, undefined);
    const cookies = result.response.headers.getSetCookie();
    assert.ok(cookies.some(cookie => cookie.startsWith("sb_access_token=provider-access-") && cookie.includes("HttpOnly")));
    assert.ok(cookies.some(cookie => cookie.startsWith("sb_refresh_token=provider-refresh-") && cookie.includes("HttpOnly")));
    // Each fixture refresh token is deliberately single-use.
    auth = createTestAuth(users, password); api = createApi(options());
  }
});

test("invalid bootstrap cookies become an anonymous session, without removing email-confirmation proof", async () => {
  const result = await call("/auth/session", { auth: null, headers: { Cookie: "sb_access_token=invalid; sb_refresh_token=invalid; sb_pkce=pending-confirmation" } });
  assert.equal(result.status, 200);
  assert.deepEqual(result.data, { user: null });
  const cookies = result.response.headers.getSetCookie();
  assert.equal(cookies.length, 2);
  assert.ok(cookies.every(cookie => cookie.includes("Max-Age=0") && !cookie.startsWith("sb_pkce=")));
});

test("temporary bootstrap provider errors keep cookies intact for a retry", async () => {
  auth.getUser = async () => { throw new HttpError(502, "دوباره تلاش کن."); };
  auth.refresh = async () => { throw new Error("must not refresh after an outage"); };
  const result = await call("/auth/session", { auth: null, headers: { Cookie: "sb_access_token=" + token + "; sb_refresh_token=valid" } });
  assert.equal(result.status, 502);
  assert.equal(result.response.headers.getSetCookie().length, 0);
});

test("bootstrap never bypasses suspended account checks by refreshing", async () => {
  await db.update("users", { id: "owner" }, { suspended: true });
  const result = await call("/auth/session", { auth: null, headers: { Cookie: "sb_access_token=" + token } });
  assert.equal(result.status, 403);
});

test("dashboard overview reuses statistics, scopes every record and lists future appointments in time order", async () => {
  await createPage();
  await db.insert("links", { id: "own-link", user_id: "owner", slug: "own", clicks: 17, active: true });
  await db.insert("links", { id: "other-link", user_id: "other", slug: "private-other", clicks: 900, active: true });
  const appts = [
    { id: "late", date: future(3), time: "12:00", status: "confirmed" },
    { id: "early", date: future(2), time: "09:00", status: "pending" },
    { id: "past", date: future(-2), time: "09:00", status: "pending" },
    { id: "cancelled", date: future(4), time: "09:00", status: "canceled" },
  ];
  for (const item of appts) await db.insert("appointments", { ...item, user_id: "owner", customer_name: "مشتری" });
  await db.insert("appointments", { id: "other-appt", user_id: "other", date: future(1), time: "09:00", status: "pending", customer_name: "private-other" });
  for (const item of [{ id: "unread", user_id: "owner", read: false }, { id: "read", user_id: "owner", read: true }, { id: "other-notice", user_id: "other", read: false }]) await db.insert("notifications", item);
  let checks = 0; const getUser = auth.getUser;
  auth.getUser = async (...args) => { checks++; return getUser(...args); };
  const result = await call("/dashboard/overview");
  assert.equal(result.status, 200);
  assert.equal(checks, 1);
  assert.equal(result.data.page.username, "clinic");
  assert.equal(result.data.stats.totals.clicks, 17);
  assert.equal(result.data.active_link_count, 1);
  assert.equal(result.data.unread_count, 1);
  assert.equal(result.data.upcoming_count, 2);
  assert.deepEqual(result.data.upcoming.map(item => item.id), ["early", "late"]);
  assert.ok(!JSON.stringify(result.data).includes("private-other"));
  assert.match(result.response.headers.get("cache-control"), /no-store/);
  assert.deepEqual(result.data.stats, (await call("/stats/overview")).data);
  const empty = await call("/dashboard/overview", { auth: adminToken });
  assert.equal(empty.data.page, null);
  assert.deepEqual(empty.data.upcoming, []);
  assert.equal(empty.data.unread_count, 0);
  assert.equal((await call("/dashboard/overview", { auth: null })).status, 401);
});

test("unauthenticated protected requests fail before any database initialization", async () => {
  const handler = createApi({ database: () => { throw new Error("must not initialize"); } });
  const result = await handler(new Request("http://localhost/api/dashboard/overview"));
  assert.equal(result.status, 401);
});

test("saving a contact phone persists without SMS and cannot grant phone verification", async () => {
  auth.updateProfile = async () => { throw new Error("not an auth identity change"); };
  api = createApi({ ...options(), sendOtp: async () => { throw new Error("must not send SMS"); } });
  const result = await call("/auth/phone", { method: "PATCH", data: { phone: "۰۹۱۲ ۱۲۳-۴۵۶۷" } });
  assert.equal(result.status, 200);
  assert.equal(result.data.phone, "09121234567");
  assert.equal(result.data.phone_verified, false);
  assert.equal(result.data.name, users[0].name);
  assert.equal(result.data.plan, "pro");
  assert.ok(!JSON.stringify(result.data).includes("password_hash"));
  assert.equal((await call("/auth/me")).data.phone, "09121234567");
  assert.equal((await db.findOne("users", { id: "other" })).phone, undefined);
  assert.equal(otpSent, null);
});

test("phone changes reset verification and invalidate challenges while unchanged numbers keep their real status", async () => {
  await db.update("users", { id: "owner" }, { phone: "09121234567", phone_verified: true });
  let result = await call("/auth/phone", { method: "PATCH", data: { phone: "۰۹۱۲۱۲۳۴۵۶۷" } });
  assert.equal(result.data.phone_verified, true);
  await call("/auth/phone/request-otp", { method: "POST", data: { phone: "09121234567" } });
  const pending = { ...otpSent };
  result = await call("/auth/phone", { method: "PATCH", data: { phone: "09351234567" } });
  assert.equal(result.status, 200);
  assert.equal(result.data.phone_verified, false);
  assert.equal(await db.count("phone_otps", { user_id: "owner" }), 0);
  assert.equal((await call("/auth/phone/verify-otp", { method: "POST", data: pending })).status, 400);
  assert.equal((await call("/auth/me")).data.phone, "09351234567");
});

test("contact phone rejects malformed and privileged input while accepting international and Arabic digits", async () => {
  assert.equal((await call("/auth/phone", { method: "PATCH", auth: null, data: { phone: "09121234567" } })).status, 401);
  for (const data of [{}, { phone: "" }, { phone: "abc12345678" }, { phone: "09123" }, { phone: 9121234567 }, { phone: "09121234567", phone_verified: true }, { phone: "09121234567", id: "other" }]) {
    assert.equal((await call("/auth/phone", { method: "PATCH", data })).status, 422);
  }
  const result = await call("/auth/phone", { method: "PATCH", data: { phone: "٠٠٩٨ (٩١٢) ١٢٣-٤٥٦٧" } });
  assert.equal(result.status, 200);
  assert.equal(result.data.phone, "+989121234567");
});
