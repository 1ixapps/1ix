import { randomUUID } from "node:crypto";
import { body, fail, json } from "./http.mjs";
import { schemas } from "./validation.mjs";

export function adminRoutes(add) {
  const newest = [["created_at", -1]];
  add("GET", "/admin/users", async ({ db, url }) => {
    const q = url.searchParams.get("q");
    const filter = q ? { $or: [{ email: { $regex: q, $options: "i" } }, { name: { $regex: q, $options: "i" } }] } : {};
    return json(await db.find("users", filter, { projection: { password_hash: 0 }, sort: newest, limit: 500 }));
  }, "admin");
  add("PATCH", "/admin/users/:id", async ({ request, db, params, user }) => {
    const patch = await body(request, schemas.adminUser);
    if (!Object.keys(patch).length) fail(400, "فیلدی برای تغییر انتخاب نشده است.");
    if (params.id === user.id && (patch.role === "user" || patch.suspended === true)) fail(400, "نمی‌توانی دسترسی مدیریت حساب فعلی را غیرفعال کنی.");
    if (!await db.update("users", { id: params.id }, patch)) fail(404, "کاربر یافت نشد");
    return json(await db.findOne("users", { id: params.id }, { password_hash: 0 }));
  }, "admin");
  add("DELETE", "/admin/users/:id", async ({ db, params }) => { await db.remove("users", { id: params.id, role: { $ne: "admin" } }); return json({ ok: true }); }, "admin");
  for (const entity of ["pages", "links", "appointments", "support_tickets"]) {
    add("GET", "/admin/" + (entity === "support_tickets" ? "tickets" : entity), async ({ db }) => json(await db.find(entity, {}, { sort: newest, limit: 500 })), "admin");
  }
  add("PATCH", "/admin/pages/:id", async ({ request, db, params }) => {
    const patch = await body(request, schemas.adminPage);
    if (!await db.update("pages", { id: params.id }, patch)) fail(404, "صفحه یافت نشد");
    return json(await db.findOne("pages", { id: params.id }));
  }, "admin");
  add("PATCH", "/admin/tickets/:id", async ({ request, db, params }) => {
    const patch = await body(request, schemas.ticket);
    if (!await db.update("support_tickets", { id: params.id }, patch)) fail(404, "درخواست یافت نشد");
    return json(await db.findOne("support_tickets", { id: params.id }));
  }, "admin");
  add("GET", "/admin/announcements", async ({ db }) => json(await db.find("announcements", {}, { sort: newest, limit: 100 })), "admin");
  add("POST", "/admin/announcements", async ({ request, db }) => {
    const input = await body(request, schemas.announcement);
    const announcement = { id: randomUUID(), ...input, created_at: new Date().toISOString() };
    await db.insert("announcements", announcement); return json(announcement);
  }, "admin");
  add("DELETE", "/admin/announcements/:id", async ({ db, params }) => { await db.remove("announcements", { id: params.id }); return json({ ok: true }); }, "admin");
}
