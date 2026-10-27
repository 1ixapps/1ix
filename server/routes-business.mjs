import { randomUUID, randomBytes } from "node:crypto";
import { body, fail, json } from "./http.mjs";
import { schemas, defaultHours, bookingDefaults, themeDefaults, nonNull } from "./validation.mjs";

const newest = [["created_at", -1]];
export function businessRoutes(add, { storage }) {
  add("GET", "/pages/me", async ({ db, user }) => json(await db.findOne("pages", { user_id: user.id })), "user");
  add("POST", "/pages", async ({ request, db, user }) => {
    const input = await body(request, schemas.pageCreate);
    const now = new Date().toISOString();
    const page = {
      id: randomUUID(), user_id: user.id, ...input, category: input.category || null, bio: input.bio || null, profile_image: null, cover_image: null,
      location: null, map_url: null, address: null, actions: [], working_hours: defaultHours(),
      gallery: [], testimonials: [], faqs: [], price_list: [], about: null,
      theme: { ...themeDefaults }, booking: { ...bookingDefaults }, seo: { title: null, description: null, keywords: null },
      published: false, views: 0, created_at: now, updated_at: now,
    };
    await db.transaction(async tx => {
      if (await tx.findOne("pages", { username: input.username })) fail(400, "این نام کاربری قبلاً انتخاب شده است");
      if (await tx.findOne("pages", { user_id: user.id })) fail(400, "شما قبلاً یک صفحه ساخته‌اید");
      await tx.insert("pages", page);
    });
    return json(page);
  }, "user");
  add("PATCH", "/pages/me", async ({ request, db, user }) => {
    const patch = nonNull(await body(request, schemas.pageUpdate));
    if (!await db.update("pages", { user_id: user.id }, { ...patch, updated_at: new Date().toISOString() })) fail(404, "صفحه یافت نشد");
    return json(await db.findOne("pages", { user_id: user.id }));
  }, "user");
  add("DELETE", "/pages/me", async ({ db, user }) => { await db.remove("pages", { user_id: user.id }); return json({ ok: true }); }, "user");
  add("GET", "/pages/check-username/:username", async ({ db, params }) => json({ available: !await db.findOne("pages", { username: params.username.toLowerCase() }) }));

  add("GET", "/links", async ({ db, user }) => json(await db.find("links", { user_id: user.id }, { sort: newest, limit: 1000 })), "user");
  add("POST", "/links", async ({ request, db, user }) => {
    const input = await body(request, schemas.linkCreate);
    let slug = input.slug || randomBytes(4).toString("hex");
    while (await db.findOne("links", { slug })) {
      if (input.slug) fail(400, "این آدرس قبلاً استفاده شده");
      slug = randomBytes(4).toString("hex");
    }
    const link = { id: randomUUID(), user_id: user.id, slug, destination: input.destination, title: input.title || null, clicks: 0, active: true, created_at: new Date().toISOString() };
    await db.insert("links", link);
    return json(link);
  }, "user");
  add("PATCH", "/links/:id", async ({ request, db, user, params }) => {
    const patch = nonNull(await body(request, schemas.linkUpdate));
    if (!await db.update("links", { id: params.id, user_id: user.id }, patch)) fail(404, "لینک یافت نشد");
    return json(await db.findOne("links", { id: params.id, user_id: user.id }));
  }, "user");
  add("DELETE", "/links/:id", async ({ db, user, params }) => {
    if (!await db.remove("links", { id: params.id, user_id: user.id })) fail(404, "لینک یافت نشد");
    return json({ ok: true });
  }, "user");
  add("GET", "/links/:id/stats", async ({ db, user, params }) => {
    const link = await db.findOne("links", { id: params.id, user_id: user.id });
    if (!link) fail(404, "لینک یافت نشد");
    return json({ link, clicks: await db.find("link_clicks", { link_id: params.id }, { sort: [["at", -1]], limit: 500 }) });
  }, "user");
  const resolveLink = async ({ db, request, params }, redirect) => db.transaction(async tx => {
    const link = await tx.findOne("links", { slug: params.slug.toLowerCase(), active: true });
    if (!link) fail(404, "لینک پیدا نشد");
    if (!/^https?:\/\//i.test(link.destination)) fail(400, "مقصد لینک معتبر نیست.");
    await tx.update("links", { id: link.id }, {}, { increments: { clicks: 1 } });
    await tx.insert("link_clicks", { link_id: link.id, at: new Date().toISOString(), ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null, ua: request.headers.get("user-agent"), referer: request.headers.get("referer") });
    return redirect ? new Response(null, { status: 302, headers: { Location: link.destination, "Cache-Control": "no-store" } }) : json({ destination: link.destination, title: link.title || null });
  });
  add("GET", "/links/resolve/:slug", context => resolveLink(context, false));
  add("GET", "/r/:slug", context => resolveLink(context, true));

  add("GET", "/services", async ({ db, user }) => json(await db.find("services", { user_id: user.id }, { sort: newest, limit: 500 })), "user");
  add("POST", "/services", async ({ request, db, user }) => {
    const input = await body(request, schemas.serviceCreate);
    const service = { id: randomUUID(), user_id: user.id, ...input, active: true, created_at: new Date().toISOString() };
    await db.insert("services", service); return json(service);
  }, "user");
  add("PATCH", "/services/:id", async ({ request, db, user, params }) => {
    const patch = nonNull(await body(request, schemas.serviceUpdate));
    if (!await db.update("services", { id: params.id, user_id: user.id }, patch)) fail(404, "سرویس یافت نشد");
    return json(await db.findOne("services", { id: params.id, user_id: user.id }));
  }, "user");
  add("DELETE", "/services/:id", async ({ db, user, params }) => {
    if (!await db.remove("services", { id: params.id, user_id: user.id })) fail(404, "سرویس یافت نشد");
    return json({ ok: true });
  }, "user");

  add("GET", "/notifications", async ({ db, user }) => json(await db.find("notifications", { user_id: user.id }, { sort: newest, limit: 100 })), "user");
  add("GET", "/notifications/unread-count", async ({ db, user }) => json({ count: await db.count("notifications", { user_id: user.id, read: false }) }), "user");
  add("POST", "/notifications", async ({ request, db, user }) => {
    const input = await body(request, schemas.notification);
    const notification = { id: randomUUID(), user_id: user.id, ...input, read: false, created_at: new Date().toISOString() };
    await db.insert("notifications", notification); return json(notification);
  }, "user");
  add("POST", "/notifications/:id/read", async ({ db, user, params }) => { await db.update("notifications", { id: params.id, user_id: user.id }, { read: true }); return json({ ok: true }); }, "user");
  add("POST", "/notifications/read-all", async ({ db, user }) => { await db.update("notifications", { user_id: user.id, read: false }, { read: true }, { many: true }); return json({ ok: true }); }, "user");
  add("DELETE", "/notifications/:id", async ({ db, user, params }) => { await db.remove("notifications", { id: params.id, user_id: user.id }); return json({ ok: true }); }, "user");

  add("POST", "/uploads/sign", async ({ request, user }) => json(await storage.sign(await body(request, schemas.upload), user)), "user");
  add("POST", "/uploads", async ({ request, user }) => {
    // Compatibility for old clients; the current UI uses direct signed uploads.
    if (Number(request.headers.get("content-length") || 0) > 4 * 1024 * 1024) fail(413, "برای فایل بزرگ از آپلود مستقیم استفاده کن.");
    let form; try { form = await request.formData(); } catch { fail(400, "فایل معتبر دریافت نشد."); }
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function") fail(422, "فایل انتخاب نشده است.");
    const { uploadInfo } = await import("./storage.mjs");
    const { extension, contentType } = uploadInfo(file.name, file.size);
    const name = user.id + "/" + randomUUID().replaceAll("-", "") + extension;
    const url = await storage.put(name, new Uint8Array(await file.arrayBuffer()), contentType);
    return json({ url, filename: name });
  }, "user");
  add("GET", "/uploads/:filename", async ({ params }) => new Response(null, { status: 302, headers: { Location: await storage.legacy(params.filename), "Cache-Control": "public, max-age=3600" } }));
}
