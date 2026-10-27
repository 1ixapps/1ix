import React, { act } from "react";
import { createRoot } from "react-dom/client";
import SeoHead from "./SeoHead";
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host, root;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); document.querySelector('meta[name="vanix-preview"]')?.remove(); });

test("metadata follows navigation and replaces old structured data without duplicate tags", () => {
  act(() => root.render(<SeoHead title="خانه" description="معرفی" canonical="https://1ix.ir/" structuredData={{ "@type": "WebSite", name: "وانیکس" }} />));
  expect(document.title).toBe("خانه");
  expect(document.querySelector('meta[name="twitter:card"]').content).toBe("summary_large_image");
  expect(document.querySelector('meta[property="og:image"]').content).toMatch(/\/share-image$/);
  act(() => root.render(<SeoHead title="حساب" description="خصوصی" canonical="https://1ix.ir/dashboard" keywords={[]} noIndex />));
  expect(document.title).toBe("حساب");
  expect(document.querySelector('meta[name="robots"]').content).toBe("noindex, nofollow");
  expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  expect(document.querySelectorAll("#oneix-structured-data")).toHaveLength(1);
  expect(JSON.parse(document.querySelector("#oneix-structured-data").textContent)["@type"]).toBe("WebPage");
  act(() => root.render(null));
  expect(document.querySelector("#oneix-structured-data")).toBeNull();
});

test("public client navigation cannot override the noindex marker of a preview deployment", () => {
  const marker = document.createElement("meta"); marker.name = "vanix-preview"; marker.content = "true"; document.head.appendChild(marker);
  act(() => root.render(<SeoHead title="پیش‌نمایش" description="آزمایشی" canonical="https://1ix.ir/" />));
  expect(document.querySelector('meta[name="robots"]').content).toBe("noindex, nofollow");
});
