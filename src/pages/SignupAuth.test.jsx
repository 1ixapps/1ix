import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Signup from "./Signup";
import AuthConfirm from "./AuthConfirm";
import { useAuth } from "@/contexts/AuthContext";
jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => require("react").createElement("a", { href: to, ...props }, children),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(mockQuery)],
}), { virtual: true });
jest.mock("@/contexts/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("@/pages/Login", () => ({
  AuthShell: ({ children }) => require("react").createElement("main", null, children),
  AuthSidePanel: () => null,
}));
jest.mock("@/lib/api", () => ({ __esModule: true, default: { post: jest.fn() }, pickError: error => typeof error?.response?.data?.detail === "string" ? error.response.data.detail : "اطلاعات فرم را بررسی کن." }));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const mockNavigate = jest.fn();
let mockQuery = "";
let host, root, register, confirmEmail;
beforeEach(() => {
  mockNavigate.mockReset(); mockQuery = "";
  register = jest.fn().mockResolvedValue({ confirmation_required: true, email: "test@example.com" });
  confirmEmail = jest.fn().mockResolvedValue({ role: "user" });
  useAuth.mockReturnValue({ register, confirmEmail });
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
const render = async element => { await act(async () => root.render(element)); };
const type = (id, value) => act(() => {
  const input = host.querySelector("#" + id);
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
});
const submit = async () => { await act(async () => host.querySelector("form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))); };
const fill = () => { type("email", "Test@Example.com"); type("password", "Test@1234"); };

test("signup explains each invalid field and focuses the first one without making a request", async () => {
  await render(<Signup />); await submit();
  expect(register).not.toHaveBeenCalled();
  expect(host.querySelector("#name")).toBeNull();
  expect(host.querySelector("#email-error").textContent).toContain("ایمیل");
  expect(host.querySelector("#password").getAttribute("aria-invalid")).toBe("true");
  expect(document.activeElement.id).toBe("email");
});

test("signup only asks for email and password and has no placeholder legal agreement", async () => {
  await render(<Signup />);
  expect(host.querySelectorAll("input")).toHaveLength(2);
  expect(host.querySelector('[data-testid="signup-name-input"]')).toBeNull();
  expect(host.textContent).not.toContain("موافقت می‌کنید");
  expect(host.querySelector('a[href="#"]')).toBeNull();
});

test("pending signup shows email confirmation, never navigating to an authenticated dashboard", async () => {
  await render(<Signup />); fill(); await submit();
  expect(register).toHaveBeenCalledWith("test@example.com", "Test@1234");
  expect(host.querySelector("h1").textContent).toBe("ایمیلت را تأیید کن");
  expect(host.textContent).toContain("test@example.com");
  expect(mockNavigate).not.toHaveBeenCalled();
  expect(host.querySelector(".auth-resend").disabled).toBe(true);
  const edit = [...host.querySelectorAll("button")].find(button => button.textContent === "اصلاح ایمیل");
  await act(async () => edit.click());
  expect(host.querySelector("#password").value).toBe("");
});

test("a failed signup preserves inputs and shows the actual service error inline", async () => {
  register.mockRejectedValue({ response: { data: { detail: "سرویس ورود موقتاً در دسترس نیست." } } });
  await render(<Signup />); fill(); await submit();
  expect(host.querySelector('[role="alert"]').textContent).toContain("سرویس ورود");
  expect(host.querySelector("#email").value).toBe("Test@Example.com");
  expect(host.querySelector('[type="submit"]').disabled).toBe(false);
});

test("confirmation is a deliberate click, not an automatic effect that email scanners consume", async () => {
  mockQuery = "code=one-time-code";
  await render(<AuthConfirm />);
  expect(confirmEmail).not.toHaveBeenCalled();
  await act(async () => host.querySelector("button").click());
  expect(confirmEmail).toHaveBeenCalledWith({ code: "one-time-code" });
  expect(mockNavigate).toHaveBeenCalledWith("/dashboard/page", { replace: true });
});

test("Supabase recovery confirmation leads to the new password form", async () => {
  mockQuery = "token_hash=recovery-hash&type=recovery";
  await render(<AuthConfirm />);
  await act(async () => host.querySelector("button").click());
  expect(confirmEmail).toHaveBeenCalledWith({ token_hash: "recovery-hash", type: "recovery" });
  expect(mockNavigate).toHaveBeenCalledWith("/reset-password", { replace: true });
});

test("missing or expired confirmation offers a recovery route instead of pretending success", async () => {
  mockQuery = "error=access_denied";
  await render(<AuthConfirm />);
  expect(host.querySelector("button")).toBeNull();
  expect(host.textContent).toContain("لینک معتبر نیست");
  expect(host.querySelector('a[href="/signup"]')).not.toBeNull();
  expect(confirmEmail).not.toHaveBeenCalled();
});
