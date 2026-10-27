import { randomBytes, createHash } from "node:crypto";
import { z } from "zod";
import { body, fail, json } from "./http.mjs";
import { cookies, setCookie, sessionResponse } from "./auth.mjs";
import { safeAuthReturn } from "../shared/auth.mjs";

const PROOF_COOKIE = "sb_google_pkce";
const NEXT_COOKIE = "sb_google_next";
const inputSchema = z.object({ next: z.string().max(2048).optional() }).strict();
function appOrigin(request) {
  const configured = process.env.NODE_ENV === "production" ? process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL : new URL(request.url).origin;
  let target;
  try { target = new URL(configured); } catch { fail(503, "ورود با گوگل فعلاً در دسترس نیست. با ایمیل وارد شو."); }
  if (!["http:", "https:"].includes(target.protocol) || target.username || target.password || target.search || target.hash || (process.env.NODE_ENV === "production" && target.protocol !== "https:")) fail(503, "ورود با گوگل فعلاً در دسترس نیست. با ایمیل وارد شو.");
  return target.origin;
}
function finish(response, destination) {
  const headers = new Headers(response?.headers);
  headers.delete("Content-Type");
  headers.set("Location", destination);
  headers.set("Cache-Control", "no-store");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  const result = new Response(null, { status: 303, headers });
  for (const name of [PROOF_COOKIE, NEXT_COOKIE]) setCookie(result, name, "", 0);
  return result;
}
export function googleOAuthRoutes(add, { auth, database }) {
  add("POST", "/auth/oauth/google", async ({ request }) => {
    const input = await body(request, inputSchema);
    const origin = appOrigin(request);
    const settings = await auth.settings();
    if (settings.external?.google !== true) fail(503, "ورود با گوگل فعلاً در دسترس نیست. با ایمیل وارد شو.");
    const verifier = randomBytes(48).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const url = auth.googleUrl(origin + "/api/auth/oauth/callback", challenge);
    const response = json({ url });
    // Separate from email/recovery proof: one flow cannot overwrite the other's verifier.
    setCookie(response, PROOF_COOKIE, verifier, 600);
    const next = encodeURIComponent(safeAuthReturn(input.next, ""));
    setCookie(response, NEXT_COOKIE, next.length <= 3000 ? next : "", 600);
    return response;
  }, "no-db");

  add("GET", "/auth/oauth/callback", async ({ request, url }) => {
    // HEAD probes must never redeem a one-time authorization code.
    if (request.method === "HEAD") return new Response(null, { status: 204, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
    const saved = cookies(request);
    const errorPath = reason => "/login?oauth_error=" + reason;
    if (url.searchParams.has("error")) return finish(null, errorPath("cancelled"));
    const code = url.searchParams.get("code");
    const verifier = saved[PROOF_COOKIE];
    if (!code || code.length > 2000 || !verifier || !/^[A-Za-z0-9_-]{43,128}$/.test(verifier)) return finish(null, errorPath("expired"));
    try {
      // Supabase's OAuth state and the browser's private PKCE proof bind this callback.
      // The returned user object is never trusted: sessionResponse revalidates /user.
      const session = await auth.exchange(code, verifier);
      const response = await sessionResponse(database(), auth, session, { includeToken: false });
      const user = (await response.clone().json()).user;
      let next = "";
      try { next = decodeURIComponent(saved[NEXT_COOKIE] || ""); } catch {}
      return finish(response, safeAuthReturn(next, user.role === "admin" ? "/admin" : "/dashboard"));
    } catch (error) {
      const reason = error.status === 403 || error.status === 409 ? "blocked" : error.status === 400 || error.status === 401 ? "expired" : "unavailable";
      // Never forward provider diagnostics, tokens, codes or untrusted error descriptions.
      return finish(null, errorPath(reason));
    }
  }, "no-db");
}
