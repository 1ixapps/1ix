import React, { act } from "react";
import { createRoot } from "react-dom/client";
import SlotPicker from "./SlotPicker";
import api from "@/lib/api";
jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn() } }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host, root;
beforeEach(() => {
  api.get.mockReset();
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
test.each(["not_configured", "invalid_schedule", "disabled"])("customer availability messages hide internal configuration details: %s", async reason => {
  api.get.mockResolvedValueOnce({ data: { slots: [], reason } });
  await act(async () => root.render(<SlotPicker username="clinic" date="2026-11-01" onChange={jest.fn()} />));
  expect(host.textContent).toContain("از راه‌های ارتباطی صفحه هماهنگ کنید");
  expect(host.textContent).not.toMatch(/تعریف نشده|نیاز به اصلاح|تنظیم|فعال‌سازی/);
  expect(host.querySelector("button")).toBeNull();
});
test("business owners retain their real schedule-management action", async () => {
  const manage = jest.fn();
  api.get.mockResolvedValueOnce({ data: { slots: [], reason: "not_configured" } });
  await act(async () => root.render(<SlotPicker username="clinic" date="2026-11-01" onChange={jest.fn()} onManageSchedule={manage} />));
  expect(host.textContent).toContain("هنوز روز و ساعت قابل رزرو تعریف نشده");
  await act(async () => host.querySelector("button").click());
  expect(manage).toHaveBeenCalledTimes(1);
});
