import fs from "fs";
import path from "path";

const publicDir = path.resolve(__dirname, "../../public");

test("favicon is valid SVG and all referenced icon formats exist", () => {
  const document = new DOMParser().parseFromString(fs.readFileSync(path.join(publicDir, "favicon.svg"), "utf8"), "image/svg+xml");
  expect(document.querySelector("parsererror")).toBeNull();
  expect(document.documentElement.namespaceURI).toBe("http://www.w3.org/2000/svg");
  expect(document.documentElement.getAttribute("viewBox")).toBe("0 0 48 48");
  const html = fs.readFileSync(path.join(publicDir, "index.html"), "utf8");
  for (const file of ["favicon.svg", "favicon.ico", "apple-touch-icon.png"]) {
    expect(html).toContain(file + "?v=2");
    expect(fs.statSync(path.join(publicDir, file)).size).toBeGreaterThan(200);
  }
});

test("fallback favicon includes four resolutions and the Apple icon is 180px", () => {
  const ico = fs.readFileSync(path.join(publicDir, "favicon.ico"));
  expect(ico.readUInt16LE(2)).toBe(1);
  expect(ico.readUInt16LE(4)).toBe(4);
  expect([0, 1, 2, 3].map((i) => ico[6 + i * 16])).toEqual([16, 32, 48, 64]);
  const png = fs.readFileSync(path.join(publicDir, "apple-touch-icon.png"));
  expect(png.readUInt32BE(16)).toBe(180);
  expect(png.readUInt32BE(20)).toBe(180);
});
