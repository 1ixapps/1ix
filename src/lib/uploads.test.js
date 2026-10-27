import api, { uploadFile, fullUploadUrl } from "./api";
jest.mock("axios", () => ({ __esModule: true, default: { create: () => ({
  post: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
}) } }));
const originalFetch = global.fetch;
const signed = { signed_url: "https://storage.example/upload?token=temporary", url: "https://storage.example/public/owner/image.png", filename: "owner/image.png", content_type: "image/png" };
let file;
beforeEach(() => {
  api.post.mockReset(); api.post.mockResolvedValue({ data: signed });
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  file = new File(["image"], "image.png", { type: "image/png" });
});
afterAll(() => { if (originalFetch === undefined) delete global.fetch; else global.fetch = originalFetch; });

test("signed uploads send file bytes without account cookies or bearer tokens", async () => {
  const result = await uploadFile(file);
  expect(api.post).toHaveBeenCalledWith("/uploads/sign", { filename: file.name, size: file.size, content_type: file.type });
  expect(global.fetch).toHaveBeenCalledWith(signed.signed_url, {
    method: "PUT", body: file, credentials: "omit", headers: { "Content-Type": "image/png" },
  });
  expect(result).toEqual({ data: { url: signed.url, filename: signed.filename } });
});

test("upload completion waits for storage, not just the signing response", async () => {
  let complete, started;
  const waitingForStorage = new Promise(resolve => { started = resolve; });
  global.fetch.mockImplementation(() => new Promise(resolve => { complete = resolve; started(); }));
  let done = false;
  const pending = uploadFile(file).then(value => { done = true; return value; });
  await waitingForStorage;
  expect(done).toBe(false);
  complete({ ok: true });
  await expect(pending).resolves.toMatchObject({ data: { url: signed.url } });
});

test("storage HTTP errors cannot be reported as a saved image", async () => {
  global.fetch.mockResolvedValue({ ok: false, status: 403 });
  await expect(uploadFile(file)).rejects.toMatchObject({ response: { data: { detail: expect.stringContaining("انجام نشد") } } });
});

test("network failures produce a useful error and do not fabricate a URL", async () => {
  global.fetch.mockRejectedValue(new TypeError("connection failed"));
  await expect(uploadFile(file)).rejects.toMatchObject({ response: { data: { detail: expect.stringContaining("ارتباط") } } });
});

test("failed authorization stops before sending bytes to storage", async () => {
  const failure = { response: { status: 401 } };
  api.post.mockRejectedValue(failure);
  await expect(uploadFile(file)).rejects.toBe(failure);
  expect(global.fetch).not.toHaveBeenCalled();
  expect(fullUploadUrl(signed.url)).toBe(signed.url);
});
