import React, { act } from "react";
import { createRoot } from "react-dom/client";
import SubscriptionProgress from "./SubscriptionProgress";
import AccountAvatar from "./AccountAvatar";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host; let root; let clock;
const trial = { plan: "pro", trial_active: true, created_at: "2026-10-17T12:00:00Z", trial_ends_at: "2026-10-24T12:00:00Z" };
beforeEach(() => {
  clock = jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-10-20T12:00:00Z"));
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); clock.mockRestore(); });
test("renders a Persian remaining-day counter and an accessible real progress bar", () => {
  act(() => root.render(<SubscriptionProgress user={trial} />));
  const bar = host.querySelector('[role="progressbar"]');
  expect(bar.getAttribute("aria-valuenow")).toBe("57");
  expect(bar.getAttribute("aria-valuetext")).toBe("۴ روز باقی مانده");
  expect(host.textContent).toContain("دورهٔ ۷ روزه");
  expect(host.querySelector("time").getAttribute("dateTime")).toBe("2026-10-24T12:00:00.000Z");
});
test("paid accounts without an expiry display an honest neutral track", () => {
  act(() => root.render(<SubscriptionProgress user={{ plan: "pro" }} />));
  const bar = host.querySelector('[role="progressbar"]');
  expect(bar.hasAttribute("aria-valuenow")).toBe(false);
  expect(host.textContent).toContain("تاریخ پایان ثبت نشده");
  expect(host.textContent).not.toContain("۳۰");
});
test("free accounts without a subscription do not display a misleading progress percentage", () => {
  act(() => root.render(<SubscriptionProgress user={{ plan: "free" }} />));
  expect(host.querySelector('[role="progressbar"]')).toBeNull();
  expect(host.textContent).toContain("پلن رایگان فعال است");
});
test("the day counter refreshes when returning to the window", () => {
  act(() => root.render(<SubscriptionProgress user={trial} />));
  clock.mockReturnValue(Date.parse("2026-10-24T12:00:01Z"));
  act(() => window.dispatchEvent(new Event("focus")));
  expect(host.querySelector('[role="progressbar"]').getAttribute("aria-valuenow")).toBe("0");
  expect(host.textContent).toContain("دورهٔ آزمایشی تمام شده");
});
test("the spectrum treatment belongs to pro accounts, not free accounts", () => {
  act(() => root.render(<AccountAvatar user={{ name: "علی", plan: "pro" }} />));
  expect(host.querySelector(".account-avatar.is-pro")).not.toBeNull();
  expect(host.querySelector(".account-avatar-face").textContent).toBe("ع");
  act(() => root.render(<AccountAvatar user={{ name: "علی", plan: "free" }} />));
  expect(host.querySelector(".account-avatar.is-pro")).toBeNull();
});
