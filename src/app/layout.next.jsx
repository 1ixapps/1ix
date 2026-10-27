import "../index.css";
import "../styles/brand-refinement.css";
import "../styles/studio-pro.css";
import "../styles/usability-refinement.css";
import "../styles/business-preview.css";
import { HOME_TITLE, HOME_DESCRIPTION, KEYWORDS, siteOrigin } from "../../shared/seo.mjs";

export const metadata = {
  metadataBase: new URL(siteOrigin()),
  title: HOME_TITLE, description: HOME_DESCRIPTION, keywords: KEYWORDS,
  icons: { icon: [{ url: "/favicon.ico", sizes: "any" }, { url: "/favicon.svg", type: "image/svg+xml" }], apple: "/apple-touch-icon.png" },
  openGraph: { title: HOME_TITLE, description: HOME_DESCRIPTION, locale: "fa_IR", type: "website", siteName: "وانیکس", images: [{ url: "/share-image", width: 1200, height: 630 }] },
  twitter: { card: "summary_large_image", title: HOME_TITLE, description: HOME_DESCRIPTION, images: ["/share-image"] },
};
export const viewport = { width: "device-width", initialScale: 1, themeColor: "#4f46f7" };
export default function RootLayout({ children }) {
  return <html lang="fa" dir="rtl"><head><link rel="stylesheet" href="/fonts/estedad.css" /><link rel="preload" href="/fonts/estedad-arabic-variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" /></head><body><div id="root">{children}</div><noscript>برای استفاده از امکانات تعاملی وانیکس جاوااسکریپت را فعال کنید.</noscript></body></html>;
}
