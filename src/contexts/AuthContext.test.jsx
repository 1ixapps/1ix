import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider, useAuth } from "./AuthContext";
import api from "@/lib/api";
jest.mock("@/lib/api", () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() }, pickError: error => error?.response?.data?.detail || "خطایی رخ داد.", resetClientSession: jest.fn() }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const initial = { id: "demo", name: "Demo", plan: "free", role: "user" };
let host; let root; let current;
function Probe() { current = useAuth(); return <span>{current.user?.plan || "anonymous"}</span>; }
const mount = async () => { await act(async () => root.render(<AuthProvider><Probe /></AuthProvider>)); };
beforeEach(() => {
  jest.clearAllMocks(); localStorage.clear();
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
  api.get.mockResolvedValue({ data: { user: initial } });
  api.post.mockResolvedValue({ data: { user: initial, access_token: "test-token" } });
});
afterEach(() => { act(() => root.unmount()); host.remove(); localStorage.clear(); });
test("rechecking reads an upgraded plan without a new login", async () => {
  localStorage.setItem("access_token", "test-token"); await mount();
  const refresh = current.refresh;
  api.get.mockResolvedValue({ data: { user: { ...initial, plan: "pro" } } });
  await act(async () => current.refresh());
  expect(current.user.plan).toBe("pro");
  expect(current.refresh).toBe(refresh);
  expect(api.post).not.toHaveBeenCalled();
});
test("temporary refresh errors keep a valid session", async () => {
  localStorage.setItem("access_token", "test-token"); await mount();
  api.get.mockRejectedValue({ response: { status: 503 } });
  await act(async () => { await expect(current.refresh()).rejects.toBeDefined(); });
  expect(current.user.plan).toBe("free");
  expect(localStorage.getItem("access_token")).toBeNull();
  expect(current.authError).not.toBe("");
});
test("bootstrap connection failure remains recoverable without client-side credentials", async () => {
  localStorage.setItem("access_token", "test-token");
  api.get.mockRejectedValue(new Error("offline")); await mount();
  expect(current.loading).toBe(false);
  expect(current.authError).not.toBe("");
  expect(localStorage.getItem("access_token")).toBeNull();
  api.get.mockResolvedValue({ data: { user: { ...initial, plan: "pro" } } });
  await act(async () => current.refresh());
  expect(current.user.plan).toBe("pro");
  expect(current.authError).toBe("");
});
test("expired-session event clears the account", async () => {
  localStorage.setItem("access_token", "test-token"); await mount();
  act(() => window.dispatchEvent(new Event("auth:expired")));
  expect(current.user).toBeNull();
  expect(localStorage.getItem("access_token")).toBeNull();
});
test("a stale profile response cannot restore a logged-out session", async () => {
  localStorage.setItem("access_token", "test-token"); await mount();
  let finish;
  api.get.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  let pending;
  act(() => { pending = current.refresh(); });
  await act(async () => current.logout());
  await act(async () => { finish({ data: { user: initial } }); await pending; });
  expect(current.user).toBeNull();
  expect(localStorage.getItem("access_token")).toBeNull();
});
test("login accepts the server response without logging tokens", async () => {
  await mount();
  const log = jest.spyOn(console, "log").mockImplementation(() => {});
  try {
    await act(async () => current.login("demo@example.com", "test-password"));
    expect(current.user.id).toBe("demo");
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(log).not.toHaveBeenCalled();
  } finally { log.mockRestore(); }
});

test("registration awaiting email does not create a local session", async () => {
  api.get.mockResolvedValueOnce({ data: { user: null } });
  await mount();
  api.post.mockResolvedValueOnce({ data: { confirmation_required: true, email: "new@example.com" } });
  let result;
  await act(async () => { result = await current.register("new@example.com", "password"); });
  expect(api.post).toHaveBeenCalledWith("/auth/register", { email: "new@example.com", password: "password" });
  expect(result.confirmation_required).toBe(true);
  expect(current.user).toBeNull();
  expect(localStorage.getItem("access_token")).toBeNull();
});
test("the confirmed Supabase session is accepted only after the backend exchange succeeds", async () => {
  await mount();
  await act(async () => current.confirmEmail({ code: "code" }));
  expect(api.post).toHaveBeenCalledWith("/auth/exchange", { code: "code" });
  expect(current.user.id).toBe("demo");
  expect(localStorage.getItem("access_token")).toBeNull();
});

test("saving a profile name updates the current user without replacing plan or session data", async () => {
  localStorage.setItem("access_token", "test-token"); await mount();
  api.patch.mockResolvedValueOnce({ data: { ...initial, name: "نام تازه", plan: "pro" } });
  await act(async () => current.updateProfile("نام تازه"));
  expect(api.patch).toHaveBeenCalledWith("/auth/me", { name: "نام تازه" });
  expect(current.user.name).toBe("نام تازه");
  expect(current.user.plan).toBe("free");
  expect(localStorage.getItem("access_token")).toBeNull();
});

test("a profile save that finishes after logout cannot restore the old account", async () => {
  localStorage.setItem("access_token", "test-token"); await mount();
  let finish, pending;
  api.patch.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  act(() => { pending = current.updateProfile("نام تازه"); });
  await act(async () => current.logout());
  await act(async () => { finish({ data: { ...initial, name: "نام تازه" } }); await pending; });
  expect(current.user).toBeNull();
  expect(localStorage.getItem("access_token")).toBeNull();
});

test("reload restores the cookie-backed account even when localStorage contains no token", async () => {
  await mount();
  expect(api.get).toHaveBeenCalledWith("/auth/session");
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(current.user.id).toBe("demo");
  expect(current.loading).toBe(false);
});

test("anonymous visitors finish session checking without starting a login or refresh request", async () => {
  api.get.mockResolvedValueOnce({ data: { user: null } });
  await mount();
  expect(current.loading).toBe(false);
  expect(current.user).toBeNull();
  expect(current.authError).toBe("");
  expect(api.post).not.toHaveBeenCalled();
});

test("StrictMode bootstrap effects share one pending request", async () => {
  await act(async () => root.render(<React.StrictMode><AuthProvider><Probe /></AuthProvider></React.StrictMode>));
  expect(api.get).toHaveBeenCalledTimes(1);
  expect(current.loading).toBe(false);
  expect(current.user.id).toBe("demo");
});

test("concurrent profile refreshes share one request, including callers during bootstrap", async () => {
  let finish;
  api.get.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  await mount();
  let first, second;
  act(() => { first = current.refresh(); second = current.refresh(); });
  expect(first).toBe(second);
  expect(api.get).toHaveBeenCalledTimes(1);
  await act(async () => { finish({ data: { user: initial } }); await Promise.all([first, second]); });
  expect(current.loading).toBe(false);
});

test("blocked accounts are shown an actionable account error, not an authenticated workspace", async () => {
  api.get.mockRejectedValueOnce({ response: { status: 403, data: { detail: "حساب غیرفعال است." } } });
  await mount();
  expect(current.user).toBeNull();
  expect(current.loading).toBe(false);
  expect(current.authError).toBe("حساب غیرفعال است.");
});

test("a server logout failure is not reported as success or hidden from the caller", async () => {
  await mount();
  api.post.mockRejectedValueOnce({ response: { status: 503 } });
  await act(async () => { await expect(current.logout()).rejects.toBeDefined(); });
  expect(current.user.id).toBe("demo");
});

test("cookie restoration works even if the browser blocks localStorage access", async () => {
  const remove = jest.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new Error("blocked storage"); });
  try {
    await mount();
    expect(current.user.id).toBe("demo");
    expect(current.loading).toBe(false);
    expect(api.get).toHaveBeenCalledWith("/auth/session");
  } finally { remove.mockRestore(); }
});

test("contact phone saves update only the account phone fields without losing the name or plan", async () => {
  await mount();
  api.patch.mockResolvedValueOnce({ data: { ...initial, name: "stale name", plan: "business", phone: "09121234567", phone_verified: false } });
  await act(async () => current.updatePhone("09121234567"));
  expect(api.patch).toHaveBeenCalledWith("/auth/phone", { phone: "09121234567" });
  expect(current.user.phone).toBe("09121234567");
  expect(current.user.phone_verified).toBe(false);
  expect(current.user.name).toBe(initial.name);
  expect(current.user.plan).toBe(initial.plan);
});

test("a phone save response after logout cannot restore the previous account", async () => {
  await mount();
  let finish, pending;
  api.patch.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  act(() => { pending = current.updatePhone("09121234567"); });
  await act(async () => current.logout());
  await act(async () => { finish({ data: { ...initial, phone: "09121234567" } }); await pending; });
  expect(current.user).toBeNull();
});

test("concurrent name and contact phone saves merge their own fields regardless of response order", async () => {
  await mount();
  let finishName, finishPhone, pendingName, pendingPhone;
  api.patch.mockImplementationOnce(() => new Promise(resolve => { finishName = resolve; }))
    .mockImplementationOnce(() => new Promise(resolve => { finishPhone = resolve; }));
  act(() => { pendingName = current.updateProfile("نام جدید"); pendingPhone = current.updatePhone("09121234567"); });
  await act(async () => { finishPhone({ data: { ...initial, phone: "09121234567", phone_verified: false } }); await pendingPhone; });
  await act(async () => { finishName({ data: { ...initial, name: "نام جدید", phone: null } }); await pendingName; });
  expect(current.user.name).toBe("نام جدید");
  expect(current.user.phone).toBe("09121234567");
});
