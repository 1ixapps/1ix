export const PLAN_LABELS = { free: "رایگان", pro: "حرفه‌ای", business: "کسب‌وکار" };
export const TELEGRAM_SUPPORT_URL = "https://t.me/1ix_ir";

export function planAction(user, plan) {
  if (!user) return { to: "/signup", label: plan.cta || "شروع کنید" };
  if (user.plan === plan.id) return { to: "/dashboard/plan", label: "امکانات پلن شما" };
  return { to: "/dashboard/plan?plan=" + encodeURIComponent(plan.id), label: "جزئیات پلن " + plan.name };
}

export function safeAuthReturn(value, fallback = "/dashboard") {
  return typeof value === "string" && value.startsWith("/dashboard") &&
    /^\/dashboard(?:\/|\?|$)/.test(value) && !/[\\\r\n]/.test(value) ? value : fallback;
}
