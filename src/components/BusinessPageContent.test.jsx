import React, { act } from "react";
import { createRoot } from "react-dom/client";
import BusinessPageContent from "./BusinessPageContent";
import PagePreview from "./PagePreview";
import StudioPreview from "./StudioPreview";
import { readFileSync } from "fs";
import { join } from "path";

jest.mock("@/lib/api", () => ({ __esModule: true, fullUploadUrl: (url) => url }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const page = {
  business_name: "استودیوی تخصصی زیبایی با نامی طولانی و کاملاً خوانا", category: "زیبایی",
  bio: "معرفی واقعی کسب‌وکار", about: "درباره‌ی مجموعه", username: "demo",
  address: "تهران، خیابان اول، پلاک ۱۲", map_url: "https://maps.example.com/studio",
  theme: { primary_color: "#4f46f7", accent_color: "#ff6b5e", button_style: "pill" },
  booking: { enabled: true }, actions: [{ type: "call", value: "۰۹۱۲۱۲۳۴۵۶۷", label: "مشاوره تلفنی" }],
  working_hours: Array.from({ length: 7 }, (_, i) => ({ day: ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"][i], enabled: i !== 6, open_time: "09:00", close_time: "18:00" })),
  gallery: Array.from({ length: 8 }, (_, i) => ({ id: "g" + i, url: "/photo" + i + ".jpg", caption: "نمونه‌کار " + i })),
  price_list: [{ id: "price", title: "رنگ مو", price: "از 300 هزار تومان" }],
  faqs: Array.from({ length: 6 }, (_, i) => ({ id: "f" + i, question: "سؤال " + i, answer: "پاسخ " + i })),
  testimonials: Array.from({ length: 3 }, (_, i) => ({ id: "r" + i, author: "مشتری " + i, text: "تجربه واقعی", rating: 4 })),
};
const services = [{ id: "service-1", title: "مشاوره تخصصی", price: 350000, duration_minutes: 45, active: true }, { id: "inactive", title: "خدمت غیرفعال", active: false }];
let host;
let root;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

test("public content preserves every section and routes service booking to its actual ID", () => {
  const onBook = jest.fn();
  act(() => root.render(<BusinessPageContent page={page} services={services} onBook={onBook} />));
  expect(host.querySelector("h1").textContent).toBe(page.business_name);
  expect(host.querySelectorAll(".bp-gallery-item")).toHaveLength(8);
  expect(host.querySelectorAll(".bp-hours li")).toHaveLength(7);
  expect(host.querySelectorAll(".bp-faqs details")).toHaveLength(6);
  expect(host.querySelectorAll(".bp-review")).toHaveLength(3);
  expect(host.querySelectorAll(".bp-service")).toHaveLength(1);
  expect(host.textContent).not.toContain("خدمت غیرفعال");
  expect(host.textContent).toContain("از ۳۰۰ هزار تومان");
  act(() => host.querySelector('[aria-label="رزرو مشاوره تخصصی"]').click());
  expect(onBook).toHaveBeenCalledWith("service-1");
  expect(host.querySelector('[data-testid="public-action-call-0"]').getAttribute("href")).toBe("tel:09121234567");
});

test("preview uses the exact same content and never offers fake booking or active status", () => {
  const onBook = jest.fn();
  act(() => root.render(<BusinessPageContent page={page} services={services} readOnly onBook={onBook} />));
  expect(host.querySelectorAll(".bp-gallery-item")).toHaveLength(8);
  expect(host.querySelectorAll(".bp-hours li")).toHaveLength(7);
  expect(host.querySelectorAll(".bp-faqs details")).toHaveLength(6);
  expect(host.querySelectorAll(".bp-review")).toHaveLength(3);
  expect(host.querySelectorAll("button,a,main")).toHaveLength(0);
  expect(host.textContent).not.toContain("منتشر شده");
  expect(onBook).not.toHaveBeenCalled();
});

test("disabled booking removes every reservation affordance in both live and preview rendering", () => {
  for (const readOnly of [false, true]) {
    act(() => root.render(<BusinessPageContent page={{ ...page, booking: { enabled: false } }} services={services} readOnly={readOnly} />));
    expect(host.querySelector(".bp-button-primary")).toBeNull();
    expect(host.querySelector(".bp-service-book")).toBeNull();
    expect(host.querySelector(".bp-mobile-booking")).toBeNull();
    expect(host.querySelector(".bp-hours")).not.toBeNull();
  }
});

test("a gallery photo opens in an accessible dialog using the real image", () => {
  act(() => root.render(<BusinessPageContent page={page} services={[]} />));
  act(() => host.querySelector(".bp-gallery-item").click());
  const dialog = document.querySelector('[role="dialog"]');
  expect(dialog).not.toBeNull();
  expect(dialog.querySelector("img").getAttribute("src")).toBe("/photo0.jpg");
  expect(dialog.textContent).toContain("نمونه‌کار 0");
});

test("device preview measures its container and reserves the scaled content height", () => {
  const widthDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
  const heightDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, get: () => 320 });
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", { configurable: true, get: () => 2080 });
  try {
    act(() => root.render(<PagePreview page={page} services={services} device="desktop" />));
    const preview = host.querySelector('[data-testid="page-preview"]');
    expect(Number(preview.dataset.deviceWidth)).toBe(1040);
    expect(Number(preview.dataset.previewScale)).toBeCloseTo(320 / 1040);
    expect(parseFloat(host.querySelector(".bp-preview-spacer").style.height)).toBeCloseTo(640);
    act(() => root.render(<PagePreview page={page} services={services} device="mobile" />));
    expect(Number(preview.dataset.deviceWidth)).toBe(320);
    expect(Number(preview.dataset.previewScale)).toBe(1);
  } finally {
    if (widthDescriptor) Object.defineProperty(HTMLElement.prototype, "clientWidth", widthDescriptor); else delete HTMLElement.prototype.clientWidth;
    if (heightDescriptor) Object.defineProperty(HTMLElement.prototype, "scrollHeight", heightDescriptor); else delete HTMLElement.prototype.scrollHeight;
  }
});

test("preview device and expand controls remain actionable", () => {
  const expand = jest.fn();
  act(() => root.render(<StudioPreview page={page} services={services} compact dirty onExpand={expand} />));
  act(() => host.querySelector('[aria-label="پیش‌نمایش دسکتاپ"]').click());
  expect(host.querySelector('[data-testid="page-preview"]').classList.contains("preview-device--desktop")).toBe(true);
  expect(host.textContent).toContain("تغییرات هنوز ذخیره نشده‌اند");
  act(() => host.querySelector('[aria-label="بازکردن پیش‌نمایش بزرگ"]').click());
  expect(expand).toHaveBeenCalledTimes(1);
});

test("responsive styling is driven by page container width and never truncates business text", () => {
  const css = readFileSync(join(__dirname, "../styles/business-page.css"), "utf8");
  expect(css).toContain("container: business-page / inline-size");
  expect(css).toContain("@container business-page");
  expect(css).not.toMatch(/text-overflow|line-clamp/);
  expect(css).toContain("prefers-reduced-motion");
});
