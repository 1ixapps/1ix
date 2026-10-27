import { notFound } from "next/navigation";
import ClientApp from "../ClientApp";
import { getPublicPage } from "../site-data";
import { plans } from "../../../server/plans.mjs";
import { absoluteUrl, classifyPath, isPreview, pageSeo, serializeJsonLd, siteStructuredData } from "../../../shared/seo.mjs";

export const dynamic = "force-dynamic";
async function routeData(params) {
  const { path = [] } = await params;
  const pathname = "/" + path.join("/");
  const kind = classifyPath(pathname);
  if (kind === "missing") notFound();
  const publicData = kind === "business" ? await getPublicPage(path[1]) : null;
  if (kind === "business" && !publicData) notFound();
  return { pathname, kind, publicData };
}
export async function generateMetadata({ params }) {
  const { pathname, kind, publicData } = await routeData(params);
  const seo = pageSeo(pathname, publicData?.page);
  const index = ["home", "pricing", "business"].includes(kind) && !isPreview();
  return {
    title: seo.title, description: seo.description, keywords: seo.keywords,
    other: { "vanix-preview": String(isPreview()) },
    referrer: kind === "private" ? "no-referrer" : "strict-origin-when-cross-origin",
    alternates: { canonical: seo.path },
    robots: { index, follow: index },
    openGraph: { title: seo.title, description: seo.description, url: absoluteUrl(seo.path), siteName: "وانیکس", locale: "fa_IR", type: "website", images: [{ url: "/share-image", width: 1200, height: 630, alt: "وانیکس؛ صفحهٔ کسب‌وکار، لینک کوتاه و نوبت‌دهی آنلاین" }] },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description, images: ["/share-image"] },
  };
}
export default async function Page({ params }) {
  const { pathname, kind, publicData } = await routeData(params);
  return <>
    {kind === "home" && <script id="oneix-structured-data" type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(siteStructuredData()) }} />}
    <ClientApp initialPath={pathname} initialPlans={["home","pricing"].includes(kind) ? plans : undefined} initialPublicData={publicData} />
  </>;
}
