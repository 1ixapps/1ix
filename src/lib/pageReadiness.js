const text = (value) => typeof value === "string" && value.trim().length > 0;

export function pageReadiness(page, services = []) {
  if (!page) return [];
  const booking = page.booking?.enabled !== false;
  const checks = [
    { id: "identity", title: "اسم و معرفی", detail: "نام کسب‌وکار و یک معرفی کوتاه اضافه کن.", tab: "basic", done: text(page.business_name) && text(page.bio) },
    { id: "brand", title: "چهره‌ی برند", detail: "لوگو یا تصویر کاور، صفحه‌ات را شخصی‌تر می‌کند.", tab: "basic", done: text(page.profile_image) || text(page.cover_image) },
    { id: "contact", title: "راه ارتباطی", detail: "حداقل یک دکمه‌ی تماس با مقدار واقعی تنظیم کن.", tab: "actions", done: (page.actions || []).some((action) => text(action.value)) },
    { id: "seo", title: "عنوان و توضیح اشتراک", detail: "عنوان و توضیح صفحه را برای جست‌وجو و اشتراک‌گذاری بنویس.", tab: "seo", done: text(page.seo?.title) && text(page.seo?.description) },
  ];
  if (booking) {
    checks.push(
      { id: "services", title: "خدمت قابل رزرو", detail: "یک خدمت فعال اضافه کن تا مشتری بداند چه چیزی رزرو می‌کند.", href: "/dashboard/services", done: services.some((service) => service.active !== false) },
      { id: "hours", title: "روزهای کاری", detail: "حداقل یک روز کاری با ساعت شروع و پایان مشخص تنظیم کن.", tab: "hours", done: (page.working_hours || []).some((day) => day.enabled && /^\d{2}:\d{2}$/.test(day.open_time || "") && /^\d{2}:\d{2}$/.test(day.close_time || "") && day.open_time !== day.close_time) }
    );
  }
  return checks;
}

export function suggestedSeo(page) {
  const name = (page.business_name || "").trim();
  const category = (page.category || "").trim();
  return {
    ...(page.seo || {}),
    title: [name, category].filter(Boolean).join(" | ").slice(0, 70),
    description: (page.bio || page.about || "").replace(/\s+/g, " ").trim().slice(0, 160),
  };
}

export const BRAND_PALETTES = [
  { id: "vanix", name: "وانیکس", primary_color: "#4f46f7", accent_color: "#ff6b5e" },
  { id: "forest", name: "جنگل", primary_color: "#166344", accent_color: "#d8ef87" },
  { id: "rose", name: "رز", primary_color: "#993b5b", accent_color: "#f4d0da" },
  { id: "ocean", name: "اقیانوس", primary_color: "#18568c", accent_color: "#aee5e2" },
  { id: "ink", name: "جوهر", primary_color: "#24242b", accent_color: "#e8c994" },
  { id: "terracotta", name: "سفال", primary_color: "#9d4033", accent_color: "#f2c88c" },
];

/** Keep edits made while a save request was in flight. */
export function reconcileSavedPage(saved, submittedDraft, currentDraft) {
  const result = { ...saved };
  for (const key of Object.keys(currentDraft || {})) {
    if (JSON.stringify(currentDraft[key]) !== JSON.stringify(submittedDraft[key])) result[key] = currentDraft[key];
  }
  return result;
}
