import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("../", import.meta.url));
const probe = createServer();
probe.listen(0, "127.0.0.1"); await once(probe, "listening");
const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
const origin = "http://127.0.0.1:" + port;
const server = spawn(process.execPath, [fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url)), "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  // This smoke test must never connect to a real database or send messages.
  env: { ...process.env, NODE_ENV: "production", DATABASE_URL: "", SUPABASE_URL: "", SUPABASE_SECRET_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "", RESEND_API_KEY: "", SMS_WEBHOOK_URL: "", JWT_SECRET: "isolated-local-smoke-test-secret-not-a-production-key" },
});
const closed = once(server, "close");
let startupError;
server.on("error", error => { startupError = error; });
server.stdout.resume(); server.stderr.resume();
let checks = 0;
const assets = new Set(["/google-g.svg", "/favicon.ico", "/favicon.svg", "/apple-touch-icon.png", "/fonts/estedad.css", "/fonts/estedad-arabic-variable.woff2"]);
async function get(path, options) {
  const response = await fetch(new URL(path, origin), { ...options, signal: AbortSignal.timeout(10000) });
  return { response, text: await response.text() };
}
try {
  let ready = false;
  for (let count = 0; count < 100; count++) {
    if (startupError) throw startupError;
    if (server.exitCode !== null) throw new Error("Next.js exited before startup");
    try { if ((await get("/api/health")).response.status === 200) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, "Production server did not become ready");
  for (const path of ["/", "/pricing", "/login", "/signup", "/auth/confirm", "/reset-password", "/dashboard/page", "/dashboard/settings", "/dashboard/plan", "/r/smoke-link", "/admin"]) {
    const { response, text } = await get(path);
    assert.equal(response.status, 200, path);
    assert.match(text, /<html[^>]*lang="fa"[^>]*dir="rtl"/, path + " RTL");
    if (/^\/(?:dashboard|admin|login|signup|auth|reset-password)/.test(path)) assert.match(text, /name="robots" content="noindex, nofollow"/, path + " robots");
    for (const match of text.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)) assets.add(match[1].replaceAll("&amp;", "&"));
    if (path === "/") { assert.match(text, /<h1[^>]*id="home-hero-heading"/, "Home content must exist before JavaScript"); assert.match(text, /application\/ld\+json/, "Server structured data"); }
    if (path === "/pricing") { assert.match(text, /<title>تعرفه‌های وانیکس/, "Pricing server title"); assert.match(text, /data-testid="pricing-card-pro"/, "Real plans in server HTML"); }
    checks++;
  }
  for (const path of ["/not-a-real-route", "/dashboard/not-a-feature", "/u/smoke-business"]) {
    const { response, text } = await get(path); assert.equal(response.status, 404, path + " real HTTP 404"); assert.match(text, /noindex/); checks++;
  }
  const robots = await get("/robots.txt"); assert.equal(robots.response.status, 200); assert.match(robots.text, /Sitemap: https?:\/\/[^\s]+\/sitemap.xml/); checks++;
  const sitemap = await get("/sitemap.xml"); assert.equal(sitemap.response.status, 200); assert.match(sitemap.text, /<urlset/); assert.match(sitemap.text, /\/pricing<\/loc>/); assert.doesNotMatch(sitemap.text, /\/dashboard|\/login|smoke-business/); checks++;
  const share = await get("/share-image"); assert.equal(share.response.status, 200); assert.match(share.response.headers.get("content-type"), /image\/png/); checks++;
  for (const asset of assets) {
    const { response } = await get(asset);
    assert.equal(response.status, 200, asset);
    assert.ok(!response.headers.get("content-type")?.includes("text/html"), "Asset resolved to HTML: " + asset);
    checks++;
  }
  const oauth = await get("/api/auth/oauth/callback?code=untrusted-code", { redirect: "manual" });
  assert.equal(oauth.response.status, 303); assert.equal(oauth.response.headers.get("location"), "/login?oauth_error=expired"); checks++;
  assert.equal((await get("/api/auth/oauth/callback?code=untrusted-code", { method: "HEAD", redirect: "manual" })).response.status, 204); checks++;
  assert.equal((await get("/api/auth/oauth/google")).response.status, 405); checks++;
  assert.equal((await get("/api/auth/oauth/google", { method: "POST", headers: { Origin: "https://attacker.invalid", "Content-Type": "application/json" }, body: "{}" })).response.status, 403); checks++;
  const session = await get("/api/auth/session");
  assert.equal(session.response.status, 200);
  assert.deepEqual(JSON.parse(session.text), { user: null });
  assert.match(session.response.headers.get("cache-control"), /no-store/); checks++;
  const dashboard = await get("/api/dashboard/overview");
  assert.equal(dashboard.response.status, 401); checks++;
  const plans = await get("/api/public/plans");
  assert.ok(JSON.parse(plans.text).some(plan => plan.id === "pro"));
  assert.equal(plans.response.headers.get("x-content-type-options"), "nosniff");
  assert.match(plans.response.headers.get("cache-control"), /no-store/); checks++;
  const head = await get("/api/health", { method: "HEAD" });
  assert.equal(head.response.status, 200); assert.equal(head.text, ""); checks++;
  assert.equal((await get("/api/not-a-route")).response.status, 404); checks++;
  assert.equal((await get("/api/health", { method: "POST" })).response.status, 405); checks++;
  assert.equal((await get("/api/health", { method: "OPTIONS", headers: { Origin: "https://attacker.invalid" } })).response.status, 403); checks++;
  const unavailable = await get("/api/health/ready");
  assert.equal(unavailable.response.status, 503);
  assert.deepEqual(Object.keys(JSON.parse(unavailable.text)), ["detail"]); checks++;
  console.log("Production HTTP smoke passed: " + checks + " page, asset, metadata and API checks. No cloud database used.");
} finally {
  if (server.exitCode === null) server.kill();
  await closed;
}
