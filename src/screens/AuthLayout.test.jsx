import React, { act } from "react";
import { createRoot } from "react-dom/client";
import Login from "./Login";
import Signup from "./Signup";
import { useAuth } from "@/contexts/AuthContext";

jest.mock("react-router-dom", () => ({
  Link: ({ to, children, ...props }) => require("react").createElement("a", { href: to, ...props }, children),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ state: null }),
}), { virtual: true });
jest.mock("@/contexts/AuthContext", () => ({ useAuth: jest.fn() }));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let host, root;
beforeEach(() => {
  useAuth.mockReturnValue({ login: jest.fn(), register: jest.fn() });
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

test.each([["login", Login], ["signup", Signup]])("%s has a single domain footer and explicitly grouped side-panel icons", async (_, Screen) => {
  await act(async () => root.render(<Screen />));
  const copyright = host.querySelector(".auth-copyright");
  expect(copyright.textContent.match(/1ix\.ir/g)).toHaveLength(1);
  expect(copyright.getAttribute("dir")).toBe("ltr");
  expect(copyright.textContent).toMatch(/© [۰-۹]{4}/);
  expect(host.querySelector(".auth-shell").getAttribute("dir")).toBe("rtl");
  const items = host.querySelectorAll(".auth-brand-list li");
  expect(items).toHaveLength(3);
  items.forEach(item => {
    expect(item.children).toHaveLength(2);
    expect(item.querySelector(".auth-benefit-icon > svg").getAttribute("aria-hidden")).toBe("true");
    expect(item.querySelector(".auth-benefit-text").textContent.length).toBeGreaterThan(0);
  });
  expect(host.querySelector(".auth-platform-badge").textContent).toContain("پلتفرم کسب‌وکار آنلاین");
  expect(host.textContent).not.toContain("موافقت می‌کنید");
  expect(host.querySelector('a[href="#"]')).toBeNull();
});

test("password icons and visibility controls remain anchored inside their own fields on both screens", async () => {
  for (const Screen of [Login, Signup]) {
    await act(async () => root.render(<Screen />));
    const password = host.querySelector("#password");
    const field = password.closest(".auth-field");
    expect(field.querySelector(".auth-field-icon")).not.toBeNull();
    const toggle = field.querySelector("button");
    expect(toggle.getAttribute("aria-label")).toBe("نمایش رمز");
    expect(password.type).toBe("password");
    await act(async () => toggle.click());
    expect(password.type).toBe("text");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(toggle.getAttribute("aria-label")).toBe("پنهان کردن رمز");
    expect(host.querySelector('label[for="email"]')).not.toBeNull();
    expect(host.querySelector('label[for="password"]')).not.toBeNull();
  }
});
