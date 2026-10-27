import { fail } from "./http.mjs";
import { normalizeDay, isoDate } from "./validation.mjs";

const DAY = 86400000;
const weekday = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
export const minutes = value => Number(value.split(":")[0]) * 60 + Number(value.split(":")[1]);
const hhmm = value => String(Math.floor(value / 60)).padStart(2, "0") + ":" + String(value % 60).padStart(2, "0");
export function tehranParts(now = new Date()) {
  const values = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now).map(p => [p.type, p.value]));
  return { date: values.year + "-" + values.month + "-" + values.day, minutes: Number(values.hour) * 60 + Number(values.minute) };
}
export function tehranDate(value = new Date()) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? tehranParts(date).date : null;
}
export function lastDays(count, now = new Date()) {
  const end = Date.parse(tehranDate(now) + "T12:00:00Z");
  return Array.from({ length: count }, (_, index) => new Date(end - (count - index - 1) * DAY).toISOString().slice(0, 10));
}
export async function availability(db, page, requestedDate, serviceId, now = new Date()) {
  if (!isoDate.safeParse(requestedDate).success) fail(400, "تاریخ نامعتبر");
  const booking = page.booking || {};
  const result = reason => ({ date: requestedDate, slots: [], reason });
  if (booking.enabled === false) return result("disabled");
  const interval = Math.max(5, Number(booking.slot_minutes) || 30);
  const buffer = Math.max(0, Number(booking.buffer_minutes) || 0);
  const lead = Math.max(0, Number(booking.lead_time_hours) || 0);
  const advance = Math.max(1, Number(booking.advance_days) || 30);
  if ((booking.holidays || []).includes(requestedDate)) return result("holiday");
  const today = tehranParts(now);
  const daysAway = (Date.parse(requestedDate + "T12:00:00Z") - Date.parse(today.date + "T12:00:00Z")) / DAY;
  if (daysAway < 0) return result("past");
  if (daysAway > advance) return result("too_far");
  if (!page.working_hours?.length) return result("not_configured");
  const day = weekday[new Date(requestedDate + "T12:00:00Z").getUTCDay()];
  const hours = page.working_hours.find(w => normalizeDay(w.day) === day && w.enabled !== false);
  if (!hours) return result("closed");
  let duration = interval;
  if (serviceId) {
    const service = await db.findOne("services", { id: serviceId, user_id: page.user_id, active: true });
    if (!service) fail(400, "خدمت انتخاب‌شده در دسترس نیست.");
    duration = Math.max(5, Number(service.duration_minutes) || interval);
  }
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hours.open_time) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hours.close_time)) return result("invalid_schedule");
  const start = minutes(hours.open_time), end = minutes(hours.close_time);
  if (start >= end) return result("invalid_schedule");
  const candidates = [];
  for (let current = start; current + duration <= end; current += interval) {
    if (daysAway * 1440 + current >= today.minutes + lead * 60) candidates.push(current);
  }
  if (!candidates.length) return { ...result("lead_time"), duration_minutes: duration, working_hours: hours };
  const occupied = await db.find("appointments", { user_id: page.user_id, date: requestedDate, status: { $in: ["pending","confirmed"] } }, { limit: 20000 });
  const free = candidates.filter(startTime => occupied.every(appt => {
    const existingStart = minutes(appt.time);
    const existingEnd = existingStart + (Number(appt.duration_minutes) || duration) + Math.max(buffer, Number(appt.buffer_minutes) || 0);
    return startTime + duration + buffer <= existingStart || startTime >= existingEnd;
  })).map(hhmm);
  return { date: requestedDate, slots: free, duration_minutes: duration, working_hours: hours, reason: free.length ? null : "full" };
}
export const availabilityMessages = {
  holiday: "این روز تعطیل اعلام شده است.", past: "تاریخ انتخاب‌شده گذشته است.",
  too_far: "امکان رزرو در این بازه زمانی وجود ندارد.", closed: "در این روز ساعت کاری تعریف نشده است.",
  not_configured: "رزرو آنلاین فعلاً در دسترس نیست؛ از راه‌های ارتباطی صفحه هماهنگ کن.", invalid_schedule: "رزرو آنلاین فعلاً در دسترس نیست؛ از راه‌های ارتباطی صفحه هماهنگ کن.",
  full: "ظرفیت این روز تکمیل شده است.", lead_time: "زمان انتخاب‌شده با فاصلهٔ مجاز رزرو سازگار نیست.", disabled: "نوبت‌دهی غیرفعال است.",
};
