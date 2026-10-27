import { randomBytes, createHash, randomInt } from "node:crypto";
import { body, fail, json } from "./http.mjs";
import { normalizeContactPhone, schemas } from "./validation.mjs";
import { googleOAuthRoutes } from "./oauth.mjs";
import { accessToken, currentUser, confirmedIdentity, displayNameFromEmail, publicUser, sessionResponse, logoutResponse, cookies, setCookie } from "./auth.mjs";

function redirectUrl(request, flow) {
  const site = process.env.NODE_ENV === "production" ? process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL : new URL(request.url).origin;
  if (!site) fail(503, "ارسال لینک تأیید موقتاً در دسترس نیست؛ لطفاً کمی بعد دوباره تلاش کن.");
  const target = new URL("/auth/confirm", site);
  if (flow === "recovery") target.searchParams.set("flow", "recovery");
  return target.href;
}
function pkce() {
  const verifier = randomBytes(48).toString("base64url");
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url") };
}
function withChallenge(response, proof, flow) {
  setCookie(response, "sb_pkce", proof.verifier, 3600);
  setCookie(response, "sb_flow", flow, 3600);
  return response;
}
export function authRoutes(add, { auth, sendOtp, database }) {
  googleOAuthRoutes(add, { auth, database });
  // Cookie-backed bootstrap is public for guests, but never trusts an unverified session.
  // It performs no database/provider request at all when there are no session cookies.
  add("GET", "/auth/session", async ({ request }) => {
    const saved = cookies(request);
    const token = accessToken(request);
    const anonymous = () => {
      const response = json({ user: null });
      for (const name of ["sb_access_token", "sb_refresh_token"]) if (saved[name]) setCookie(response, name, "", 0);
      return response;
    };
    if (!token && !saved.sb_refresh_token) return anonymous();
    const db = database();
    if (token) {
      try { return json({ user: publicUser(await currentUser(request, db, { auth })) }); }
      catch (error) { if (error.status !== 401) throw error; }
    }
    if (!saved.sb_refresh_token) return anonymous();
    try { return await sessionResponse(db, auth, await auth.refresh(saved.sb_refresh_token), { includeToken: false }); }
    catch (error) {
      // A provider outage is not evidence of expiry. Leave cookies intact for retry.
      if (error.status === 401) return anonymous();
      throw error;
    }
  }, "no-db");
  add("POST", "/auth/register", async ({ request }) => {
    const input = await body(request, schemas.register);
    const settings = await auth.settings();
    if (settings.mailer_autoconfirm !== false) fail(503, "ثبت‌نام موقتاً در دسترس نیست؛ لطفاً کمی بعد دوباره تلاش کن.");
    const proof = pkce();
    await auth.signup({ ...input, name: input.name || displayNameFromEmail(input.email) }, redirectUrl(request, "signup"), proof.challenge);
    return withChallenge(json({ confirmation_required: true, email: input.email,
      message: "لینک تأیید ایمیل ارسال شد؛ آن را در همین مرورگر باز کن." }, 202), proof, "signup");
  });
  add("POST", "/auth/login", async ({ request, db }) => {
    const input = await body(request, schemas.login);
    return sessionResponse(db, auth, await auth.login(input));
  });
  add("GET", "/auth/me", async ({ user }) => json(publicUser(user)), "user");
  add("PATCH", "/auth/me", async ({ request, db, user }) => {
    const input = await body(request, schemas.profile);
    // Only the authenticated account's display name is editable here.
    // Do not change identity, roles, plans, or email through user metadata.
    await auth.updateProfile(accessToken(request), input);
    if (!await db.update("users", { id: user.id, supabase_auth_id: user.supabase_auth_id }, input)) fail(404, "حساب یافت نشد.");
    return json(publicUser(await db.findOne("users", { id: user.id }, { password_hash: 0 })));
  }, "user");
  add("POST", "/auth/logout", async ({ request }) => {
    try { await auth.logout(accessToken(request)); } catch (error) { if (![401,403].includes(error.status)) throw error; }
    return logoutResponse();
  });
  add("POST", "/auth/refresh", async ({ request, db }) => {
    const token = cookies(request).sb_refresh_token;
    if (!token) fail(401, "نشست منقضی شده است؛ دوباره وارد شو.");
    return sessionResponse(db, auth, await auth.refresh(token));
  });
  add("POST", "/auth/exchange", async ({ request, db }) => {
    const { code } = await body(request, schemas.exchange);
    const saved = cookies(request);
    if (!saved.sb_pkce || !/^[A-Za-z0-9_-]{43,128}$/.test(saved.sb_pkce)) fail(400, "لینک را در همان مرورگرِ ثبت‌نام باز کن؛ یا با ایمیل تأییدشده وارد شو.");
    const response = await sessionResponse(db, auth, await auth.exchange(code, saved.sb_pkce));
    return response;
  });
  add("POST", "/auth/verify-email", async ({ request, db }) => {
    const input = await body(request, schemas.verifyEmail);
    return sessionResponse(db, auth, await auth.verify(input));
  });
  add("POST", "/auth/resend", async ({ request }) => {
    const { email } = await body(request, schemas.forgot);
    await auth.resend(email, redirectUrl(request, "signup"));
    return json({ ok: true, message: "اگر حساب در انتظار تأیید باشد، لینک تازه ارسال می‌شود." });
  });
  add("POST", "/auth/forgot-password", async ({ request }) => {
    const { email } = await body(request, schemas.forgot);
    const proof = pkce();
    await auth.recover(email, redirectUrl(request, "recovery"), proof.challenge);
    return withChallenge(json({ ok: true, message: "اگر ایمیل ثبت شده باشد، لینک بازیابی ارسال می‌شود." }), proof, "recovery");
  });
  add("POST", "/auth/reset-password", async ({ request }) => {
    const { password } = await body(request, schemas.reset);
    const token = accessToken(request);
    if (!token) fail(401, "ابتدا لینک بازیابی ایمیل را در همین مرورگر باز کن.");
    confirmedIdentity(await auth.getUser(token));
    await auth.updatePassword(token, password);
    return json({ ok: true, message: "رمز عبور با موفقیت تغییر کرد." });
  });
  add("PATCH", "/auth/phone", async ({ request, db, user }) => {
    const { phone } = await body(request, schemas.contactPhone);
    return db.transaction(async tx => {
      await tx.advisoryLock("phone:" + user.id);
      const current = await tx.findOne("users", { id: user.id });
      if (!current) fail(404, "حساب یافت نشد.");
      const patch = { phone, phone_verified: normalizeContactPhone(current.phone) === phone && Boolean(current.phone_verified) };
      if (!await tx.update("users", { id: user.id }, patch)) fail(404, "حساب یافت نشد.");
      // A saved contact number is never proof of ownership; invalidate older OTPs.
      await tx.remove("phone_otps", { user_id: user.id });
      return json(publicUser({ ...current, ...patch }));
    });
  }, "user");
  add("POST", "/auth/phone/request-otp", async ({ request, db, user }) => {
    const { phone } = await body(request, schemas.phone);
    const code = String(randomInt(0, 1000000)).padStart(6, "0");
    await db.transaction(async tx => {
      await tx.advisoryLock("phone:" + user.id);
      const previous = await tx.findOne("phone_otps", { user_id: user.id });
      if (previous && Date.now() - Date.parse(previous.created_at) < 60000) fail(429, "برای ارسال دوبارهٔ کد، یک دقیقه صبر کن.");
      await tx.upsert("phone_otps", "user_id", user.id, { user_id: user.id, phone, code, attempts: 0, expires_at: new Date(Date.now() + 600000).toISOString(), created_at: new Date().toISOString() });
    });
    try { await sendOtp(phone, code); } catch (error) {
      // A failed older delivery must not remove a newer challenge.
      await db.remove("phone_otps", { user_id: user.id, code });
      throw error;
    }
    return json({ ok: true, message: "کد تأیید ارسال شد" });
  }, "user");
  add("POST", "/auth/phone/verify-otp", async ({ request, db, user }) => {
    const input = await body(request, schemas.verifyPhone);
    return db.transaction(async tx => {
      await tx.advisoryLock("phone:" + user.id);
      const otp = await tx.findOne("phone_otps", { user_id: user.id });
      if (!otp) fail(400, "کد تأیید نادرست است");
      if (!Number.isFinite(Date.parse(otp.expires_at)) || Date.parse(otp.expires_at) <= Date.now()) fail(400, "کد تأیید منقضی شده");
      if ((otp.attempts || 0) >= 5) return json({ detail: "تعداد تلاش بیش از حد است؛ کد تازه درخواست کن." }, 429);
      if (otp.code !== input.code || otp.phone !== input.phone) {
        await tx.update("phone_otps", { user_id: user.id }, { attempts: (otp.attempts || 0) + 1 });
        // Commit failed attempts, just as in the login flow.
        return json({ detail: "کد تأیید نادرست است" }, 400);
      }
      await tx.update("users", { id: user.id }, { phone: input.phone, phone_verified: true });
      await tx.remove("phone_otps", { user_id: user.id });
      return json({ ok: true });
    });
  }, "user");

}
