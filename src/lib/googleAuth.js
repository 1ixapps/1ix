import api from "./api";

// The server prepares the PKCE flow and keeps the verifier in an HttpOnly cookie.
export async function beginGoogleSignIn(next, redirect = url => window.location.assign(url)) {
  const { data } = await api.post("/auth/oauth/google", next ? { next } : {});
  let target;
  try { target = new URL(data.url); } catch { throw new Error("آماده‌سازی ورود انجام نشد. دوباره تلاش کن."); }
  if (target.protocol !== "https:" || target.username || target.password || target.pathname !== "/auth/v1/authorize" || target.searchParams.get("provider") !== "google") throw new Error("آماده‌سازی ورود انجام نشد. دوباره تلاش کن.");
  redirect(target.href);
}
export const googleAuthErrors = {
  cancelled: "ورود با گوگل کامل نشد. دوباره تلاش کن یا با ایمیل وارد شو.",
  expired: "درخواست ورود منقضی شده است. دوباره روی ورود با گوگل بزن.",
  blocked: "ورود به این حساب انجام نشد. از روش ورود قبلی استفاده کن یا با پشتیبانی تماس بگیر.",
  unavailable: "ورود با گوگل انجام نشد. کمی بعد دوباره تلاش کن یا با ایمیل وارد شو.",
};
