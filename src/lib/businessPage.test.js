import { contrastText, normalizeBrandColor, servicePrice, priceListText, businessActionHref, safeBusinessUrl, previewGeometry } from "./businessPage";

test("brand colors are normalized and button text stays readable", () => {
  expect(normalizeBrandColor("#abc")).toBe("#aabbcc");
  expect(normalizeBrandColor("invalid")).toBe("#4f46f7");
  expect(contrastText("#ffffff")).toBe("#17181b");
  expect(contrastText("#000000")).toBe("#ffffff");
  expect(contrastText("#777777")).toBe("#000000");
});
test("numeric service prices are localized while authored price descriptions are preserved", () => {
  expect(servicePrice(350000)).toBe("۳۵۰٬۰۰۰ تومان");
  expect(servicePrice("۳۵۰٬۰۰۰")).toBe("۳۵۰٬۰۰۰ تومان");
  expect(servicePrice(0)).toBe("رایگان");
  expect(servicePrice(null)).toBe("اعلام هزینه با هماهنگی");
  expect(priceListText("از 300 هزار تومان")).toBe("از ۳۰۰ هزار تومان");
});
test("contact links normalize Persian numbers and block executable URLs", () => {
  expect(businessActionHref({ type: "call", value: "۰۹۱۲۱۲۳۴۵۶۷" })).toBe("tel:09121234567");
  expect(businessActionHref({ type: "telegram", value: "@demo" })).toBe("https://t.me/demo");
  expect(safeBusinessUrl("javascript:alert(1)")).toBeNull();
  expect(safeBusinessUrl("example.com")).toBe("https://example.com/");
});
test.each([280,320,375,390,768,1040,1440])("desktop and mobile frames stay within a %s px container", (width) => {
  for (const device of ["mobile", "desktop"]) {
    const geometry = previewGeometry(device, width, 2000);
    expect(geometry.scaledWidth).toBeLessThanOrEqual(width);
    expect(geometry.scale).toBeLessThanOrEqual(1);
    expect(geometry.height).toBe(2000 * geometry.scale);
    if (device === "desktop") expect(geometry.width).toBe(1040);
  }
});
