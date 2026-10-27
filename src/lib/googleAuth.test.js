import api from "./api";
import { beginGoogleSignIn } from "./googleAuth";
jest.mock("./api", () => ({ __esModule:true, default:{post:jest.fn()} }));
beforeEach(()=>jest.clearAllMocks());
test("Google entry uses the same-origin API and navigates only to a validated HTTPS authorization URL",async()=>{
  api.post.mockResolvedValue({data:{url:"https://fixture.supabase.co/auth/v1/authorize?provider=google&code_challenge=challenge"}});
  const redirect=jest.fn();
  await beginGoogleSignIn("/dashboard/plan?plan=pro",redirect);
  expect(api.post).toHaveBeenCalledWith("/auth/oauth/google",{next:"/dashboard/plan?plan=pro"});
  expect(redirect).toHaveBeenCalledWith(expect.stringContaining("https://fixture.supabase.co/auth/v1/authorize"));
});
test.each(["javascript:alert(1)","http://fixture.supabase.co/auth/v1/authorize?provider=google","https://fixture.supabase.co/wrong?provider=google","https://fixture.supabase.co/auth/v1/authorize?provider=other","https://name:secret@fixture.supabase.co/auth/v1/authorize?provider=google"])("an invalid authorization URL is never opened: %s",async(url)=>{
  api.post.mockResolvedValue({data:{url}});const redirect=jest.fn();
  await expect(beginGoogleSignIn(undefined,redirect)).rejects.toThrow("آماده‌سازی");
  expect(redirect).not.toHaveBeenCalled();
});
test("network or provider failure remains a failure and never redirects",async()=>{
  const error={response:{data:{detail:"سرویس پاسخ نداد"}}};api.post.mockRejectedValue(error);const redirect=jest.fn();
  await expect(beginGoogleSignIn(undefined,redirect)).rejects.toBe(error);expect(redirect).not.toHaveBeenCalled();
  expect(api.post).toHaveBeenCalledWith("/auth/oauth/google",{});
});
