import React, { act } from "react";
import { createRoot } from "react-dom/client";
import ProductStudioDemo from "./ProductStudioDemo";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => require("react").createElement("a", { href: to, ...props }, children),
}), { virtual: true });
jest.mock("@/lib/api", () => ({ __esModule: true, fullUploadUrl: (value) => value }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host; let root;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); act(() => root.render(<ProductStudioDemo />)); });
afterEach(() => { act(() => root.unmount()); host.remove(); });
const click = (element) => act(() => element.click());
const edit = (input, value) => act(() => { const prototype = input.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, "value").set.call(input, value); input.dispatchEvent(new Event("input", { bubbles: true })); });
const preview = () => host.querySelector('[data-testid="page-preview"]');
const advanced = () => click(Array.from(host.querySelectorAll("button")).find((button) => button.textContent.includes("تنظیمات بیشتر")));

test("editing the business identity updates the real page preview immediately", () => {
  edit(host.querySelector(".studio-demo-fields input"), "کلینیک آفتاب");
  expect(preview().textContent).toContain("کلینیک آفتاب");
});

test("a shared brand palette updates the preview CTA", () => {
  const palette = Array.from(host.querySelectorAll(".studio-demo-palettes button")).find((button) => button.getAttribute("aria-label") === "جنگل");
  click(palette);
  const booking = Array.from(preview().querySelectorAll("div")).find((element) => element.textContent.trim() === "رزرو نوبت");
  expect(booking).not.toBeNull();
});

test("advanced services controls change actual preview content", () => {
  advanced();
  const serviceInput = document.querySelector("details input");
  edit(serviceInput, "مشاوره‌ی اختصاصی");
  expect(preview().textContent).toContain("مشاوره‌ی اختصاصی");
});

test("device controls and mobile view switch have working state", () => {
  click(host.querySelector('[aria-label="نمای دسکتاپ دمو"]'));
  expect(preview().classList.contains("preview-device--desktop")).toBe(true);
  click(Array.from(host.querySelectorAll(".studio-demo-mobile-switch button")).find((button) => button.textContent.includes("دیدن نتیجه")));
  expect(host.querySelector(".studio-demo").getAttribute("data-mobile-pane")).toBe("preview");
});

test("reset restores sample content and mobile view", () => {
  edit(host.querySelector(".studio-demo-fields input"), "نام تازه");
  click(host.querySelector(".studio-demo-reset"));
  expect(preview().textContent).toContain("استودیو زیبایی لیما");
  expect(preview().classList.contains("preview-device--mobile")).toBe(true);
  expect(host.querySelector(".studio-demo").style.getPropertyValue("--demo-primary")).toBe("");
  expect(host.querySelector('a[href="/signup"]')).not.toBeNull();
});
