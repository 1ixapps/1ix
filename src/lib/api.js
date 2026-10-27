import axios from "axios";

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_ORIGIN || (process.env.NODE_ENV === "test" ? process.env.REACT_APP_BACKEND_URL : "") || "").replace(/\/+$/, "");
export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 25000,
  headers: { "Content-Type": "application/json" },
});
let sessionEpoch = 0;
let cookieVersion = 0;
let refreshFlight = null;

// HttpOnly cookies are the browser's credentials. Retire the old readable token.
export function resetClientSession() {
  sessionEpoch += 1;
  cookieVersion = 0;
  refreshFlight = null;
  try { localStorage.removeItem("access_token"); } catch {}
}

api.interceptors.request.use((config) => {
  if (config._sessionEpoch !== undefined && config._sessionEpoch !== sessionEpoch) throw new Error("نشست حساب تغییر کرده است.");
  config._sessionEpoch = sessionEpoch;
  config._cookieVersion = cookieVersion;
  return config;
});

function expireSession() {
  resetClientSession();
  window.dispatchEvent(new Event("auth:expired"));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isEntry = /\/auth\/(?:session|login|register|refresh|logout|forgot-password|reset-password|exchange|verify-email|resend)(?:[/?]|$)/.test(original?.url || "");
    const isPublic = /^\/?public\//.test(original?.url || "");
    if (error.response?.status !== 401 || !original || isEntry || isPublic || original.skipAuthRefresh) return Promise.reject(error);
    const epoch = original._sessionEpoch ?? sessionEpoch;
    if (epoch !== sessionEpoch) return Promise.reject(error);
    if (original._retry) { expireSession(); return Promise.reject(error); }
    original._retry = true;
    try {
      // A delayed 401 from before cookie rotation should replay, not rotate again.
      if ((original._cookieVersion ?? cookieVersion) === cookieVersion) {
        if (!refreshFlight || refreshFlight.epoch !== epoch) {
          const flight = { epoch };
          flight.promise = axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true, timeout: 25000 })
            .then(({ data }) => {
              if (!data.user || epoch !== sessionEpoch) throw new Error("نشست حساب تغییر کرده است.");
              cookieVersion += 1;
            }).finally(() => { if (refreshFlight === flight) refreshFlight = null; });
          refreshFlight = flight;
        }
        await refreshFlight.promise;
      }
      if (epoch !== sessionEpoch) throw new Error("نشست حساب تغییر کرده است.");
      return api(original);
    } catch (refreshError) {
      // Only a rejected session ends access. Timeouts and service errors allow retry.
      if ([401, 403].includes(refreshError.response?.status) && epoch === sessionEpoch) expireSession();
      return Promise.reject(refreshError);
    }
  },
);

export function formatApiErrorDetail(detail) {
    if (detail == null) return "خطایی رخ داد. لطفاً دوباره تلاش کنید.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
        return detail
            .map((e) =>
                e && typeof e.msg === "string" ? e.msg : JSON.stringify(e),
            )
            .filter(Boolean)
            .join(" ");
    if (detail && typeof detail.msg === "string") return detail.msg;
    return String(detail);
}

export function pickError(e) {
    return e?.response?.data?.detail != null ? formatApiErrorDetail(e.response.data.detail) : e?.message || "ارتباط برقرار نشد؛ دوباره تلاش کن.";
}

export async function uploadFile(file) {
    const { data } = await api.post("/uploads/sign", {
        filename: file.name,
        size: file.size,
        content_type: file.type,
    });
    // Send neither our bearer token nor cookies to the storage host.
    let response;
    try {
        response = await fetch(data.signed_url, {
            method: "PUT",
            headers: { "Content-Type": data.content_type },
            body: file,
            credentials: "omit",
        });
    } catch {
        throw { response: { data: { detail: "ارتباط با فضای ذخیره‌سازی برقرار نشد. دوباره تلاش کن." } } };
    }
    if (!response.ok) throw { response: { data: { detail: "ذخیرهٔ تصویر انجام نشد. دوباره تلاش کن." } } };
    return { data: { url: data.url, filename: data.filename } };
}
export function fullUploadUrl(pathOrUrl) {
    if (!pathOrUrl) return null;
    if (pathOrUrl.startsWith("http")) return pathOrUrl;
    return `${BACKEND_URL}${pathOrUrl}`;
}

export default api;
