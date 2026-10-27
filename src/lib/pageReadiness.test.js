import { pageReadiness, suggestedSeo, reconcileSavedPage } from "./pageReadiness";

describe("Wani page guidance", () => {
  test("does not count empty contact placeholders as configured", () => {
    const checks = pageReadiness({ actions: [{ type: "call", value: " " }] });
    expect(checks.find((item) => item.id === "contact").done).toBe(false);
  });
  test("booking-disabled pages do not get irrelevant service and hours tasks", () => {
    const checks = pageReadiness({ booking: { enabled: false } });
    expect(checks.map((item) => item.id)).not.toEqual(expect.arrayContaining(["hours", "services"]));
  });
  test("only active services count", () => {
    const page = { booking: { enabled: true } };
    expect(pageReadiness(page, [{ active: false }]).find((item) => item.id === "services").done).toBe(false);
    expect(pageReadiness(page, [{ active: true }]).find((item) => item.id === "services").done).toBe(true);
  });
  test("a disabled workday and equal start/end times do not count", () => {
    const page = { working_hours: [{ enabled: true, open_time: "09:00", close_time: "09:00" }] };
    expect(pageReadiness(page).find((item) => item.id === "hours").done).toBe(false);
  });
  test("suggestions reuse actual page copy and retain existing SEO properties", () => {
    const result = suggestedSeo({ business_name: "مطب", category: "پزشک", bio: "  معرفی   مطب ", seo: { keywords: "مطب" } });
    expect(result).toEqual({ title: "مطب | پزشک", description: "معرفی مطب", keywords: "مطب" });
  });
});

describe("saving a draft safely", () => {
  test("a publish response retains the new publish state", () => {
    const before = { business_name: "مطب", published: false };
    expect(reconcileSavedPage({ ...before, published: true }, before, before).published).toBe(true);
  });
  test("preserves edits made during a save without discarding saved metadata", () => {
    const before = { bio: "قبل", theme: { primary_color: "#000000" }, published: false };
    const saved = { ...before, published: true, updated_at: "server-time" };
    const current = { ...before, bio: "جدید", theme: { primary_color: "#ffffff" } };
    expect(reconcileSavedPage(saved, before, current)).toEqual({ ...current, published: true, updated_at: "server-time" });
  });
});
