// Shared allowlist for post-login navigation; never allow an external redirect.
export function safeAuthReturn(value, fallback = "/dashboard") {
  return typeof value === "string" && value.length <= 2048 &&
    /^\/dashboard(?:\/|\?|$)/.test(value) && !/[\\\u0000-\u001f\u007f]/.test(value) ? value : fallback;
}
