import { fail } from "./http.mjs";

export async function sendPasswordReset(email, token) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const site = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (!key || !from || !site) {
    if (process.env.NODE_ENV === "production") fail(503, "ارسال لینک بازیابی فعلاً امکان‌پذیر نیست؛ کمی بعد دوباره تلاش کن.");
    return; // Local development persists the token; never logs it or pretends SMS delivery.
  }
  const link = new URL("/reset-password", site);
  link.searchParams.set("token", token);
  let response;
  try {
    response = await fetch("https://api.resend.com/emails", { method: "POST", signal: AbortSignal.timeout(15000),
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [email], subject: "بازیابی رمز عبور وانیکس", text: "برای تغییر رمز عبور وانیکس از این لینک استفاده کن. اعتبار لینک یک ساعت است:\n" + link.href }),
    });
  } catch { fail(502, "ارتباط با سرویس ایمیل برقرار نشد."); }
  if (!response.ok) fail(502, "ارسال ایمیل بازیابی انجام نشد.");
}
export async function sendPhoneCode(phone, code) {
  if (!process.env.SMS_WEBHOOK_URL || !process.env.SMS_WEBHOOK_SECRET) fail(503, "ارسال کد فعلاً امکان‌پذیر نیست؛ کمی بعد دوباره تلاش کن.");
  let response;
  try {
    response = await fetch(process.env.SMS_WEBHOOK_URL, { method: "POST", signal: AbortSignal.timeout(15000), headers: { Authorization: "Bearer " + process.env.SMS_WEBHOOK_SECRET, "Content-Type": "application/json" }, body: JSON.stringify({ phone, code }) });
  } catch { fail(502, "ارتباط با سرویس پیامک برقرار نشد."); }
  if (!response.ok) fail(502, "ارسال کد تأیید انجام نشد.");
}
