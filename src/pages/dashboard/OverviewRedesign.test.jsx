import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Overview from "./OverviewRedesign";
import api from "@/lib/api";
jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => require("react").createElement("a", { href: to, ...props }, children),
}), { virtual: true });
jest.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "owner", name: "علی محمدی" } }) }));
jest.mock("@/lib/api", () => ({
  __esModule: true, default: { get: jest.fn() }, fullUploadUrl: value => value,
  pickError: error => error?.response?.data?.detail || error.message || "دوباره تلاش کن.",
}));
jest.mock("@/components/Charts", () => ({ BarSeriesCard: () => null, LineSeriesCard: () => null }));
jest.mock("@/components/ShareDialog", () => () => null);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host, root;
const summary = {
  page: null, stats: { totals: { clicks: 48 }, appts_series: [], clicks_series: [] },
  active_link_count: 3, upcoming: [], upcoming_count: 12, unread_count: 4,
};
beforeEach(() => {
  api.get.mockReset(); api.get.mockResolvedValue({ data: summary });
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
const mount = async (strict = false) => { await act(async () => root.render(strict ? <React.StrictMode><Overview /></React.StrictMode> : <Overview />)); };

test("overview makes one summary request, not five separate protected requests", async () => {
  await mount();
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(api.get).toHaveBeenCalledWith("/dashboard/overview");
  expect(host.querySelector("h1").textContent).toContain("علی");
  expect(host.textContent).toContain("۴۸");
  expect(host.textContent).toContain("۳ لینک فعال");
  expect(host.textContent).toContain("۱۲");
  expect(host.textContent).toContain("۴");
});

test("StrictMode remount does not duplicate an in-flight dashboard request", async () => {
  await mount(true);
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(host.querySelector('[role="status"]')).toBeNull();
});

test("loading is announced and no false empty state is displayed before data arrives", async () => {
  let finish;
  api.get.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  await mount();
  expect(host.querySelector('[role="status"]')).not.toBeNull();
  expect(host.textContent).not.toContain("صفحه حرفه‌ای کسب‌وکارت را بساز");
  await act(async () => finish({ data: summary }));
  expect(host.querySelector("h1")).not.toBeNull();
});

test("network errors are actionable and never presented as a new account with zero records", async () => {
  api.get.mockRejectedValueOnce({ response: { data: { detail: "ارتباط موقتاً قطع شد." } } });
  await mount();
  expect(host.querySelector('[role="alert"]').textContent).toContain("ارتباط موقتاً قطع شد.");
  expect(host.textContent).not.toContain("قدم اول");
  expect(host.textContent).not.toContain("هنوز نوبتی ثبت نشده");
  await act(async () => host.querySelector("button").click());
  expect(api.get).toHaveBeenCalledTimes(2);
  expect(host.querySelector('[role="alert"]')).toBeNull();
  expect(host.querySelector("h1").textContent).toContain("خوش آمدید");
});

test("an incomplete summary is an error, not fabricated zero-valued metrics", async () => {
  api.get.mockResolvedValueOnce({ data: {} });
  await mount();
  expect(host.querySelector('[role="alert"]').textContent).toContain("کامل دریافت نشد");
  expect(host.textContent).not.toContain("شروع ساخت");
});
