import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Plan from "./Plan";
import { useAuth } from "@/contexts/AuthContext";
jest.mock("@/contexts/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => require("react").createElement("a", { href: to, ...props }, children),
  useLocation: () => ({ search: "?plan=pro" }),
}), { virtual: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host; let root; let refresh;
beforeEach(() => {
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
  refresh = jest.fn().mockResolvedValue({ plan: "pro" });
  useAuth.mockReturnValue({ user: { id: "demo", plan: "pro", trial_active: false }, refresh });
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
test("the paid account shows its actual plan and six working tool routes", async () => {
  await act(async () => root.render(<Plan />));
  expect(refresh).toHaveBeenCalledTimes(1);
  expect(host.querySelector(".account-plan-status h2").textContent).toBe("حرفه‌ای");
  expect(host.querySelectorAll(".account-plan-tool a")).toHaveLength(6);
  for (const link of host.querySelectorAll(".account-plan-tool a")) expect(link.getAttribute("href")).toMatch(/^\/dashboard/);
  expect(host.querySelector('a[href="/login"],a[href="/signup"]')).toBeNull();
  expect(host.querySelector(".account-plan-selection")).toBeNull();
});
test("free users request an upgrade through support, not a pretend activation", async () => {
  useAuth.mockReturnValue({ user: { plan: "free" }, refresh });
  await act(async () => root.render(<Plan />));
  expect(host.querySelector(".account-plan-status h2").textContent).toBe("رایگان");
  expect(host.querySelector(".account-plan-selection a").getAttribute("href")).toBe("https://t.me/1ix_ir");
  expect(host.querySelector(".account-plan-selection").textContent).toContain("خودکار تغییر نمی‌دهد");
});
test("failed status checks show an error and can be retried without a login redirect", async () => {
  refresh.mockRejectedValueOnce(new Error("offline"));
  await act(async () => root.render(<Plan />));
  expect(host.querySelector('[role="alert"]')).not.toBeNull();
  expect(host.querySelector(".account-plan-active")).toBeNull();
  await act(async () => host.querySelector(".account-plan-heading button").click());
  expect(refresh).toHaveBeenCalledTimes(2);
  expect(host.querySelector('[role="alert"]')).toBeNull();
  expect(host.querySelector(".account-plan-active")).not.toBeNull();
});
