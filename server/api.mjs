import { getDatabase } from "./database.mjs";
import { accessToken, currentUser } from "./auth.mjs";
import { assertSameOrigin, fail, json, safeError } from "./http.mjs";
import { createStorage } from "./storage.mjs";
import { sendPhoneCode } from "./mail.mjs";
import { createSupabaseAuth } from "./supabase-auth.mjs";
import { authRoutes } from "./routes-auth.mjs";
import { businessRoutes } from "./routes-business.mjs";
import { bookingRoutes } from "./routes-booking.mjs";
import { statsRoutes } from "./routes-stats.mjs";
import { adminRoutes } from "./routes-admin.mjs";
import { plans } from "./plans.mjs";

export function createApi({ database = getDatabase, storage = createStorage(), auth = createSupabaseAuth(), sendOtp = sendPhoneCode } = {}) {
  const routes = [];
  const add = (method, path, handler, access = "public") => routes.push({ method, path, segments: path.split("/").filter(Boolean), handler, access });
  add("GET", "/", () => json({ ok: true, service: "1ix.ir", brand: "وانیکس" }), "no-db");
  add("GET", "/health", () => json({ status: "ok" }), "no-db");
  add("GET", "/public/plans", () => json(plans), "no-db");
  add("GET", "/health/ready", async ({ db }) => { await db.count("users"); return json({ status: "ready" }); });
  authRoutes(add, { auth, sendOtp, database });
  businessRoutes(add, { storage });
  bookingRoutes(add);
  statsRoutes(add);
  adminRoutes(add);

  // Prefer an earlier literal segment over a parameter (e.g. resolve/stats).
  routes.sort((left, right) => {
    for (let index = 0; index < Math.min(left.segments.length, right.segments.length); index++) {
      const difference = Number(left.segments[index].startsWith(":")) - Number(right.segments[index].startsWith(":"));
      if (difference) return difference;
    }
    return 0;
  });
  const handler = async request => {
    try {
      assertSameOrigin(request);
      const url = new URL(request.url);
      if (request.method === "OPTIONS") {
        const origin = request.headers.get("origin");
        const allowed = [url.origin, ...(process.env.CORS_ORIGINS || "").split(",").map(s => s.trim())];
        if (origin && !allowed.includes(origin)) fail(403, "مبدأ درخواست مجاز نیست.");
        return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": origin || url.origin, "Access-Control-Allow-Credentials": "true", "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type", Vary: "Origin" } });
      }
      if (url.pathname !== "/api" && !url.pathname.startsWith("/api/")) fail(404, "مسیر یافت نشد");
      const segments = url.pathname.slice(4).split("/").filter(Boolean);
      const method = request.method === "HEAD" ? "GET" : request.method;
      let matched = false;
      for (const route of routes) {
        if (route.segments.length !== segments.length || !route.segments.every((part, index) => part.startsWith(":") || part === segments[index])) continue;
        matched = true;
        if (route.method !== method) continue;
        const params = {};
        for (let index = 0; index < segments.length; index++) if (route.segments[index].startsWith(":")) {
          try { params[route.segments[index].slice(1)] = decodeURIComponent(segments[index]); } catch { fail(400, "آدرس درخواست معتبر نیست."); }
        }
        if (["user", "admin"].includes(route.access) && !accessToken(request)) fail(401, "ابتدا وارد حسابت شو.");
        const db = route.access === "no-db" ? null : database();
        const user = ["user","admin","optional"].includes(route.access) ? await currentUser(request, db, { admin: route.access === "admin", optional: route.access === "optional", auth }) : null;
        const response = await route.handler({ request, url, params, db, user });
        const origin = request.headers.get("origin");
        if (origin && (process.env.CORS_ORIGINS || "").split(",").map(s => s.trim()).includes(origin)) {
          response.headers.set("Access-Control-Allow-Origin", origin); response.headers.set("Access-Control-Allow-Credentials", "true"); response.headers.set("Vary", "Origin");
        }
        return response;
      }
      fail(matched ? 405 : 404, matched ? "این روش درخواست مجاز نیست." : "مسیر یافت نشد");
    } catch (error) { return safeError(error); }
  };
  handler.routes = routes.map(({ method, path, access }) => ({ method, path: "/api" + (path === "/" ? "" : path), access }));
  return handler;
}
