const DAY_MS = 86400000;

function timestamp(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

// Dates describe the existing entitlement; this helper never activates or renews it.
export function subscriptionProgress(user, now = Date.now()) {
  const paid = ["pro", "business"].includes(user?.plan);
  const trial = Boolean(user?.trial_active);
  if (!paid && !trial) {
    const paidEnd = timestamp(user?.subscription_ends_at);
    if (paidEnd !== null && paidEnd <= now) return { state: "expired", trial: false, remainingDays: 0, percent: 0, end: paidEnd, totalDays: null };
    const trialEnd = timestamp(user?.trial_ends_at);
    return { state: trialEnd !== null && trialEnd <= now ? "expired" : "free", trial: trialEnd !== null && trialEnd <= now, remainingDays: 0, percent: 0, end: trialEnd, totalDays: null };
  }
  const end = timestamp(trial ? user?.trial_ends_at : user?.subscription_ends_at);
  if (end === null) return { state: "unknown", trial, remainingDays: null, percent: null, end: null, totalDays: null };
  // The existing registration flow grants a seven-day trial. Never assume a paid duration.
  const start = trial
    ? timestamp(user?.created_at) ?? end - 7 * DAY_MS
    : timestamp(user?.subscription_starts_at);
  const duration = start !== null && start < end ? end - start : null;
  const remaining = Math.max(0, end - now);
  return {
    state: remaining > 0 ? "active" : "expired",
    trial,
    end,
    remainingDays: Math.ceil(remaining / DAY_MS),
    lessThanDay: remaining > 0 && remaining < DAY_MS,
    totalDays: duration ? Math.ceil(duration / DAY_MS) : null,
    percent: duration ? Math.min(100, Math.max(0, remaining / duration * 100)) : null,
  };
}
