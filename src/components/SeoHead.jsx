import { useEffect } from "react";
import { absoluteUrl, KEYWORDS, serializeJsonLd } from "../../shared/seo.mjs";

function upsertMeta(attribute, key, content) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) { element = document.createElement("meta"); element.setAttribute(attribute, key); document.head.appendChild(element); }
  element.setAttribute("content", content || "");
}
export default function SeoHead({ title, description, keywords = KEYWORDS, canonical = absoluteUrl("/"), image = absoluteUrl("/share-image"), type = "website", structuredData, noIndex = false }) {
  useEffect(() => {
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "keywords", keywords.join(", "));
    const preview = document.querySelector('meta[name="vanix-preview"]')?.content === "true";
    upsertMeta("name", "robots", noIndex || preview ? "noindex, nofollow" : "index, follow");
    for (const [key, content] of Object.entries({ title, description, type, url: canonical, image, "site_name": "وانیکس", locale: "fa_IR", "image:width": "1200", "image:height": "630" })) upsertMeta("property", "og:" + key, content);
    for (const [key, content] of Object.entries({ card: "summary_large_image", title, description, image })) upsertMeta("name", "twitter:" + key, content);
    let canonicalLink = document.head.querySelector('link[rel="canonical"]');
    if (!canonicalLink) { canonicalLink = document.createElement("link"); canonicalLink.rel = "canonical"; document.head.appendChild(canonicalLink); }
    canonicalLink.href = canonical;
    let script = document.getElementById("oneix-structured-data");
    if (!script) { script = document.createElement("script"); script.id = "oneix-structured-data"; script.type = "application/ld+json"; document.head.appendChild(script); }
    script.textContent = serializeJsonLd(structuredData || { "@context": "https://schema.org", "@type": "WebPage", name: title, url: canonical, description, inLanguage: "fa-IR" });
    return () => { script.remove(); };
  }, [canonical, description, image, keywords, noIndex, structuredData, title, type]);
  return null;
}
