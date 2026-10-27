import { randomUUID } from "node:crypto";
import { body, fail, json } from "./http.mjs";
import { schemas, isoDate, nonNull } from "./validation.mjs";
import { availability, availabilityMessages, tehranParts } from "./booking.mjs";

export async function appointmentNotification(db, appt) {
  await db.insert("notifications", { id: appt.id + "-notif", user_id: appt.user_id, title: "نوبت جدید",
    body: appt.customer_name + " نوبتی در " + appt.date + " ساعت " + appt.time + " درخواست کرد.",
    type: "appointment", read: false, created_at: new Date().toISOString() });
}
export function bookingRoutes(add) {
  add("GET", "/appointments", async ({ db, user, url }) => {
    const filter = { user_id: user.id };
    if (url.searchParams.get("status")) filter.status = url.searchParams.get("status");
    return json(await db.find("appointments", filter, { sort: [["date", -1], ["time", -1]], limit: 2000 }));
  }, "user");
  add("POST", "/appointments", async ({ request, db, user }) => {
    const input = await body(request, schemas.appointment);
    return db.transaction(async tx => {
      await tx.advisoryLock("booking:" + user.id + ":" + input.date);
      let service = null;
      if (input.service_id) {
        service = await tx.findOne("services", { id: input.service_id, user_id: user.id });
        if (!service) fail(400, "خدمت انتخاب‌شده متعلق به این حساب نیست.");
      }
      const appt = { id: randomUUID(), user_id: user.id, ...input, service_title: service?.title || null,
        duration_minutes: service?.duration_minutes || 30, status: "pending", created_at: new Date().toISOString() };
      await tx.insert("appointments", appt);
      await appointmentNotification(tx, appt);
      return json(appt);
    });
  }, "user");
  add("PATCH", "/appointments/:id", async ({ request, db, user, params }) => {
    const patch = nonNull(await body(request, schemas.appointmentUpdate));
    if (!await db.update("appointments", { id: params.id, user_id: user.id }, patch)) fail(404, "نوبت یافت نشد");
    return json(await db.findOne("appointments", { id: params.id, user_id: user.id }));
  }, "user");
  add("DELETE", "/appointments/:id", async ({ db, user, params }) => {
    if (!await db.remove("appointments", { id: params.id, user_id: user.id })) fail(404, "نوبت یافت نشد");
    return json({ ok: true });
  }, "user");
  add("GET", "/appointments/customers", async ({ db, user }) => json(await db.customers(user.id)), "user");
  add("GET", "/appointments/calendar", async ({ db, user, url }) => {
    const today = tehranParts().date;
    const year = Number(url.searchParams.get("year") || today.slice(0, 4));
    const month = Number(url.searchParams.get("month") || today.slice(5, 7));
    if (!Number.isInteger(year) || !Number.isInteger(month) || year < 1900 || year > 2200 || month < 1 || month > 12) fail(400, "سال یا ماه معتبر نیست.");
    const start = year + "-" + String(month).padStart(2, "0") + "-01";
    const next = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
    const appts = await db.find("appointments", { user_id: user.id, date: { $gte: start, $lt: next } }, { projection: { date: 1, status: 1, time: 1, customer_name: 1, id: 1, service_title: 1 }, limit: 2000 });
    const by_date = {};
    for (const appt of appts) (by_date[appt.date] ||= []).push(appt);
    return json({ year, month, by_date });
  }, "user");
  add("GET", "/appointments/slots/:username", async ({ db, params, url }) => {
    const date = url.searchParams.get("date");
    if (!isoDate.safeParse(date).success) fail(400, "تاریخ نامعتبر");
    const page = await db.findOne("pages", { username: params.username.toLowerCase(), published: true });
    if (!page || page.suspended) fail(404, "صفحه یافت نشد");
    const appts = await db.find("appointments", { user_id: page.user_id, date, status: { $in: ["pending","confirmed"] } }, { projection: { time: 1 }, limit: 2000 });
    return json({ booked: appts.map(appt => appt.time) });
  });
  add("GET", "/appointments/available-slots/:username", async ({ db, params, url, user }) => {
    let page = await db.findOne("pages", { username: params.username.toLowerCase(), published: true });
    if (!page && user) page = await db.findOne("pages", { username: params.username.toLowerCase(), user_id: user.id });
    if (!page || page.suspended) fail(404, "صفحه یافت نشد");
    return json(await availability(db, page, url.searchParams.get("date"), url.searchParams.get("service_id")));
  }, "optional");

  add("GET", "/public/page/:username", async ({ db, params }) => {
    const page = await db.findOne("pages", { username: params.username.toLowerCase(), published: true });
    if (!page || page.suspended) fail(404, "صفحه یافت نشد یا منتشر نشده");
    await db.update("pages", { id: page.id }, {}, { increments: { views: 1 } });
    const services = await db.find("services", { user_id: page.user_id, active: true }, { limit: 200 });
    return json({ page, services });
  });
  add("POST", "/public/page/:username/book", async ({ request, db, params }) => {
    const input = await body(request, schemas.appointment);
    return db.transaction(async tx => {
      const page = await tx.findOne("pages", { username: params.username.toLowerCase(), published: true });
      if (!page || page.suspended) fail(404, "صفحه یافت نشد");
      await tx.advisoryLock("booking:" + page.user_id + ":" + input.date);
      const free = await availability(tx, page, input.date, input.service_id);
      if (!free.slots.includes(input.time)) fail(400, availabilityMessages[free.reason] || "این ساعت برای رزرو در دسترس نیست.");
      const service = input.service_id ? await tx.findOne("services", { id: input.service_id, user_id: page.user_id, active: true }) : null;
      const appt = { id: randomUUID(), user_id: page.user_id, ...input, service_title: service?.title || null,
        duration_minutes: free.duration_minutes, buffer_minutes: Math.max(0, Number(page.booking?.buffer_minutes) || 0),
        status: "pending", created_at: new Date().toISOString() };
      await tx.insert("appointments", appt);
      await appointmentNotification(tx, appt);
      return json({ ok: true, appointment_id: appt.id, message: page.booking?.confirmation_message || "نوبت شما با موفقیت ثبت شد. منتظر تأیید باشید." });
    });
  });
  add("POST", "/public/support", async ({ request, db }) => {
    const input = await body(request, schemas.support);
    const ticket = { id: randomUUID(), user_id: null, ...input, status: "open", created_at: new Date().toISOString() };
    await db.insert("support_tickets", ticket); return json({ ok: true, id: ticket.id });
  });
}
