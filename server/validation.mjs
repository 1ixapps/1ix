import { z } from "zod";
import { randomUUID } from "node:crypto";

const short = z.string().max(500);
const text = z.string().max(20000);
export const email = z.string({ required_error: "ایمیل را وارد کن.", invalid_type_error: "ایمیل باید به‌صورت متن وارد شود." }).trim().email("ایمیل معتبر وارد کن.").max(320).transform(value => value.toLowerCase());
export function normalizeContactPhone(value) {
  return String(value || "").replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/[\s()-]/g, "").replace(/^00/, "+");
}
const contactPhone = z.string({ required_error: "شماره موبایل را وارد کن.", invalid_type_error: "شماره موبایل معتبر وارد کن." })
  .max(50, "شماره موبایل معتبر وارد کن.").transform(normalizeContactPhone)
  .pipe(z.string().regex(/^(?:09[0-9]{9}|\+[1-9][0-9]{7,14})$/, "شماره موبایل معتبر وارد کن."));
export const dayIds = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];
export function normalizeDay(value) {
  const key = String(value || "").trim().toLowerCase().replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[\s\u200c\u200f\u200e_-]/g, "");
  const aliases = { شنبه: "saturday", یکشنبه: "sunday", دوشنبه: "monday", سهشنبه: "tuesday", چهارشنبه: "wednesday", پنجشنبه: "thursday", جمعه: "friday", sat: "saturday", sun: "sunday", mon: "monday", tue: "tuesday", wed: "wednesday", thu: "thursday", fri: "friday", shanbe: "saturday", yekshanbe: "sunday", doshanbe: "monday", seshanbe: "tuesday", chaharshanbe: "wednesday", panjshanbe: "thursday", jome: "friday", jomeh: "friday" };
  return aliases[key] || key;
}
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(value + "T12:00:00Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "تاریخ معتبر وارد کن.");
export const hhmm = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "ساعت معتبر وارد کن.");
const nullable = schema => schema.nullable().optional();
const workingHour = z.object({
  day: z.string().transform(normalizeDay).pipe(z.enum(dayIds)),
  enabled: z.boolean().default(true), open_time: hhmm.default("09:00"), close_time: hhmm.default("18:00"),
});
export function defaultHours() { return dayIds.map(day => ({ day, enabled: day !== "friday", open_time: "09:00", close_time: "18:00" })); }
const action = z.object({ type: z.enum(["call","whatsapp","telegram","instagram","location","email","website","custom"]), label: nullable(short), value: z.string().max(4000), icon: nullable(short) });
export const bookingDefaults = { enabled: true, slot_minutes: 30, buffer_minutes: 0, lead_time_hours: 2, advance_days: 30, holidays: [], confirmation_message: null };
export const themeDefaults = { primary_color: "#4f46e5", accent_color: "#f59e0b", button_style: "rounded", banner_url: null, featured_action: null };
const booking = z.object({
  enabled: z.boolean().default(true), slot_minutes: z.number().int().min(5).max(1440).default(30),
  buffer_minutes: z.number().int().min(0).max(1440).default(0),
  lead_time_hours: z.number().int().min(0).max(8760).default(2),
  advance_days: z.number().int().min(1).max(3650).default(30),
  holidays: z.array(isoDate).max(1000).default([]), confirmation_message: nullable(short),
});
const theme = z.object({
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#4f46e5"),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#f59e0b"),
  button_style: z.enum(["pill", "rounded", "square"]).default("rounded"),
  banner_url: nullable(z.string().max(4000)), featured_action: nullable(action),
});
export const schemas = {
  register: z.object({ email, password: z.string({ required_error: "رمز عبور را وارد کن.", invalid_type_error: "رمز عبور باید به‌صورت متن وارد شود." }).min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد.").max(128, "رمز عبور طولانی است.").refine(value => Buffer.byteLength(value, "utf8") <= 72, "رمز عبور طولانی است."), name: z.preprocess(value => typeof value === "string" && !value.trim() ? undefined : value, z.string({ invalid_type_error: "نام باید به‌صورت متن وارد شود." }).trim().max(120, "نام نباید بیشتر از ۱۲۰ کاراکتر باشد.").optional()) }),
  profile: z.object({ name: z.string({ required_error: "نام و نام خانوادگی را وارد کن.", invalid_type_error: "نام باید به‌صورت متن وارد شود." }).trim().min(1, "نام و نام خانوادگی را وارد کن.").max(120, "نام نباید بیشتر از ۱۲۰ کاراکتر باشد.") }).strict(),
  login: z.object({ email, password: z.string().max(500) }),
  forgot: z.object({ email }),
  reset: z.object({ password: z.string({ required_error: "رمز عبور را وارد کن.", invalid_type_error: "رمز عبور باید به‌صورت متن وارد شود." }).min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد.").max(128, "رمز عبور طولانی است.").refine(value => Buffer.byteLength(value, "utf8") <= 72, "رمز عبور طولانی است.") }),
  exchange: z.object({ code: z.string().min(1).max(2000) }),
  verifyEmail: z.object({ token_hash: z.string().min(1).max(2000), type: z.enum(["email","signup","recovery"]) }),
  contactPhone: z.object({ phone: contactPhone }).strict(),
  phone: z.object({ phone: z.string().min(8).max(20) }),
  verifyPhone: z.object({ phone: z.string().min(8).max(20), code: z.string().regex(/^\d{6}$/) }),
  pageCreate: z.object({ username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9_-]+$/).transform(s => s.toLowerCase()), business_name: z.string().trim().min(1).max(300), category: nullable(short), bio: nullable(text) }),
  pageUpdate: z.object({
    business_name: z.string().trim().min(1).max(300).optional(), category: nullable(short), bio: nullable(text),
    profile_image: nullable(z.string().max(4000)), cover_image: nullable(z.string().max(4000)),
    location: nullable(short), map_url: nullable(z.string().max(4000)), address: nullable(text), about: nullable(text),
    actions: z.array(action).max(100).optional(), working_hours: z.array(workingHour).max(7).optional(),
    gallery: z.array(z.object({ id: z.string().default(randomUUID), url: z.string().max(4000), caption: nullable(short) })).max(500).optional(),
    testimonials: z.array(z.object({ id: z.string().default(randomUUID), author: short, text, rating: z.number().int().min(1).max(5).default(5) })).max(200).optional(),
    faqs: z.array(z.object({ id: z.string().default(randomUUID), question: short, answer: text })).max(200).optional(),
    price_list: z.array(z.object({ id: z.string().default(randomUUID), title: short, price: short, description: nullable(text) })).max(500).optional(),
    theme: theme.optional(), booking: booking.optional(),
    seo: z.object({ title: nullable(short), description: nullable(text), keywords: nullable(text) }).optional(),
    published: z.boolean().optional(),
  }),
  linkCreate: z.object({ slug: nullable(z.string().max(60).regex(/^[a-zA-Z0-9_-]+$/).transform(s => s.toLowerCase())), destination: z.string().url().refine(value => /^https?:\/\//i.test(value), "فقط آدرس http یا https مجاز است."), title: nullable(short) }),
  serviceCreate: z.object({ title: z.string().trim().min(1).max(300), description: nullable(text), duration_minutes: z.number().int().min(5).max(1440).default(30), price: z.number().int().min(0).max(100000000000).default(0) }),
  appointment: z.object({ service_id: nullable(z.string().max(200)), customer_name: z.string().trim().min(1).max(300), customer_phone: z.string().min(1).max(30), customer_email: nullable(z.union([email, z.literal("")])), date: isoDate, time: hhmm, notes: nullable(text) }),
  appointmentUpdate: z.object({ status: z.enum(["pending", "confirmed", "canceled", "completed"]).optional(), notes: nullable(text), date: isoDate.optional(), time: hhmm.optional() }),
  notification: z.object({ title: short, body: text, type: z.enum(["info","appointment","system","broadcast"]).default("info") }),
  support: z.object({ name: z.string().min(1).max(300), email, subject: short, message: text }),
  announcement: z.object({ title: short, body: text, active: z.boolean().default(true) }),
  adminUser: z.object({ role: z.enum(["user","admin"]).optional(), plan: z.enum(["free","pro","business"]).optional(), suspended: z.boolean().optional(), name: z.string().trim().min(1, "نام و نام خانوادگی را وارد کن.").max(120, "نام نباید بیشتر از ۱۲۰ کاراکتر باشد.").optional() }),
  adminPage: z.object({ published: z.boolean().optional(), suspended: z.boolean().optional(), business_name: z.string().min(1).max(300).optional() }),
  ticket: z.object({ status: z.enum(["open","in_progress","resolved","closed"]) }),
  upload: z.object({ filename: z.string().min(1).max(255), size: z.number().int().min(1).max(5 * 1024 * 1024), content_type: z.string().max(100).optional() }),
};
schemas.linkUpdate = schemas.linkCreate.partial().extend({ active: z.boolean().optional() });
schemas.serviceUpdate = schemas.serviceCreate.partial().extend({ active: z.boolean().optional() });

export function nonNull(values) { return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== null && value !== undefined)); }
