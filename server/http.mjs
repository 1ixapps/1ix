export class HttpError extends Error {
  constructor(status, detail) { super(typeof detail === "string" ? detail : "Validation failed"); this.status = status; this.detail = detail; }
}
export const fail = (status, detail) => { throw new HttpError(status, detail); };
export const json = (data, status = 200, headers = {}) => Response.json(data, { status, headers: { "Cache-Control": "no-store", ...headers } });
export async function body(request, schema) {
  let data;
  if (Number(request.headers.get("content-length") || 0) > 1024 * 1024) fail(413, "حجم درخواست بیش از حد مجاز است.");
  try { data = await request.json(); } catch { fail(400, "اطلاعات درخواست قابل پردازش نیست؛ صفحه را تازه کن و دوباره تلاش کن."); }
  const result = schema.safeParse(data);
  if (!result.success) fail(422, result.error.issues.map(issue => ({ loc: ["body", ...issue.path], msg: issue.message, type: issue.code })));
  return result.data;
}
export function assertSameOrigin(request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  const origin = request.headers.get("origin");
  const allowed = [new URL(request.url).origin, ...(process.env.CORS_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean)];
  if (origin && !allowed.includes(origin)) fail(403, "مبدأ درخواست مجاز نیست.");
}
export function safeError(error) {
  if (error instanceof HttpError) return json({ detail: error.detail }, error.status);
  if (error.code === "23505") return json({ detail: "این مقدار قبلاً ثبت شده است." }, 400);
  if (error.code === "23P01") return json({ detail: "این بازه قبلاً رزرو شده؛ زمان دیگری انتخاب کن." }, 400);
  if (error.code === "23514") return json({ detail: "ذخیرهٔ اطلاعات انجام نشد؛ کمی بعد دوباره تلاش کن." }, 503);
  if (error.code === "22P02" || error.code === "22000") return json({ detail: "مقادیر واردشده معتبر نیستند." }, 400);
  // Log a classification only, never connection strings, SQL values or tokens.
  console.error("API failure:", /^[A-Z0-9_]+$/.test(error.code || "") ? error.code : error.name || "UnknownError");
  return json({ detail: "ارتباط با سرویس برقرار نشد. دوباره تلاش کن." }, 503);
}
