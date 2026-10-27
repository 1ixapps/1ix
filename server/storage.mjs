import { randomUUID } from "node:crypto";
import { fail } from "./http.mjs";

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml" };
export function uploadInfo(filename, size) {
  const extension = String(filename).toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
  if (!MIME[extension]) fail(400, "فرمت فایل پشتیبانی نمی‌شود");
  if (size <= 0 || size > MAX_UPLOAD_SIZE) fail(400, "حجم فایل باید حداکثر ۵ مگابایت باشد.");
  return { extension, contentType: MIME[extension] };
}
export function storageConfig() {
  const url = (process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "business-media";
  if (!url || !key || !/^[a-zA-Z0-9_-]+$/.test(bucket)) fail(503, "بارگذاری فایل فعلاً امکان‌پذیر نیست؛ کمی بعد دوباره تلاش کن.");
  const parsed = new URL(url);
  if (!["https:", "http:"].includes(parsed.protocol) || (process.env.NODE_ENV === "production" && parsed.protocol !== "https:")) fail(503, "بارگذاری فایل فعلاً امکان‌پذیر نیست؛ کمی بعد دوباره تلاش کن.");
  return { url, key, bucket };
}
const objectPath = name => name.split("/").map(encodeURIComponent).join("/");
export function createStorage(fetcher = fetch) {
  const request = async (path, options = {}) => {
    const { url, key } = storageConfig();
    const headers = { apikey: key, ...(key.startsWith("eyJ") ? { Authorization: "Bearer " + key } : {}), ...options.headers };
    let response;
    try { response = await fetcher(url + "/storage/v1" + path, { ...options, headers, signal: AbortSignal.timeout(20000) }); }
    catch { fail(502, "ارتباط با فضای ذخیره‌سازی برقرار نشد."); }
    if (!response.ok) fail(502, "فایل ذخیره نشد؛ کمی بعد دوباره تلاش کن.");
    return response;
  };
  const publicUrl = name => { const { url, bucket } = storageConfig(); return url + "/storage/v1/object/public/" + bucket + "/" + objectPath(name); };
  return {
    publicUrl,
    async sign({ filename, size }, user) {
      const { extension, contentType } = uploadInfo(filename, size);
      if (!/^[a-zA-Z0-9_-]+$/.test(user.id)) fail(400, "شناسهٔ حساب معتبر نیست.");
      const name = user.id + "/" + randomUUID().replaceAll("-", "") + extension;
      const { url, bucket } = storageConfig();
      const response = await request("/object/upload/sign/" + bucket + "/" + objectPath(name), { method: "POST", headers: { "Content-Type": "application/json", "x-upsert": "false" }, body: "{}" });
      const data = await response.json();
      if (typeof data.url !== "string" || !data.url.startsWith("/object/upload/sign/")) fail(502, "آماده‌سازی بارگذاری انجام نشد؛ دوباره تلاش کن.");
      return { signed_url: url + "/storage/v1" + data.url, url: publicUrl(name), filename: name, content_type: contentType };
    },
    async put(name, content, contentType, { upsert = false } = {}) {
      const { bucket } = storageConfig();
      await request("/object/" + bucket + "/" + objectPath(name), { method: "POST", headers: { "Content-Type": contentType, "x-upsert": String(upsert), "Cache-Control": "public, max-age=31536000, immutable" }, body: content });
      return publicUrl(name);
    },
    async legacy(filename) {
      if (!/^[a-f0-9]{32}\.(?:jpe?g|png|webp|gif|svg)$/i.test(filename)) fail(404, "فایل یافت نشد");
      return publicUrl("legacy/" + filename);
    },
  };
}
