import axios from "axios";
import api, { resetClientSession } from "./api";
jest.mock("axios", () => {
  const instance = jest.fn();
  instance.interceptors = { request: { use: jest.fn() }, response: { use: jest.fn() } };
  return { __esModule: true, default: { create: jest.fn(() => instance), post: jest.fn() } };
});
const rejected = api.interceptors.response.use.mock.calls[0][1];
const configure = api.interceptors.request.use.mock.calls[0][0];
const defaults = axios.create.mock.calls[0][0];
const unauthorized = (url = "/links") => ({ response: { status: 401 }, config: configure({ url, headers: {} }) });
beforeEach(() => {
  resetClientSession();
  axios.post.mockReset(); api.mockReset(); api.mockResolvedValue({ data: "retried" });
});
afterEach(() => localStorage.clear());

test("requests use HttpOnly cookies, have a timeout and never attach the legacy local token", () => {
  localStorage.setItem("access_token", "obsolete-token");
  expect(defaults.withCredentials).toBe(true);
  expect(defaults.timeout).toBe(25000);
  expect(configure({ headers: {} }).headers.Authorization).toBeUndefined();
});
test.each(["/auth/session", "/auth/login", "/auth/register", "/auth/refresh", "/auth/logout", "/public/page/demo/book"])("entry and public errors never launch refresh: %s", async (url) => {
  const error = unauthorized(url);
  await expect(rejected(error)).rejects.toBe(error);
  expect(axios.post).not.toHaveBeenCalled();
});
test("concurrent unauthorized requests share one cookie refresh even without localStorage", async () => {
  let finish;
  axios.post.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const first = rejected(unauthorized("/links"));
  const second = rejected(unauthorized("/services"));
  expect(axios.post).toHaveBeenCalledTimes(1);
  finish({ data: { user: { id: "owner" } } });
  await Promise.all([first, second]);
  expect(localStorage.getItem("access_token")).toBeNull();
  expect(api).toHaveBeenCalledTimes(2);
  for (const [config] of api.mock.calls) expect(config.headers.Authorization).toBeUndefined();
  expect(axios.post.mock.calls[0][2]).toEqual({ withCredentials: true, timeout: 25000 });
});
test("a delayed 401 from before rotation replays without issuing another refresh", async () => {
  const late = unauthorized("/services");
  axios.post.mockResolvedValue({ data: { user: { id: "owner" } } });
  await rejected(unauthorized());
  await rejected(late);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(api).toHaveBeenCalledTimes(2);
});
test.each([{ response: { status: 503 } }, { code: "ECONNABORTED" }])("transient refresh failures do not end the session", async error => {
  const expired = jest.fn(); window.addEventListener("auth:expired", expired);
  try {
    axios.post.mockRejectedValue(error);
    await expect(rejected(unauthorized())).rejects.toBe(error);
    expect(expired).not.toHaveBeenCalled();
    expect(api).not.toHaveBeenCalled();
  } finally { window.removeEventListener("auth:expired", expired); }
});
test("a truly expired cookie session ends access without forcing window navigation", async () => {
  const expired = jest.fn(); window.addEventListener("auth:expired", expired);
  try {
    axios.post.mockRejectedValue({ response: { status: 401 } });
    await expect(rejected(unauthorized())).rejects.toBeDefined();
    expect(expired).toHaveBeenCalledTimes(1);
  } finally { window.removeEventListener("auth:expired", expired); }
});
test("a refresh response arriving after logout never replays an old user's request", async () => {
  let finish;
  axios.post.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const pending = rejected(unauthorized());
  resetClientSession();
  finish({ data: { user: { id: "old-user" } } });
  await expect(pending).rejects.toBeDefined();
  expect(api).not.toHaveBeenCalled();
});
test("an old request cannot refresh or sign a different account out", async () => {
  const old = unauthorized();
  resetClientSession();
  await expect(rejected(old)).rejects.toBe(old);
  expect(axios.post).not.toHaveBeenCalled();
});
test("a request that is still unauthorized after retry stops without a refresh loop", async () => {
  const error = unauthorized();
  error.config._retry = true;
  await expect(rejected(error)).rejects.toBe(error);
  expect(axios.post).not.toHaveBeenCalled();
});
test("request replay is rejected if another account signed in while it was queued", () => {
  const config = configure({ url: "/links", headers: {} });
  resetClientSession();
  expect(() => configure(config)).toThrow("نشست حساب تغییر کرده");
});
