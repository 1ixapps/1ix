import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import BusinessCategorySelect, { BUSINESS_CATEGORIES, templateCategory } from "./BusinessCategorySelect";
import { TEMPLATES } from "@/lib/templates";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host; let root;
beforeEach(() => {
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
  if (!HTMLElement.prototype.scrollIntoView) HTMLElement.prototype.scrollIntoView = jest.fn();
  if (!HTMLElement.prototype.hasPointerCapture) HTMLElement.prototype.hasPointerCapture = () => false;
  if (!HTMLElement.prototype.releasePointerCapture) HTMLElement.prototype.releasePointerCapture = jest.fn();
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

test("each supported category and template has an appropriate vector icon", () => {
  expect(new Set(BUSINESS_CATEGORIES.map((item) => item.value)).size).toBe(10);
  expect(new Set(BUSINESS_CATEGORIES.map((item) => item.icon)).size).toBe(10);
  expect(TEMPLATES.every((template) => templateCategory(template.id).icon)).toBe(true);
});

test("category choices are grouped, keyboard accessible and preserve backend values", async () => {
  const changed = jest.fn();
  function Harness() {
    const [value, setValue] = useState("پزشک");
    return <><label htmlFor="test-category">دسته‌بندی</label><BusinessCategorySelect id="test-category" value={value} onValueChange={(next) => { setValue(next); changed(next); }} /></>;
  }
  await act(async () => root.render(<Harness />));
  const trigger = host.querySelector('[role="combobox"]');
  expect(trigger.textContent).toContain("پزشک");
  expect(trigger.querySelector("svg")).not.toBeNull();
  await act(async () => trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })));
  const list = document.querySelector('[role="listbox"]');
  expect(list).not.toBeNull();
  expect(list.textContent).toContain("سلامت و زیبایی");
  expect(list.textContent).toContain("کسب‌وکار و خدمات");
  const options = [...document.querySelectorAll('[role="option"]')];
  expect(options).toHaveLength(10);
  expect(options.every((option) => option.querySelector(".builder-category-icon svg"))).toBe(true);
  const salon = options.find((option) => option.textContent.includes("آرایشگاه / سالن زیبایی"));
  await act(async () => salon.click());
  expect(changed).toHaveBeenCalledWith("آرایشگاه / سالن زیبایی");
  expect(trigger.textContent).toContain("آرایشگاه / سالن زیبایی");
});

test("an existing custom category stays visible without silently replacing it", async () => {
  await act(async () => root.render(<BusinessCategorySelect id="custom-category" value="استودیوی یوگا" onValueChange={jest.fn()} />));
  expect(host.querySelector('[role="combobox"]').textContent).toContain("استودیوی یوگا");
});
