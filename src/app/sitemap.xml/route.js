import { getDatabase } from "../../../server/database.mjs";
import { readSitemapPages } from "../../../server/public-site.mjs";
import { absoluteUrl, canonicalPagePath, isPreview } from "../../../shared/seo.mjs";
export const dynamic = "force-dynamic";
const xml = value => String(value).replace(/[<>&"']/g, character => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[character]));
export async function GET() {
  if (isPreview()) return new Response(null, { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  try {
    const pages = process.env.DATABASE_URL ? await readSitemapPages(getDatabase()) : [];
    const urls = [{ path: "/" }, { path: "/pricing" }, ...pages.map(page => ({ path: canonicalPagePath(page.username), date: page.updated_at }))];
    const source = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.map(({ path, date }) => "<url><loc>" + xml(absoluteUrl(path)) + "</loc>" + (date && Number.isFinite(Date.parse(date)) ? "<lastmod>" + new Date(date).toISOString() + "</lastmod>" : "") + "</url>").join("") + "</urlset>";
    return new Response(source, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  }
}
