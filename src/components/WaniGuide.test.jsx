import React, { act } from "react";
import { createRoot } from "react-dom/client";
import WaniGuide from "./WaniGuide";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host;
let root;
beforeEach(() => { host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); });

const completePage = { business_name: "مطب", bio: "معرفی خدمات مطب", profile_image: "/logo.png", actions: [{ value: "09121234567" }], seo: { title: "مطب", description: "معرفی" }, booking: { enabled: false } };
const findButton = (text) => Array.from(host.querySelectorAll("button")).find((button) => button.textContent.includes(text));

test("Wani opens the exact incomplete editor section", () => {
  const onAction = jest.fn();
  act(() => root.render(<WaniGuide page={{ ...completePage, actions: [{ value: "" }] }} services={[]} onAction={onAction} onPreview={jest.fn()} />));
  expect(host.querySelector('[role="progressbar"]').getAttribute("aria-valuenow")).toBe("75");
  act(() => findButton("بریم تکمیلش کنیم").click());
  expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: "contact", tab: "actions", done: false }));
});

test("the expanded checklist remains actionable", () => {
  const onAction = jest.fn();
  act(() => root.render(<WaniGuide page={completePage} services={[]} onAction={onAction} onPreview={jest.fn()} />));
  act(() => findButton("چک‌لیست صفحه").click());
  expect(findButton("چک‌لیست صفحه").getAttribute("aria-expanded")).toBe("true");
  act(() => findButton("عنوان و توضیح اشتراک").click());
  expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ tab: "seo" }));
});

test("a completed page offers a real live-preview action", () => {
  const onPreview = jest.fn();
  act(() => root.render(<WaniGuide page={completePage} services={[]} onAction={jest.fn()} onPreview={onPreview} />));
  act(() => findButton("دیدن پیش‌نمایش").click());
  expect(onPreview).toHaveBeenCalledTimes(1);
  expect(host.querySelector('[role="progressbar"]').getAttribute("aria-valuenow")).toBe("100");
});
