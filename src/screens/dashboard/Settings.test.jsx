import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Settings from "./Settings";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => require("react").createElement("a", { href: to, ...props }, children),
}), { virtual: true });
jest.mock("@/contexts/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/api", () => ({ __esModule: true, default: { post: jest.fn(), patch: jest.fn() } }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host, root, user, updateProfile, updatePhone;
beforeEach(() => {
  user = { id: "settings-fixture", name: "کاربر آزمایشی", email: "long-address@example.com", plan: "pro", phone: null, phone_verified: false };
  updateProfile = jest.fn().mockImplementation(async name => { user = { ...user, name }; return user; });
  updatePhone = jest.fn().mockImplementation(async phone => { user = { ...user, phone, phone_verified: false }; return user; });
  useAuth.mockImplementation(() => ({ user, updateProfile, updatePhone }));
  api.post.mockReset(); api.patch.mockReset();
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
const render = async () => { await act(async () => root.render(<Settings />)); };
const type = (id, value) => act(() => {
  const input = host.querySelector("#" + id);
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
});
const submit = async () => { await act(async () => host.querySelector(".account-settings-phone-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))); };

test("settings retains all sections without infrastructure warnings or unsupported OTP controls", async () => {
  await render();
  expect(host.querySelector(".account-settings").className).not.toMatch(/max-w-/);
  expect(host.querySelectorAll(".account-settings-card")).toHaveLength(4);
  expect(host.querySelector('a[href="/dashboard/plan"]')).not.toBeNull();
  expect(host.querySelector('a[href="/forgot-password"]')).not.toBeNull();
  expect(host.textContent).not.toMatch(/پیامک|فعال‌سازی|توسط مدیر|دریافت کد|سرویس|OTP/);
  expect(host.querySelector("#settings-code")).toBeNull();
});

test("Persian phone numbers save directly, update the field and never trigger an SMS request", async () => {
  await render();
  expect(host.querySelector('label[for="settings-phone"]')).not.toBeNull();
  type("settings-phone", "۰۹۱۲ ۱۲۳-۴۵۶۷"); await submit();
  expect(updatePhone).toHaveBeenCalledWith("09121234567");
  expect(api.post).not.toHaveBeenCalled();
  expect(host.querySelector("#settings-phone").value).toBe("۰۹۱۲۱۲۳۴۵۶۷");
  expect(host.querySelector(".account-settings-phone-form [role=status]").textContent).toContain("شماره موبایل ذخیره شد");
  expect(host.textContent).not.toContain("تأیید شده");
});

test("invalid phone input is explained inline and focused without sending a request", async () => {
  await render(); type("settings-phone", "x"); await submit();
  expect(updatePhone).not.toHaveBeenCalled();
  expect(host.querySelector("#phone-error").textContent).toContain("شماره موبایل معتبر");
  expect(host.querySelector("#settings-phone").getAttribute("aria-invalid")).toBe("true");
  expect(document.activeElement.id).toBe("settings-phone");
});

test("phone save failures retain the draft and never report success", async () => {
  updatePhone.mockRejectedValueOnce({ response: { data: { detail: "تلاش دوباره لازم است" } } });
  await render(); type("settings-phone", "09121234567"); await submit();
  expect(host.querySelector("#phone-error").textContent).toBe("تلاش دوباره لازم است");
  expect(host.querySelector("#settings-phone").value).toBe("09121234567");
  expect(host.querySelector(".account-settings-phone-form [role=status]")).toBeNull();
  expect(host.querySelector('.account-settings-phone-form [type="submit"]').disabled).toBe(false);
});

test("existing verified numbers remain editable and subscription progress is preserved", async () => {
  user = { ...user, phone_verified: true, phone: "09121234567", trial_active: true, created_at: new Date(Date.now() - 86400000).toISOString(), trial_ends_at: new Date(Date.now() + 6 * 86400000).toISOString() };
  await render();
  expect(host.querySelector("#settings-phone").value).toBe("۰۹۱۲۱۲۳۴۵۶۷");
  expect(host.querySelector('[role="progressbar"]')).not.toBeNull();
  type("settings-phone", "09351234567"); await submit();
  expect(updatePhone).toHaveBeenCalledWith("09351234567");
});

test("phone edits can be cancelled without changing the saved number", async () => {
  user = { ...user, phone: "09121234567" };
  await render(); type("settings-phone", "09351234567");
  await act(async () => host.querySelector(".account-settings-phone-form button[type=button]").click());
  expect(host.querySelector("#settings-phone").value).toBe("۰۹۱۲۱۲۳۴۵۶۷");
  expect(updatePhone).not.toHaveBeenCalled();
});

test("pending saves disable the phone field and cannot be submitted twice", async () => {
  let finish;
  updatePhone.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  await render(); type("settings-phone", "09121234567"); await submit();
  expect(host.querySelector('.account-settings-phone-form [type="submit"]').disabled).toBe(true);
  expect(host.querySelector("#settings-phone").disabled).toBe(true);
  expect(host.querySelector(".account-settings-phone-form").getAttribute("aria-busy")).toBe("true");
  expect(host.querySelector(".account-settings-phone-form [role=status]")).toBeNull();
  await submit();
  expect(updatePhone).toHaveBeenCalledTimes(1);
  await act(async () => { user = { ...user, phone: "09121234567" }; finish(user); });
  expect(host.querySelector(".account-settings-phone-form [role=status]")).not.toBeNull();
});

test("Arabic digits and international prefixes normalize consistently", async () => {
  await render(); type("settings-phone", "٠٠٩٨ (٩١٢) ١٢٣-٤٥٦٧"); await submit();
  expect(updatePhone).toHaveBeenCalledWith("+989121234567");
});

test("unchanged phone numbers do not send redundant saves", async () => {
  user = { ...user, phone: "09121234567" };
  await render(); await submit();
  expect(updatePhone).not.toHaveBeenCalled();
  expect(host.querySelector('.account-settings-phone-form [type="submit"]').disabled).toBe(true);
});

const submitProfile = async () => { await act(async () => host.querySelector(".account-settings-profile-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))); };

test("the email-derived name is editable, persisted, reflected in the profile and announced after success", async () => {
  await render();
  expect(host.querySelector('label[for="settings-name"]')).not.toBeNull();
  expect(host.querySelector("#settings-name").value).toBe(user.name);
  expect(host.querySelector('.account-settings-profile-form [type="submit"]').disabled).toBe(true);
  type("settings-name", "  نام دلخواه  "); await submitProfile();
  expect(updateProfile).toHaveBeenCalledWith("نام دلخواه");
  expect(host.querySelector(".account-settings-profile strong").textContent).toBe("نام دلخواه");
  expect(host.querySelector('[role="status"]').textContent).toContain("نام ذخیره شد");
});

test("empty names explain the problem and focus the field without sending a request", async () => {
  await render(); type("settings-name", "  "); await submitProfile();
  expect(updateProfile).not.toHaveBeenCalled();
  expect(host.querySelector("#settings-name-error").textContent).toContain("نام و نام خانوادگی");
  expect(document.activeElement.id).toBe("settings-name");
});

test("failed name saves retain the draft, show the API failure and never announce success", async () => {
  updateProfile.mockRejectedValueOnce({ response: { data: { detail: "سرویس در دسترس نیست." } } });
  await render(); type("settings-name", "نام تازه"); await submitProfile();
  expect(host.querySelector("#settings-name").value).toBe("نام تازه");
  expect(host.querySelector("#settings-name-error").textContent).toBe("سرویس در دسترس نیست.");
  expect(host.querySelector(".account-settings-save-status")).toBeNull();
  expect(host.querySelector('.account-settings-profile-form [type="submit"]').disabled).toBe(false);
});

test("name edits can be cancelled without changing the account", async () => {
  await render(); type("settings-name", "نام موقت");
  await act(async () => [...host.querySelectorAll("button")].find(button => button.textContent === "انصراف").click());
  expect(host.querySelector("#settings-name").value).toBe(user.name);
  expect(updateProfile).not.toHaveBeenCalled();
});

test("pending name saves disable the form and cannot be submitted twice", async () => {
  let finish;
  updateProfile.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  await render(); type("settings-name", "نام تازه"); await submitProfile();
  expect(host.querySelector(".account-settings-profile-form").getAttribute("aria-busy")).toBe("true");
  expect(host.querySelector("#settings-name").disabled).toBe(true);
  await submitProfile();
  expect(updateProfile).toHaveBeenCalledTimes(1);
  await act(async () => finish({ ...user, name: "نام تازه" }));
});
