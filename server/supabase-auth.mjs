import { fail, HttpError } from "./http.mjs";

export function authConfig() {
  const configured = (...names) => names.map(name => process.env[name]?.trim()).find(Boolean);
  const raw = configured("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  // Accept both server-side names and the official Next.js quickstart names.
  // Never fall back to the elevated Storage key for public authentication.
  const key = configured("SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!raw) fail(503, "سرویس ورود موقتاً در دسترس نیست. لطفاً بعداً دوباره تلاش کن.");
  if (!key) fail(503, "سرویس ورود موقتاً در دسترس نیست. لطفاً بعداً دوباره تلاش کن.");
  let url;
  try { url = new URL(raw); } catch { fail(503, "سرویس ورود موقتاً در دسترس نیست. لطفاً بعداً دوباره تلاش کن."); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) fail(503, "سرویس ورود موقتاً در دسترس نیست. لطفاً بعداً دوباره تلاش کن.");
  return { url: url.origin, key };
}

export function providerError(status, data = {}) {
  const code = data.error_code || data.code || data.error;
  const messages = {
    invalid_credentials: [401, "ایمیل یا رمز عبور نادرست است."],
    email_not_confirmed: [403, "ابتدا ایمیلت را از طریق لینک تأیید کن؛ سپس وارد شو."],
    user_already_exists: [400, "این ایمیل قبلاً ثبت شده است. وارد شو یا رمزت را بازیابی کن."],
    email_exists: [400, "این ایمیل قبلاً ثبت شده است."],
    weak_password: [422, "رمز عبورت به‌اندازهٔ کافی امن نیست؛ رمز قوی‌تری انتخاب کن."],
    same_password: [422, "رمز جدید باید با رمز قبلی متفاوت باشد."],
    email_address_invalid: [422, "آدرس ایمیل معتبر وارد کن."],
    email_address_not_authorized: [503, "ارسال ایمیل موقتاً در دسترس نیست؛ لطفاً بعداً دوباره تلاش کن."],
    over_email_send_rate_limit: [429, "تعداد ایمیل‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کن."],
    over_request_rate_limit: [429, "تعداد درخواست‌ها زیاد است. کمی صبر کن."],
    otp_expired: [400, "لینک یا کد تأیید نامعتبر یا منقضی است؛ لینک تازه درخواست کن."],
    flow_state_expired: [400, "لینک منقضی شده است؛ دوباره ثبت‌نام یا بازیابی را شروع کن."],
    flow_state_not_found: [400, "این لینک قبلاً استفاده شده یا معتبر نیست؛ لینک تازه درخواست کن."],
    bad_code_verifier: [400, "لینک را در همان مرورگری باز کن که درخواست را فرستادی."],
    validation_failed: [422, "اطلاعات حساب را بررسی کن؛ ایمیل و رمز باید با قوانین سرویس سازگار باشند."],
    signup_disabled: [503, "ثبت‌نام در حال حاضر در دسترس نیست."],
    email_provider_disabled: [503, "ورود با ایمیل در حال حاضر در دسترس نیست."],
    user_banned: [403, "این حساب غیرفعال است."],
    session_not_found: [401, "نشست منقضی شده است؛ دوباره وارد شو."],
    refresh_token_not_found: [401, "نشست منقضی شده است؛ دوباره وارد شو."],
    refresh_token_already_used: [401, "نشست معتبر نیست؛ دوباره وارد شو."],
    bad_jwt: [401, "نشست معتبر نیست؛ دوباره وارد شو."],
    user_not_found: [401, "حساب یا نشست معتبر نیست."],
  };
  const [http, detail] = messages[code] || (status === 429 ? [429, "کمی صبر کن و دوباره تلاش کن."] : status >= 500 ? [502, "سرویس ورود پاسخ نداد؛ دوباره تلاش کن."] : status === 401 || status === 403 ? [401, "نشست معتبر نیست؛ دوباره وارد شو."] : [400, "درخواست انجام نشد؛ اطلاعات را بررسی و دوباره تلاش کن."]);
  return new HttpError(http, detail);
}

export function createSupabaseAuth(fetcher = fetch) {
  const request = async (path, { method = "POST", data, token } = {}) => {
    const { url, key } = authConfig();
    let response;
    try {
      response = await fetcher(url + "/auth/v1" + path, { method, cache: "no-store", redirect: "error",
        headers: { apikey: key, ...(token ? { Authorization: "Bearer " + token } : {}), ...(data ? { "Content-Type": "application/json" } : {}) },
        ...(data ? { body: JSON.stringify(data) } : {}), signal: AbortSignal.timeout(15000) });
    } catch { fail(502, "ارتباط با سرویس ورود برقرار نشد؛ دوباره تلاش کن."); }
    const payload = response.status === 204 ? {} : await response.json().catch(() => ({}));
    if (!response.ok) throw providerError(response.status, payload);
    return payload;
  };
  return {
    config: authConfig,
    settings: () => request("/settings", { method: "GET" }),
    signup: (input, redirect, challenge) => request("/signup?redirect_to=" + encodeURIComponent(redirect), { data: { email: input.email, password: input.password, data: { name: input.name }, code_challenge: challenge, code_challenge_method: "s256" } }),
    login: input => request("/token?grant_type=password", { data: { email: input.email, password: input.password } }),
    refresh: refresh_token => request("/token?grant_type=refresh_token", { data: { refresh_token } }),
    getUser: token => { if (!token) fail(401, "ابتدا وارد حسابت شو."); return request("/user", { method: "GET", token }); },
    exchange: (auth_code, code_verifier) => request("/token?grant_type=pkce", { data: { auth_code, code_verifier } }),
    verify: input => request("/verify", { data: input }),
    resend: (email, redirect) => request("/resend?redirect_to=" + encodeURIComponent(redirect), { data: { email, type: "signup" } }),
    recover: (email, redirect, challenge) => request("/recover?redirect_to=" + encodeURIComponent(redirect), { data: { email, code_challenge: challenge, code_challenge_method: "s256" } }),
    updateProfile: (token, input) => request("/user", { method: "PUT", token, data: { data: { name: input.name } } }),
    updatePassword: (token, password) => request("/user", { method: "PUT", token, data: { password } }),
    logout: token => token ? request("/logout?scope=local", { token }) : Promise.resolve(),
  };
}
