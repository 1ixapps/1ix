import React, { act } from "react";
import { createRoot } from "react-dom/client";
import HomeRedesign from "./HomeRedesign";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => require("react").createElement("a", { href: to, ...props }, children),
}), { virtual: true });
jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("@/contexts/AuthContext", () => ({ useAuth: jest.fn() }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host, root, user;
const plans = [
  { id: "free", name: "رایگان", price_monthly: 0, features: ["صفحه کسب‌وکار"] },
  { id: "pro", name: "حرفه‌ای", price_monthly: 149000, popular: true, features: ["نوبت‌دهی", "لینک کوتاه"] },
  { id: "business", name: "کسب‌وکار", price_monthly: 349000, features: ["گزارش"] },
];
beforeEach(() => {
  user = null;
  useAuth.mockImplementation(() => ({ user, loading: false }));
  api.get.mockReset(); api.get.mockResolvedValue({ data: plans });
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
const mount = async (strict = false) => { await act(async () => root.render(strict ? <React.StrictMode><HomeRedesign /></React.StrictMode> : <HomeRedesign />)); };

test("the creative home retains its Persian identity, one headline and all product anchors", async () => {
  await mount();
  expect(host.querySelector(".home-creative").getAttribute("dir")).toBe("rtl");
  expect(host.querySelectorAll("h1")).toHaveLength(1);
  expect(host.querySelector("h1").textContent).toContain("یک لینک جلوتر");
  expect(host.querySelector('svg[role="img"]').getAttribute("aria-label")).toContain("وانی");
  for (const id of ["product", "use-cases", "pricing", "faq", "feature-pages", "feature-links", "feature-booking"]) expect(host.querySelector("#" + id)).not.toBeNull();
  host.querySelectorAll('a[href^="#"]').forEach(link => expect(host.querySelector(link.getAttribute("href"))).not.toBeNull());
  expect(host.querySelector(".home-hero-actions a").getAttribute("href")).toBe("/signup");
  expect(host.textContent).not.toContain("بساز و همان لحظه ببین");
});

test("industry buttons update the content example and keep selection accessible", async () => {
  await mount();
  const buttons = [...host.querySelectorAll(".home-industry-picker button")];
  expect(buttons).toHaveLength(4);
  expect(buttons[0].getAttribute("aria-pressed")).toBe("true");
  await act(async () => buttons[1].click());
  expect(buttons[1].getAttribute("aria-pressed")).toBe("true");
  expect(buttons[0].getAttribute("aria-pressed")).toBe("false");
  const panel = host.querySelector("#home-industry-detail");
  expect(panel.getAttribute("aria-live")).toBe("polite");
  expect(panel.textContent).toContain("سالن شما");
  expect(panel.textContent).toContain("رنگ و لایت");
  expect(panel.textContent).not.toContain("کلینیک شما");
  await act(async () => buttons[2].click());
  expect(panel.textContent).toContain("استودیوی شما");
  expect(panel.textContent).toContain("طراحی ناخن");
  expect(api.get).toHaveBeenCalledTimes(1);
});

test("returning customers go directly to their existing tools instead of signup", async () => {
  user = { id: "owner", plan: "pro", name: "علی" };
  await mount();
  expect(host.querySelector(".home-hero-actions a").getAttribute("href")).toBe("/dashboard/page");
  expect(host.querySelector("#feature-links .home-text-link").getAttribute("href")).toBe("/dashboard/links");
  expect(host.querySelector("#feature-booking .home-text-link").getAttribute("href")).toBe("/dashboard/appointments");
  expect(host.querySelector(".home-final-action a").getAttribute("href")).toBe("/dashboard/page");
  expect(host.querySelector('[data-testid="pricing-cta-pro"]').getAttribute("href")).toBe("/dashboard/plan");
});

test("plans preserve real API prices and StrictMode shares the pending public request", async () => {
  await mount(true);
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(api.get).toHaveBeenCalledWith("/public/plans");
  expect(host.querySelectorAll(".oneix-plan-card")).toHaveLength(3);
  expect(host.querySelector('[data-testid="pricing-card-pro"] [data-testid="plan-price"]').textContent).toBe("۱۴۹٬۰۰۰");
});

test("plan loading has an accessible state and never fabricates pricing on failure", async () => {
  let fail;
  api.get.mockImplementationOnce(() => new Promise((resolve, reject) => { fail = reject; }));
  await mount();
  expect(host.querySelector('.home-plan-skeletons[role="status"]')).not.toBeNull();
  expect(host.querySelector(".oneix-plan-card")).toBeNull();
  await act(async () => fail(new Error("offline")));
  expect(host.querySelector(".oneix-plan-card")).toBeNull();
  expect(host.querySelector('.home-pricing-fallback a').getAttribute("href")).toBe("/pricing");
});

test("FAQ answers open on demand without decorative or dead controls", async () => {
  await mount();
  const trigger = host.querySelector('#faq button[aria-expanded="false"]');
  await act(async () => trigger.click());
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  expect(host.querySelector('#faq [role="region"]').textContent).toContain("اطلاعات کسب‌وکار");
  expect(host.querySelector('a[href="#"]')).toBeNull();
});

test("mobile navigation closes on Escape and returns focus to its trigger", async () => {
  await mount();
  const toggle = host.querySelector('[aria-controls="vanix-site-menu"]');
  const menu = host.querySelector("#vanix-site-menu");
  expect(menu.hasAttribute("inert")).toBe(true);
  await act(async () => toggle.click());
  expect(toggle.getAttribute("aria-expanded")).toBe("true");
  expect(menu.hasAttribute("inert")).toBe(false);
  await act(async () => menu.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })));
  expect(toggle.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(toggle);
});

test("SEO metadata and structured data remain intact and copyright is not duplicated", async () => {
  await mount();
  expect(document.title).toContain("وانیکس");
  expect(document.head.querySelector('link[rel="canonical"]').href).toBe("https://1ix.ir/");
  expect(document.head.querySelector('meta[name="keywords"]').content).toContain("سایت ساز");
  expect(JSON.parse(document.querySelector("#oneix-structured-data").textContent)["@graph"].map(item => item["@type"])).toEqual(["Organization", "WebSite", "SoftwareApplication"]);
  const copyright = host.querySelector(".v3-footer-bottom");
  expect(copyright.textContent.match(/1ix\.ir/g)).toHaveLength(1);
  expect(copyright.textContent).toMatch(/© [۰-۹]{4}/);
});

test("server-seeded real plans render immediately without a duplicate client pricing request", async () => {
  await act(async () => root.render(<HomeRedesign initialPlans={plans} />));
  expect(host.querySelectorAll(".oneix-plan-card")).toHaveLength(3);
  expect(api.get).not.toHaveBeenCalled();
  expect(host.querySelector(".home-plan-skeletons")).toBeNull();
});
