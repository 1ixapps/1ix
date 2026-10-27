import React, { act } from "react";
import { createRoot } from "react-dom/client";
import PublicPage from "./PublicPage";
import api from "@/lib/api";
import { toast } from "sonner";

jest.mock("react-router-dom", () => ({ useParams: () => ({ username: "demo" }) }), { virtual: true });
jest.mock("@/lib/api", () => ({
  __esModule: true, default: { get: jest.fn(), post: jest.fn() }, fullUploadUrl: (value) => value,
}));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/components/JalaliDatePicker", () => ({ onChange }) => <button type="button" data-testid="choose-test-date" onClick={() => onChange("2026-10-21")}>انتخاب تاریخ تست</button>);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let host;
let root;
const page = { username: "demo", business_name: "کلینیک تست", booking: { enabled: true }, theme: { primary_color: "#4f46f7" }, working_hours: [], actions: [] };
const service = { id: "service-1", title: "مشاوره", price: 100000, duration_minutes: 30 };
const edit = (input, value) => act(() => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value); input.dispatchEvent(new Event("input", { bubbles: true })); });

beforeEach(async () => {
  jest.clearAllMocks();
  api.get.mockImplementation(async (url) => ({ data: url.startsWith("/public/page/") ? { page, services: [service] } : { slots: ["09:00", "09:30"], duration_minutes: 30 } }));
  api.post.mockResolvedValue({ data: { message: "درخواست رزرو ثبت شد" } });
  host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
  await act(async () => root.render(<PublicPage />));
});
afterEach(() => { act(() => root.unmount()); host.remove(); });

async function completeBooking() {
  await act(async () => host.querySelector('[aria-label="رزرو مشاوره"]').click());
  await act(async () => document.querySelector('[data-testid="choose-test-date"]').click());
  await act(async () => document.querySelector('[data-testid="slot-09:00"]').click());
  edit(document.querySelector('[data-testid="public-book-name"]'), "مشتری تست");
  edit(document.querySelector('[data-testid="public-book-phone"]'), "09121234567");
}

test("the shared public design still uses actual availability and the existing booking endpoint", async () => {
  expect(host.querySelector('[data-testid="business-page-content"]')).not.toBeNull();
  await completeBooking();
  expect(api.get).toHaveBeenCalledWith("/appointments/available-slots/demo?date=2026-10-21&service_id=service-1");
  expect(document.querySelector('[data-testid="public-book-submit"]').disabled).toBe(false);
  await act(async () => document.querySelector('[data-testid="public-booking-form"]').dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(api.post).toHaveBeenCalledWith("/public/page/demo/book", expect.objectContaining({
    service_id: "service-1", date: "2026-10-21", time: "09:00", customer_name: "مشتری تست", customer_phone: "09121234567",
  }));
  expect(document.querySelector('[role="dialog"]').textContent).toContain("درخواست رزرو ثبت شد");
});

test("a failed booking preserves customer data and never shows a fabricated confirmation", async () => {
  api.post.mockRejectedValue({ response: { data: { detail: "این ساعت دیگر آزاد نیست" } } });
  await completeBooking();
  await act(async () => document.querySelector('[data-testid="public-booking-form"]').dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  expect(toast.error).toHaveBeenCalledWith("این ساعت دیگر آزاد نیست");
  expect(document.querySelector('[data-testid="public-book-name"]').value).toBe("مشتری تست");
  expect(document.querySelector('[data-testid="public-booking-form"]')).not.toBeNull();
});
