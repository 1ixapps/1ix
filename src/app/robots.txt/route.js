import { absoluteUrl, isPreview } from "../../../shared/seo.mjs";
export const dynamic = "force-dynamic";
export function GET() {
  const body = isPreview() ? "User-agent: *\nDisallow: /\n" : ["User-agent: *", "Allow: /", "Disallow: /api/", "Disallow: /dashboard", "Disallow: /admin", "Disallow: /auth/", "Disallow: /r/", "Sitemap: " + absoluteUrl("/sitemap.xml"), ""].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" } });
}
