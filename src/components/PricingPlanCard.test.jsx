import React, { act } from "react";
import { createRoot } from "react-dom/client";
import PricingPlanCard from "./PricingPlanCard";
import { useAuth } from "@/contexts/AuthContext";
import { readFileSync } from "fs";
import { join } from "path";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => require("react").createElement("a", { href: to, ...props }, children),
}), { virtual: true });
jest.mock("@/contexts/AuthContext", () => ({ useAuth: jest.fn(() => ({ user: null, loading: false })) }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host;
let root;
const plan = {
  id: "business",
  name: "کسب‌وکار / کلینیک",
  price_monthly: 349000,
  price_yearly: 3490000,
  popular: true,
  features: ["صفحه حرفه‌ای کسب‌وکار", "لینک کوتاه", "نوبت‌دهی آنلاین", "آمار پیشرفته", "پشتیبانی اولویت‌دار"],
  cta: "شروع ساخت صفحه‌ی کسب‌وکار",
};

beforeEach(() => {
  useAuth.mockReturnValue({ user: null, loading: false });
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

test("full monthly and yearly prices use Persian digits without abbreviation", () => {
  act(() => root.render(<PricingPlanCard plan={plan} />));
  expect(host.querySelector('[data-testid="plan-price"]').textContent).toBe("۳۴۹٬۰۰۰");
  act(() => root.render(<PricingPlanCard plan={plan} yearly />));
  expect(host.querySelector('[data-testid="plan-price"]').textContent).toBe("۳٬۴۹۰٬۰۰۰");
  expect(host.querySelector(".oneix-plan-price").textContent).toContain("سالانه");
  expect(host.querySelector(".oneix-plan-price").textContent).not.toContain("تومان");
});

test("a full card preserves every feature, the long name and a single signup link", () => {
  act(() => root.render(<PricingPlanCard plan={plan} />));
  expect(host.querySelector("h3").textContent).toBe(plan.name);
  expect(host.querySelectorAll("li")).toHaveLength(plan.features.length);
  const link = host.querySelector('[data-testid="pricing-cta-business"]');
  expect(link.tagName).toBe("A");
  expect(link.getAttribute("href")).toBe("/signup");
  expect(link.textContent).toBe(plan.cta);
  expect(link.querySelector("button")).toBeNull();
  expect(host.querySelector(".oneix-plan-heading .oneix-plan-badge")).not.toBeNull();
  expect(host.textContent).not.toMatch(/\.\.\.|…/);
});

test("the homepage summary keeps its four features and the complete price", () => {
  act(() => root.render(<PricingPlanCard plan={plan} compact />));
  expect(host.querySelectorAll("li")).toHaveLength(4);
  expect(host.querySelector('[data-testid="plan-price"]').textContent).toBe("۳۴۹٬۰۰۰");
});

test("zero is free, while an unavailable price is never misrepresented as free", () => {
  act(() => root.render(<PricingPlanCard plan={{ ...plan, price_monthly: 0 }} />));
  expect(host.querySelector(".oneix-plan-price").textContent).toBe("رایگانبرای همیشه");
  act(() => root.render(<PricingPlanCard plan={{ ...plan, price_monthly: null }} />));
  expect(host.querySelector('[data-testid="plan-price"]').textContent).toBe("قیمت اعلام نشده");
});

test("card CSS permits wrapping instead of hiding prices or features", () => {
  const css = readFileSync(join(__dirname, "../styles/pricing-cards.css"), "utf8");
  expect(css).not.toMatch(/ellipsis|line-clamp|overflow:\s*hidden/);
  expect(css).toMatch(/white-space:\s*normal/);
  expect(css).toMatch(/repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  expect(css).toMatch(/min-inline-size:\s*0/);
});

test("signed-in customers open plan details rather than login or signup", () => {
  useAuth.mockReturnValue({ user: { id: "demo", plan: "pro" }, loading: false });
  act(() => root.render(<PricingPlanCard plan={plan} />));
  expect(host.querySelector('[data-testid="pricing-cta-business"]').getAttribute("href")).toBe("/dashboard/plan?plan=business");
  expect(host.querySelector('a[href="/signup"],a[href="/login"]')).toBeNull();
});
test("the current paid plan opens its real tools page", () => {
  useAuth.mockReturnValue({ user: { id: "demo", plan: "pro" }, loading: false });
  act(() => root.render(<PricingPlanCard plan={{ ...plan, id: "pro", name: "حرفه‌ای" }} />));
  const cta = host.querySelector('[data-testid="pricing-cta-pro"]');
  expect(cta.getAttribute("href")).toBe("/dashboard/plan");
  expect(cta.textContent).toContain("امکانات پلن شما");
});
test("plan actions wait until the existing session is known", () => {
  useAuth.mockReturnValue({ user: null, loading: true });
  act(() => root.render(<PricingPlanCard plan={plan} />));
  expect(host.querySelector(".oneix-plan-cta").disabled).toBe(true);
  expect(host.querySelector("a")).toBeNull();
});
