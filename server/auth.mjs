import bcrypt from "bcryptjs";
import { fail, json } from "./http.mjs";

export const hashPassword = password => bcrypt.hash(password, 12); // One-time legacy/admin tools only.
export function cookies(request) {
  return Object.fromEntries((request.headers.get("cookie") || "").split(";").map(part => {
    const index = part.indexOf("=");
    return index < 0 ? [] : [part.slice(0, index).trim(), part.slice(index + 1).trim()];
  }).filter(part => part.length === 2));
}
export function accessToken(request) {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ") ? authorization.slice(7) : cookies(request).sb_access_token;
}
export function confirmedIdentity(identity) {
  if (!identity?.id || !identity.email || !identity.email_confirmed_at || identity.is_anonymous) fail(403, "برای ورود، ابتدا ایمیلت را تأیید کن.");
  return identity;
}
export function displayNameFromEmail(email) {
  // This is an initial display name, not a guess at a person's legal identity.
  const local = String(email || "").split("@")[0].split("+")[0];
  return local.replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) || "کاربر وانیکس";
}
export async function syncAuthUser(db, identity) {
  confirmedIdentity(identity);
  const email = identity.email.trim().toLowerCase();
  return db.transaction(async tx => {
    await tx.advisoryLock("supabase-profile:" + email);
    let user = await tx.findOne("users", { supabase_auth_id: identity.id });
    if (user) {
      if (user.suspended) fail(403, "این حساب غیرفعال شده است.");
      // Identity is resolved by immutable Auth ID, never by editable user metadata.
      if (user.email !== email || user.email_verified !== true) await tx.update("users", { id: user.id }, { email, email_verified: true });
      return { ...user, email, email_verified: true };
    }
    user = await tx.findOne("users", { email });
    if (user) {
      if (user.suspended) fail(403, "این حساب غیرفعال شده است.");
      if (user.supabase_auth_id && user.supabase_auth_id !== identity.id) fail(409, "این حساب به هویت دیگری متصل است؛ با پشتیبانی تماس بگیر.");
      await tx.update("users", { id: user.id }, { supabase_auth_id: identity.id, email_verified: true });
      // Preserve all legacy IDs, ownership, roles, plans and subscription dates.
      return { ...user, supabase_auth_id: identity.id, email_verified: true };
    }
    const now = new Date();
    const profile = { id: identity.id, supabase_auth_id: identity.id, email, email_verified: true,
      name: String(identity.user_metadata?.name || identity.user_metadata?.full_name || displayNameFromEmail(email)).trim().slice(0, 120),
      role: "user", plan: "free", trial_ends_at: new Date(now.getTime() + 7 * 86400000).toISOString(),
      phone: null, phone_verified: false, created_at: now.toISOString() };
    await tx.insert("users", profile);
    return profile;
  });
}
export async function currentUser(request, db, { optional = false, admin = false, auth } = {}) {
  const token = accessToken(request);
  if (!token) { if (optional) return null; fail(401, "ابتدا وارد حسابت شو."); }
  let identity;
  try { identity = confirmedIdentity(await auth.getUser(token)); }
  catch (error) { if (optional && error.status === 401) return null; throw error; }
  const user = await db.findOne("users", { supabase_auth_id: identity.id }, { password_hash: 0 });
  if (!user) { if (optional) return null; fail(401, "نشست حساب را دوباره با ورود تازه برقرار کن."); }
  if (user.suspended) fail(403, "این حساب غیرفعال شده است.");
  if (admin && user.role !== "admin") fail(403, "دسترسی فقط برای مدیر");
  return user;
}
export function publicUser(user, now = Date.now()) {
  const trialEnd = Date.parse(user.trial_ends_at);
  const trial = (user.plan || "free") === "free" && Number.isFinite(trialEnd) && trialEnd > now;
  const paidEnd = Date.parse(user.subscription_ends_at);
  const paidExpired = ["pro","business"].includes(user.plan) && Number.isFinite(paidEnd) && paidEnd <= now;
  return { id: user.id, email: user.email, email_verified: Boolean(user.email_verified || user.supabase_auth_id),
    name: user.name, role: user.role || "user", phone: user.phone || null, phone_verified: Boolean(user.phone_verified),
    created_at: user.created_at, plan: trial ? "pro" : paidExpired ? "free" : user.plan || "free",
    trial_active: trial, trial_ends_at: user.trial_ends_at || null,
    subscription_starts_at: user.subscription_starts_at || null, subscription_ends_at: user.subscription_ends_at || null };
}
export function setCookie(response, name, value, maxAge) {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  response.headers.append("Set-Cookie", name + "=" + value + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" + Math.max(0, Math.floor(maxAge)) + (secure ? "; Secure" : ""));
}
export function logoutResponse() {
  const response = json({ ok: true });
  for (const name of ["sb_access_token","sb_refresh_token","sb_pkce","sb_flow","sb_google_pkce","sb_google_next","access_token","refresh_token"]) setCookie(response, name, "", 0);
  return response;
}
export async function sessionResponse(db, auth, session, { includeToken = true } = {}) {
  if (!session?.access_token || !session.refresh_token) fail(502, "ورود کامل نشد؛ دوباره تلاش کن.");
  // Always validate the token with Supabase; never trust a decoded JWT or supplied user object.
  const identity = confirmedIdentity(await auth.getUser(session.access_token));
  const user = await syncAuthUser(db, identity);
  const response = json({ user: publicUser(user), ...(includeToken ? { access_token: session.access_token } : {}) });
  const lifetime = Math.max(1, Math.min(86400, Number(session.expires_in) || 3600));
  setCookie(response, "sb_access_token", session.access_token, lifetime);
  setCookie(response, "sb_refresh_token", session.refresh_token, 30 * 86400);
  for (const name of ["sb_pkce","sb_flow","access_token","refresh_token"]) setCookie(response, name, "", 0);
  return response;
}
