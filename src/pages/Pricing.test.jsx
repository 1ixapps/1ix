import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Pricing from "./Pricing";
import api from "@/lib/api";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => require("react").createElement("a", { href: to, ...props }, children),
}), { virtual: true });
jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("@/components/NavbarPremium", () => () => null);
jest.mock("@/components/FooterPremium", () => () => null);
jest.mock("@/components/SeoHead", () => () => null);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host;
let root;
beforeEach(async () => {
  window.scrollTo = jest.fn();
  api.get.mockResolvedValue({ data: [
    { id: "free", name: "رایگان", price_monthly: 0, price_yearly: 0, features: [] },
    { id: "pro", name: "حرفه‌ای", price_monthly: 149000, price_yearly: 1490000, popular: true, features: ["خدمات", "نوبت‌دهی"] },
    { id: "business", name: "کسب‌وکار / کلینیک", price_monthly: 349000, price_yearly: 3490000, features: ["گزارش"] },
  ] });
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root.render(<Pricing />));
});
afterEach(() => { act(() => root.unmount()); host.remove(); jest.clearAllMocks(); });

test("the pricing title uses the Persian brand and the page starts at the top", () => {
  expect(host.querySelector("h1").textContent.trim()).toBe("تعرفه‌های وانیکس");
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
  expect(host.querySelectorAll(".oneix-plan-card")).toHaveLength(3);
  expect(api.get).toHaveBeenCalledWith("/public/plans");
});

test("the real billing switch changes the full price in every paid card", () => {
  const businessPrice = () => host.querySelector('[data-testid="pricing-card-business"] [data-testid="plan-price"]').textContent;
  expect(businessPrice()).toBe("۳۴۹٬۰۰۰");
  act(() => host.querySelector('[data-testid="billing-toggle"]').click());
  expect(businessPrice()).toBe("۳٬۴۹۰٬۰۰۰");
  act(() => host.querySelector('[data-testid="billing-toggle"]').click());
  expect(businessPrice()).toBe("۳۴۹٬۰۰۰");
});
