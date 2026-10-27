import React,{act} from "react";
import {createRoot} from "react-dom/client";
import GoogleSignIn from "./GoogleSignIn";
import {beginGoogleSignIn} from "@/lib/googleAuth";
jest.mock("@/lib/googleAuth",()=>({beginGoogleSignIn:jest.fn()}));
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
let host,root;
beforeEach(()=>{jest.clearAllMocks();host=document.createElement("div");document.body.appendChild(host);root=createRoot(host);});
afterEach(()=>{act(()=>root.unmount());host.remove();});
const mount=async props=>act(async()=>root.render(<GoogleSignIn {...props}/>));
test("the accessible Google action is outside any form, uses a local official icon and has no extra inputs",async()=>{
  await mount({});
  const button=host.querySelector("button");
  expect(button.type).toBe("button");expect(button.textContent).toContain("ادامه با گوگل");
  expect(button.querySelector("img").getAttribute("src")).toBe("/google-g.svg");
  expect(button.querySelector("img").getAttribute("alt")).toBe("");
  expect(host.querySelector("input")).toBeNull();expect(host.textContent).not.toContain("Supabase");
});
test("an in-flight Google start is single-flight, visibly busy and blocks repeated clicks",async()=>{
  beginGoogleSignIn.mockImplementation(()=>new Promise(()=>{}));
  const changed=jest.fn();await mount({next:"/dashboard/page",onBusyChange:changed});
  const button=host.querySelector("button");
  await act(async()=>{button.click();button.click();});
  expect(beginGoogleSignIn).toHaveBeenCalledTimes(1);expect(beginGoogleSignIn).toHaveBeenCalledWith("/dashboard/page",expect.any(Function));
  expect(button.disabled).toBe(true);expect(button.getAttribute("aria-busy")).toBe("true");
  expect(button.textContent).toContain("در حال رفتن");expect(changed).toHaveBeenCalledWith(true);
});
test("failed Google entry shows an announced retryable error and re-enables the button",async()=>{
  beginGoogleSignIn.mockRejectedValue({response:{data:{detail:"ورود با گوگل فعلاً در دسترس نیست. با ایمیل وارد شو."}}});
  const changed=jest.fn();await mount({onBusyChange:changed});
  await act(async()=>host.querySelector("button").click());
  expect(host.querySelector('[role="alert"]').textContent).toContain("با ایمیل");
  expect(host.querySelector("button").disabled).toBe(false);expect(changed).toHaveBeenLastCalledWith(false);
  expect(host.querySelector("button").getAttribute("aria-describedby")).toBe(host.querySelector('[role="alert"]').id);
});
test("the email-submit disabled state prevents Google requests",async()=>{
  await mount({disabled:true});await act(async()=>host.querySelector("button").click());expect(beginGoogleSignIn).not.toHaveBeenCalled();
});
test("browser back/forward cache restoration does not leave the sign-in button permanently disabled",async()=>{
  beginGoogleSignIn.mockImplementation(()=>new Promise(()=>{}));await mount({});
  await act(async()=>host.querySelector("button").click());expect(host.querySelector("button").disabled).toBe(true);
  const event=new Event("pageshow");Object.defineProperty(event,"persisted",{value:true});
  act(()=>window.dispatchEvent(event));expect(host.querySelector("button").disabled).toBe(false);
});
