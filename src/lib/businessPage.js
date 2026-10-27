import { toEnglishDigits, toFarsiDigits } from "@/lib/jalali";

export const BUSINESS_DAYS = {
  saturday: "شنبه", sunday: "یکشنبه", monday: "دوشنبه", tuesday: "سه‌شنبه",
  wednesday: "چهارشنبه", thursday: "پنجشنبه", friday: "جمعه",
};

export function normalizeBrandColor(value, fallback = "#4f46f7") {
  if (/^#[0-9a-f]{6}$/i.test(value || "")) return value;
  if (/^#[0-9a-f]{3}$/i.test(value || "")) return "#" + value.slice(1).split("").map((c) => c + c).join("");
  return fallback;
}

export function contrastText(color) {
  const rgb = normalizeBrandColor(color).slice(1).match(/.{2}/g).map((part) => {
    const v = parseInt(part, 16) / 255;
    return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
  });
  const luminance = .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
  const whiteContrast = 1.05 / (luminance + .05);
  const inkContrast = (luminance + .05) / (.009 + .05);
  if (whiteContrast >= 4.5 && whiteContrast >= inkContrast) return "#ffffff";
  if (inkContrast >= 4.5) return "#17181b";
  return whiteContrast >= 4.5 ? "#ffffff" : "#000000";
}

export function servicePrice(value) {
  const normalized = toEnglishDigits(value == null ? "" : value).replace(/[,،٬\s]/g, "");
  const amount = Number(normalized);
  if (!normalized || !Number.isFinite(amount)) return "اعلام هزینه با هماهنگی";
  return amount === 0 ? "رایگان" : amount.toLocaleString("fa-IR") + " تومان";
}

/** Price-list values are authored text (e.g. «از ۳۰۰ هزار»), not a numeric API field. */
export function priceListText(value) {
  return value == null || value === "" ? "با هماهنگی" : toFarsiDigits(String(value));
}

export function safeBusinessUrl(value) {
  const raw = String(value || "").trim();
  if (!raw || /^(?:javascript|data|vbscript|file):/i.test(raw)) return null;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : "https://" + raw);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

export function businessActionHref(action) {
  const value = String(action.value || "").trim();
  if (!value) return null;
  const digits = toEnglishDigits(value);
  switch (action.type) {
    case "call": return "tel:" + digits.replace(/[^\d+]/g, "");
    case "email": return "mailto:" + value;
    case "whatsapp": return "https://wa.me/" + digits.replace(/\D/g, "");
    case "telegram": return /^https?:/i.test(value) ? safeBusinessUrl(value) : "https://t.me/" + encodeURIComponent(value.replace(/^@/, ""));
    case "instagram": return /^https?:/i.test(value) ? safeBusinessUrl(value) : "https://instagram.com/" + encodeURIComponent(value.replace(/^@/, ""));
    default: return safeBusinessUrl(value);
  }
}

export function previewGeometry(device, availableWidth, contentHeight = 0) {
  const available = Math.max(1, availableWidth || 390);
  const width = device === "desktop" ? 1040 : Math.min(390, available);
  const scale = Math.min(1, available / width);
  return { width, scale, scaledWidth: width * scale, height: Math.max(0, contentHeight * scale) };
}
