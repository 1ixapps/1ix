import React, { act } from "react";
import { createRoot } from "react-dom/client";

import PageBuilder from "./PageBuilder";
import api from "@/lib/api";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => require("react").createElement("a", { href: to, ...props }, children),
  useNavigate: () => jest.fn(),
}), { virtual: true });

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
  uploadFile: jest.fn(),
  fullUploadUrl: (value) => value,
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const original = { id: "page-1", username: "demo", business_name: "مطب", bio: "معرفی", published: false, actions: [], working_hours: [], booking: { enabled: false }, theme: { primary_color: "#4f46f7", accent_color: "#ff6b5e", button_style: "rounded" } };
let host;
let root;
const editName = (value) => {
  const input = host.querySelector('[data-testid="page-business-name"]');
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
beforeEach(async () => {
  jest.clearAllMocks();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  api.get.mockImplementation(async (url) => ({ data: url === "/pages/me" ? { ...original } : [] }));
  api.patch.mockImplementation(async (url, payload) => ({ data: { ...original, ...payload } }));
  await act(async () => root.render(<PageBuilder />));
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

test("publishing includes the user's unsaved edits in the same API request", async () => {
  editName("نام ویرایش‌شده");
  await act(async () => host.querySelector('[data-testid="publish-toggle"]').click());
  expect(api.patch).toHaveBeenCalledWith("/pages/me", expect.objectContaining({ business_name: "نام ویرایش‌شده", published: true }));
  expect(host.querySelector('[data-testid="page-business-name"]').value).toBe("نام ویرایش‌شده");
});

test("typing during an in-flight save remains in the editor and stays dirty", async () => {
  let finish;
  api.patch.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  editName("ویرایش اول");
  act(() => host.querySelector('[data-testid="save-page-btn"]').click());
  editName("ویرایش جدیدتر");
  await act(async () => finish({ data: { ...original, business_name: "ویرایش اول", updated_at: "saved" } }));
  expect(host.querySelector('[data-testid="page-business-name"]').value).toBe("ویرایش جدیدتر");
  expect(host.querySelector('[data-testid="sticky-save-bar"]')).not.toBeNull();
  expect(host.querySelector('[data-testid="save-page-btn"]').disabled).toBe(false);
});

test("failed saves retain the draft and do not change the published state", async () => {
  api.patch.mockRejectedValue(new Error("network"));
  editName("ذخیره‌نشده");
  await act(async () => host.querySelector('[data-testid="publish-toggle"]').click());
  expect(host.querySelector('[data-testid="page-business-name"]').value).toBe("ذخیره‌نشده");
  expect(host.querySelector('[data-testid="publish-toggle"]').getAttribute("aria-checked")).toBe("false");
  expect(host.querySelector('[data-testid="sticky-save-bar"]')).not.toBeNull();
});

test("settings show eight labeled icon tabs with a clear active section", () => {
  const tabs = [...host.querySelectorAll('[data-testid="page-tabs"] [role="tab"]')];
  expect(tabs).toHaveLength(8);
  expect(tabs.every((tab) => tab.querySelector('svg[aria-hidden="true"]'))).toBe(true);
  expect(tabs.find((tab) => tab.getAttribute("aria-selected") === "true").textContent).toContain("اطلاعات");
  expect(host.querySelector('[role="tabpanel"][data-state="active"] h2').textContent).toBe("معرفی کسب‌وکار");
  expect(host.querySelector(".builder-settings-save-state").textContent).toBe("ذخیره شده");
  editName("نسخهٔ تازه");
  expect(host.querySelector(".builder-settings-save-state").textContent).toBe("ذخیره نشده");
});

test("keyboard activation opens real theme controls and their changes persist", async () => {
  const theme = [...host.querySelectorAll('[role="tab"]')].find((tab) => tab.textContent.includes("رنگ و ظاهر"));
  act(() => theme.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  expect(theme.getAttribute("aria-selected")).toBe("true");
  expect(host.querySelector('[role="tabpanel"][data-state="active"] h2').textContent).toBe("رنگ و ظاهر صفحه");
  const palette = host.querySelectorAll(".pro-palette")[1];
  act(() => palette.click());
  await act(async () => host.querySelector('[data-testid="save-page-btn"]').click());
  expect(api.patch).toHaveBeenCalledWith("/pages/me", expect.objectContaining({ theme: expect.objectContaining({ primary_color: expect.any(String), accent_color: expect.any(String) }) }));
  expect(host.querySelector(".builder-settings-save-state").textContent).toBe("ذخیره شده");
});

test("weekly schedule edits persist through the existing page API", async () => {
  const hours = [...host.querySelectorAll('[role="tab"]')].find((tab) => tab.textContent.includes("ساعت کاری"));
  act(() => hours.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  const setup = host.querySelector(".wh-empty button");
  act(() => setup.click());
  expect(host.querySelectorAll(".wh-day")).toHaveLength(7);
  act(() => host.querySelector('[data-testid="working-day-saturday"] [role="switch"]').click());
  await act(async () => host.querySelector('[data-testid="save-page-btn"]').click());
  expect(api.patch).toHaveBeenCalledWith("/pages/me", expect.objectContaining({
    working_hours: expect.arrayContaining([expect.objectContaining({ day: "saturday", enabled: false, open_time: "09:00", close_time: "18:00" })]),
  }));
});

test("editor header shows the business identity and opens the real preview", async () => {
  expect(host.querySelector(".editor-page-title h1").textContent).toBe(original.business_name);
  expect(host.querySelector(".editor-publication-badge").textContent).toBe("پیش‌نویس");
  expect(host.querySelector(".editor-page-address").textContent).toContain(original.username);
  expect(host.querySelector(".editor-guide-disclosure").open).toBe(false);
  await act(async () => host.querySelector('[data-testid="editor-preview-btn"]').click());
  const dialog = document.querySelector('[role="dialog"]');
  expect(dialog.querySelector('[data-testid="page-preview"]')).not.toBeNull();
});
test("publish controls only offer public-page links after actual API success", async () => {
  expect(host.querySelector(".editor-view-public")).toBeNull();
  await act(async () => host.querySelector('[data-testid="publish-toggle"]').click());
  expect(host.querySelector(".editor-publication-badge").textContent).toBe("منتشر شده");
  expect(host.querySelector(".editor-view-public").getAttribute("href")).toBe("/u/demo");
  expect(host.querySelector('[data-testid="share-page-btn"]')).not.toBeNull();
});
test("discard stays disabled during a save and can restore the last saved draft", async () => {
  let finish;
  api.patch.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  editName("در حال ذخیره");
  act(() => host.querySelector('[data-testid="save-page-btn"]').click());
  expect(host.querySelector('[data-testid="discard-changes-btn"]').disabled).toBe(true);
  await act(async () => finish({ data: { ...original, business_name: "در حال ذخیره" } }));
  editName("ویرایش بعدی");
  act(() => host.querySelector('[data-testid="discard-changes-btn"]').click());
  expect(host.querySelector('[data-testid="page-business-name"]').value).toBe("در حال ذخیره");
  expect(host.querySelector('[data-testid="sticky-save-bar"]')).toBeNull();
});
