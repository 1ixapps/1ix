import { subscriptionProgress } from "./subscription";

const now = Date.parse("2026-10-20T12:00:00Z");
const trial = { plan: "pro", trial_active: true, created_at: "2026-10-17T12:00:00Z", trial_ends_at: "2026-10-24T12:00:00Z" };
test("trial progress uses its real dates and rounds remaining partial days up", () => {
  const result = subscriptionProgress(trial, now);
  expect(result.state).toBe("active");
  expect(result.remainingDays).toBe(4);
  expect(result.totalDays).toBe(7);
  expect(result.percent).toBeCloseTo(400 / 7);
});
test("a paid account never reuses its old trial expiry or invents 30 days", () => {
  const result = subscriptionProgress({ ...trial, trial_active: false }, now);
  expect(result.state).toBe("unknown");
  expect(result.remainingDays).toBeNull();
  expect(result.percent).toBeNull();
});
test("the optional paid subscription dates are respected without assuming the account creation date", () => {
  const result = subscriptionProgress({ plan: "pro", created_at: "2025-01-01", subscription_starts_at: "2026-10-17T12:00:00Z", subscription_ends_at: "2026-11-16T12:00:00Z" }, now);
  expect(result.remainingDays).toBe(27);
  expect(result.percent).toBe(90);
});
test("a known end date can show remaining days even if the total duration is unknown", () => {
  const result = subscriptionProgress({ plan: "pro", subscription_ends_at: trial.trial_ends_at }, now);
  expect(result.remainingDays).toBe(4);
  expect(result.percent).toBeNull();
});
test("expired trials have zero remaining time, not a negative percentage", () => {
  expect(subscriptionProgress({ ...trial, plan: "free", trial_active: false, trial_ends_at: "2026-10-19T12:00:00Z" }, now)).toMatchObject({ state: "expired", trial: true, remainingDays: 0, percent: 0 });
  expect(subscriptionProgress(trial, Date.parse(trial.trial_ends_at))).toMatchObject({ state: "expired", remainingDays: 0, percent: 0 });
});
test("invalid dates never produce NaN, and free accounts do not show a pretend expiry", () => {
  expect(subscriptionProgress({ ...trial, trial_ends_at: "broken" }, now).state).toBe("unknown");
  expect(subscriptionProgress({ plan: "free" }, now).state).toBe("free");
  expect(subscriptionProgress(null, now).state).toBe("free");
});
test("clock skew is clamped and the final partial day is explicit", () => {
  expect(subscriptionProgress(trial, Date.parse(trial.created_at) - 1000).percent).toBe(100);
  const result = subscriptionProgress(trial, Date.parse(trial.trial_ends_at) - 1000);
  expect(result.remainingDays).toBe(1);
  expect(result.lessThanDay).toBe(true);
});

test("expired paid access shows its paid expiry rather than the older trial date", () => {
  const result = subscriptionProgress({ plan: "free", trial_active: false, trial_ends_at: "2026-01-01", subscription_ends_at: "2026-10-19T12:00:00Z" }, now);
  expect(result).toMatchObject({ state: "expired", trial: false, remainingDays: 0, percent: 0, end: Date.parse("2026-10-19T12:00:00Z") });
});
