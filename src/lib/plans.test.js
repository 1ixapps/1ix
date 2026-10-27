import { planAction, safeAuthReturn } from "./plans";
const pro = { id: "pro", name: "حرفه‌ای", cta: "ارتقا" };
test("anonymous visitors can sign up while existing users stay in their account", () => {
  expect(planAction(null, pro)).toEqual({ to: "/signup", label: "ارتقا" });
  expect(planAction({ plan: "free" }, pro).to).toBe("/dashboard/plan?plan=pro");
  expect(planAction({ plan: "pro" }, pro).to).toBe("/dashboard/plan");
});
test("a protected plan destination is preserved after authentication", () => {
  expect(safeAuthReturn("/dashboard/plan?plan=pro")).toBe("/dashboard/plan?plan=pro");
  expect(safeAuthReturn("/dashboard/page")).toBe("/dashboard/page");
});
test.each(["https://evil.example", "//evil.example", "/dashboard-evil", "/login", "/admin", "/dashboard\\evil", "/dashboard\nLocation:evil"])("unsafe return path is rejected: %s", (path) => {
  expect(safeAuthReturn(path)).toBe("/dashboard");
});
