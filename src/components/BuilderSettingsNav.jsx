import React from "react";
import { UserRound, ContactRound, Clock3, CalendarDays, Images, PanelsTopLeft, Palette, Search, Check, CircleDashed, LoaderCircle } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toFarsiDigits } from "@/lib/jalali";

export const BUILDER_SECTIONS = [
  { id: "basic", title: "اطلاعات", heading: "معرفی کسب‌وکار", hint: "نام، تصاویر و اطلاعات اصلی صفحه‌ات.", icon: UserRound, tone: "violet" },
  { id: "actions", title: "راه‌های ارتباطی", heading: "راه‌های ارتباطی", hint: "مشتری از چه راهی با تو در ارتباط باشد؟", icon: ContactRound, tone: "sky" },
  { id: "hours", title: "ساعت کاری", heading: "روزها و ساعت کاری", hint: "زمان حضور و روزهای تعطیل را مشخص کن.", icon: Clock3, tone: "amber" },
  { id: "booking", title: "نوبت‌دهی", heading: "تنظیمات نوبت‌دهی", hint: "زمان‌بندی رزروها و پیام تأیید مشتری.", icon: CalendarDays, tone: "mint" },
  { id: "gallery", title: "گالری", heading: "گالری و نمونه‌کار", hint: "تصاویری که مشتری در صفحه‌ات می‌بیند.", icon: Images, tone: "rose" },
  { id: "content", title: "محتوای صفحه", heading: "محتوای صفحه", hint: "پرسش‌های متداول، نظرات و فهرست قیمت.", icon: PanelsTopLeft, tone: "sky" },
  { id: "theme", title: "رنگ و ظاهر", heading: "رنگ و ظاهر صفحه", hint: "پالت برند و شکل دکمه‌ها را انتخاب کن.", icon: Palette, tone: "violet" },
  { id: "seo", title: "سئو", heading: "سئو و اشتراک‌گذاری", hint: "عنوان و توضیح صفحه برای جست‌وجو و اشتراک‌گذاری.", icon: Search, tone: "amber" },
];

export function BuilderSaveStatus({ dirty, saving }) {
  const Icon = saving ? LoaderCircle : dirty ? CircleDashed : Check;
  return <span className={`builder-settings-save-state ${dirty ? "is-dirty" : ""}`} role="status" aria-live="polite"><Icon size={14} aria-hidden="true" className={saving ? "editor-saving-icon" : ""} />{saving ? "در حال ذخیره" : dirty ? "ذخیره نشده" : "ذخیره شده"}</span>;
}

export default function BuilderSettingsNav() {
  return (
    <div className="builder-settings-navigation">
      <div className="builder-settings-nav-heading"><span>تنظیمات صفحه</span><span className="builder-settings-section-count">{toFarsiDigits(BUILDER_SECTIONS.length)} بخش قابل ویرایش</span></div>
      <TabsList className="builder-settings-nav" data-testid="page-tabs" aria-label="بخش‌های تنظیمات صفحه">
        {BUILDER_SECTIONS.map(({ id, title, icon: Icon, tone }) => (
          <TabsTrigger key={id} value={id} className="builder-settings-tab">
            <span className={`builder-settings-tab-icon is-${tone}`} aria-hidden="true"><Icon size={19} strokeWidth={1.8} /></span><span>{title}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}
export function BuilderSectionHeading({ section }) {
  const item = BUILDER_SECTIONS.find((entry) => entry.id === section) || BUILDER_SECTIONS[0];
  const Icon = item.icon;
  return <header className="builder-section-heading"><span className={`builder-settings-tab-icon is-${item.tone}`} aria-hidden="true"><Icon size={21} /></span><div><h2>{item.heading}</h2><p>{item.hint}</p></div></header>;
}
