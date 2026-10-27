import { createHash } from "node:crypto";
import { defaultHours, normalizeDay } from "./validation.mjs";

export const legacyFilenamePattern = /^[a-f0-9]{32}\.(?:jpe?g|png|webp|gif|svg)$/i;
export function legacyIdentifier(entity, document) {
  if (document.id) return String(document.id);
  const natural = entity === "login_attempts" ? document.identifier : entity === "phone_otps" ? document.user_id : entity === "password_reset_tokens" ? document.token : document._id && String(document._id);
  if (!natural) throw new Error("Source record has no stable identifier in " + entity);
  return "legacy-" + createHash("sha256").update(entity + ":" + natural).digest("hex");
}
export function createNormalizer(oldOrigins = new Set()) {
  const references = new Set();
  function map(value, publicUrl) {
    if (Array.isArray(value)) return value.map(child => map(child, publicUrl));
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, map(child, publicUrl)]));
    if (typeof value !== "string") return value;
    let path = value;
    if (/^https?:\/\//.test(path)) {
      const parsed = new URL(path);
      if (!oldOrigins.has(parsed.origin)) {
        if (/^\/api\/uploads\/[a-f0-9]{32}\.(?:jpe?g|png|webp|gif|svg)$/i.test(parsed.pathname)) throw new Error("An absolute legacy upload origin is missing from LEGACY_UPLOAD_ORIGINS. Configure it before migration.");
        return value;
      }
      path = parsed.pathname;
    }
    const match = path.match(/^\/api\/uploads\/([^/?#]+)(?:[?#].*)?$/);
    if (!match || !legacyFilenamePattern.test(match[1])) return value;
    references.add(match[1]);
    return publicUrl ? publicUrl("legacy/" + match[1]) : value;
  }
  return {
    references,
    normalize(entity, original, publicUrl) {
      const { _id, ...rest } = original;
      const data = map(JSON.parse(JSON.stringify(rest)), publicUrl);
      if (entity === "pages") data.working_hours = data.working_hours?.length ? data.working_hours.map(hour => ({ ...hour, day: normalizeDay(hour.day) })) : defaultHours();
      return data;
    },
  };
}
