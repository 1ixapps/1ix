// Public-only SEO configuration shared by the initial HTML and client navigation.
export const SITE_NAME = "وانیکس";
export const HOME_TITLE = "وانیکس | سایت‌ساز کسب‌وکار، لینک کوتاه و نوبت‌دهی آنلاین";
export const HOME_DESCRIPTION = "با وانیکس صفحهٔ حرفه‌ای کسب‌وکارت را بساز، لینک کوتاه به اشتراک بگذار و نوبت‌های آنلاین را مدیریت کن؛ مناسب کلینیک، سالن زیبایی و کسب‌وکارهای خدماتی.";
export const PRICING_TITLE = "تعرفه‌های وانیکس | قیمت سایت‌ساز و نوبت‌دهی آنلاین";
export const PRICING_DESCRIPTION = "قیمت و امکانات پلن‌های وانیکس را مقایسه کن؛ ساخت صفحهٔ کسب‌وکار، لینک کوتاه و نوبت‌دهی آنلاین با ۷ روز امکانات حرفه‌ای پس از تأیید ایمیل.";
export const KEYWORDS = ["وانیکس", "سایت ساز", "سایت ساز کسب و کار", "ساخت صفحه کسب و کار", "سایت ساز فارسی", "لینک کوتاه", "لینک بیو", "نوبت دهی آنلاین", "رزرو آنلاین", "سایت کلینیک", "سایت سالن زیبایی"];
export function siteOrigin(value = process.env.NEXT_PUBLIC_SITE_URL) {
  try {
    const url = new URL(value || "https://1ix.ir");
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Invalid origin");
    return url.origin;
  } catch { return "https://1ix.ir"; }
}
export function absoluteUrl(path = "/", origin = siteOrigin()) {
  const url = new URL(path, origin);
  return url.origin === origin ? url.href : new URL("/", origin).href;
}
export const canonicalPagePath = username => "/u/" + encodeURIComponent(username.toLowerCase());
export const isPreview = () => Boolean(process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production");
const privateRoutes = new Set(["/login", "/signup", "/forgot-password", "/reset-password", "/auth/confirm", "/dashboard", ...["page","links","services","appointments","notifications","settings","plan"].map(path => "/dashboard/" + path), "/admin", ...["users","pages","links","appointments","tickets","announcements"].map(path => "/admin/" + path)]);
export function classifyPath(pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "home";
  if (path === "/pricing") return "pricing";
  if (privateRoutes.has(path)) return "private";
  if (/^\/u\/[a-zA-Z0-9_-]{1,80}$/.test(path)) return "business";
  if (/^\/r\/[a-zA-Z0-9_-]{1,80}$/.test(path)) return "redirect";
  return "missing";
}
export function pageSeo(pathname, page) {
  const kind = classifyPath(pathname);
  if (kind === "home") return { title: HOME_TITLE, description: HOME_DESCRIPTION, path: "/", keywords: KEYWORDS };
  if (kind === "pricing") return { title: PRICING_TITLE, description: PRICING_DESCRIPTION, path: "/pricing", keywords: ["تعرفه وانیکس", "قیمت سایت ساز", "هزینه نوبت دهی آنلاین", ...KEYWORDS.slice(0,6)] };
  if (kind === "business" && page) return {
    title: page.seo?.title?.trim() || `${page.business_name} | وانیکس`,
    description: page.seo?.description?.trim() || page.bio?.trim() || `معرفی خدمات، اطلاعات تماس و نوبت‌دهی آنلاین ${page.business_name}.`,
    path: canonicalPagePath(page.username),
    keywords: page.seo?.keywords ? page.seo.keywords.split(/[,،]/).map(word => word.trim()).filter(Boolean) : [page.business_name, page.category, "نوبت دهی آنلاین"].filter(Boolean),
  };
  return { title: kind === "missing" ? "صفحه یافت نشد | وانیکس" : "حساب کاربری | وانیکس", description: "مدیریت حساب و کسب‌وکار در وانیکس", path: pathname, keywords: [] };
}
export function siteStructuredData(origin = siteOrigin()) {
  return { "@context": "https://schema.org", "@graph": [
    { "@type": "Organization", "@id": origin + "/#organization", name: SITE_NAME, alternateName: "1ix.ir", url: origin + "/", logo: origin + "/apple-touch-icon.png" },
    { "@type": "WebSite", "@id": origin + "/#website", name: SITE_NAME, alternateName: "1ix.ir", url: origin + "/", inLanguage: "fa-IR", publisher: { "@id": origin + "/#organization" } },
    { "@type": "SoftwareApplication", name: SITE_NAME, applicationCategory: "BusinessApplication", operatingSystem: "Web", url: origin + "/", description: HOME_DESCRIPTION, publisher: { "@id": origin + "/#organization" } },
  ] };
}
export const serializeJsonLd = value => JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
