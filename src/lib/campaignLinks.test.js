import { campaignDestination, csvCell, linksCsv } from "./campaignLinks";

describe("campaign destinations", () => {
  test("preserves destination query parameters and the fragment", () => {
    const url = new URL(campaignDestination("https://example.com/book?service=1#times", { source: "instagram", campaign: "spring offer" }));
    expect(url.searchParams.get("service")).toBe("1");
    expect(url.searchParams.get("utm_source")).toBe("instagram");
    expect(url.searchParams.get("utm_campaign")).toBe("spring offer");
    expect(url.hash).toBe("#times");
  });
  test("replaces an existing supplied UTM value without duplication", () => {
    const url = new URL(campaignDestination("https://example.com/?utm_source=old", { source: "new" }));
    expect(url.searchParams.getAll("utm_source")).toEqual(["new"]);
  });
  test("blank optional fields leave existing tracking intact", () => {
    expect(campaignDestination("https://example.com/?utm_source=old", { source: " " })).toBe("https://example.com/?utm_source=old");
  });
  test("rejects executable and malformed destinations", () => {
    expect(() => campaignDestination("javascript:alert(1)")).toThrow();
    expect(() => campaignDestination("not a url")).toThrow();
  });
});

describe("real link CSV export", () => {
  test("quotes embedded delimiters and quotes", () => {
    expect(csvCell('title, "quoted"')).toBe('"title, ""quoted"""');
  });
  test("neutralizes spreadsheet formulas, including leading whitespace", () => {
    expect(csvCell(" =1+1")).toBe('"\' =1+1"');
    expect(csvCell("@SUM(1)")).toBe('"\'@SUM(1)"');
  });
  test("exports actual values, public redirect route and Persian UTF-8 BOM", () => {
    const csv = linksCsv([{ title: "کمپین", slug: "abc", destination: "https://example.com", clicks: 13, active: true }], "https://vanix.test");
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
    expect(csv).toContain("https://vanix.test/r/abc");
    expect(csv).toContain('"13"');
    expect(csv).toContain("فعال");
  });
});
