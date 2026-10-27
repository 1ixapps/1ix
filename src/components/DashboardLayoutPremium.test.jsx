import React, { act } from "react";
import { createRoot } from "react-dom/client";
import DashboardLayout from "./DashboardLayoutPremium";
import { useAuth } from "@/contexts/AuthContext";

let mockPathname = "/dashboard/settings";
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => require("react").createElement("a", { href: to, ...props }, children),
  NavLink: ({ to, children, className, end, ...props }) => {
    const isActive = to === mockPathname;
    return require("react").createElement("a", { href: to, ...props, onClick: (event) => { event.preventDefault(); props.onClick?.(event); }, className: typeof className === "function" ? className({ isActive }) : className }, typeof children === "function" ? children({ isActive }) : children);
  },
  Outlet: () => require("react").createElement("p", null, "محتوای صفحه"),
  useLocation: () => ({ pathname: mockPathname }),
  useNavigate: () => mockNavigate,
}), { virtual: true });
jest.mock("@/contexts/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host; let root; let logout;
beforeEach(() => {
  mockPathname = "/dashboard/settings"; mockNavigate.mockClear();
  logout = jest.fn().mockResolvedValue(undefined);
  useAuth.mockReturnValue({ user: { name: "کاربر آزمایشی", email: "demo@example.com", plan: "pro", role: "user" }, logout });
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
const render = async () => { await act(async () => root.render(<DashboardLayout />)); };
test("header identifies the active route and links the real paid plan", async () => {
  await render();
  expect(host.querySelector(".workspace-current-page").textContent).toBe("تنظیمات حساب");
  expect(host.querySelector(".workspace-plan-pill").textContent).toBe("حرفه‌ای");
  expect(host.querySelector(".workspace-plan-pill").getAttribute("href")).toBe("/dashboard/plan");
  expect(host.querySelector(".workspace-notifications").getAttribute("href")).toBe("/dashboard/notifications");
  expect(host.querySelector(".workspace-header").textContent).not.toContain("همه‌چیز برای رشد");
  mockPathname = "/dashboard/appointments"; await render();
  expect(host.querySelector(".workspace-current-page").textContent).toBe("نوبت‌ها و مشتریان");
});
test("mobile menu opens as an accessible dialog and closes after navigation", async () => {
  await render();
  await act(async () => host.querySelector('[aria-label="باز کردن منوی داشبورد"]').click());
  const dialog = document.querySelector('[role="dialog"]');
  expect(dialog).not.toBeNull();
  expect(dialog.textContent).toContain("منوی مدیریت کسب‌وکار");
  const link = dialog.querySelector('a[href="/dashboard/page"]');
  await act(async () => link.click());
  expect(document.querySelector('[role="dialog"]')).toBeNull();
  expect(document.activeElement).toBe(host.querySelector('[aria-label="باز کردن منوی داشبورد"]'));
});
test("account dropdown exposes settings and plan links without a sign-in redirect", async () => {
  await render();
  const trigger = host.querySelector('[aria-label="منوی حساب کاربری"]');
  await act(async () => trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  const menu = document.querySelector('[role="menu"]');
  expect(menu).not.toBeNull();
  expect(menu.querySelector('a[href="/dashboard/settings"]')).not.toBeNull();
  expect(menu.querySelector('a[href="/dashboard/plan"]')).not.toBeNull();
  expect(menu.querySelector('a[href="/login"]')).toBeNull();
  expect(menu.querySelector('a[href="/admin"]')).toBeNull();
});
test("logout keeps the existing auth workflow", async () => {
  await render();
  const button = [...host.querySelectorAll("button")].find((element) => element.textContent.includes("خروج از حساب"));
  await act(async () => button.click());
  expect(logout).toHaveBeenCalledTimes(1);
  expect(mockNavigate).toHaveBeenCalledWith("/");
});

test("the settings route gets a flexible full-height workspace and sidebar trial progress", async () => {
  const now = Date.now();
  useAuth.mockReturnValue({
    user: { name: "کاربر آزمایشی", email: "demo@example.com", plan: "pro", trial_active: true, created_at: new Date(now - 3.5 * 86400000).toISOString(), trial_ends_at: new Date(now + 3.5 * 86400000).toISOString() },
    logout,
  });
  await render();
  expect(host.querySelector(".workspace-body")).not.toBeNull();
  expect(host.querySelector("main.workspace-main")).not.toBeNull();
  const bar = host.querySelector(".dashboard-sidebar [role=progressbar]");
  expect(bar).not.toBeNull();
  expect(bar.getAttribute("aria-valuenow")).toBe("50");
  expect(bar.getAttribute("aria-valuetext")).toBe("۴ روز باقی مانده");
  expect(host.querySelector(".workspace-account-avatar.is-pro")).not.toBeNull();
});
