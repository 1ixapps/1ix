export function campaignDestination(destination, fields = {}) {
  const url = new URL(destination);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("آدرس مقصد باید با https:// یا http:// شروع شود.");
  for (const key of ["source", "medium", "campaign"]) {
    const value = (fields[key] || "").trim();
    if (value) url.searchParams.set("utm_" + key, value);
  }
  return url.toString();
}

export function csvCell(value) {
  let text = String(value ?? "");
  if (/^[\s]*[=+@\-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export function linksCsv(links, origin) {
  const rows = [
    ["عنوان", "لینک کوتاه", "مقصد", "کلیک", "وضعیت"],
    ...links.map((link) => [link.title || "", origin + "/r/" + link.slug, link.destination, link.clicks || 0, link.active ? "فعال" : "متوقف"]),
  ];
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function downloadText(content, filename, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
