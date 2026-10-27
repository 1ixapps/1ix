import React, { useState } from "react";
import { Smartphone, Monitor, Maximize2, Eye } from "lucide-react";
import PagePreview from "@/components/PagePreview";

export default function StudioPreview({ page, services = [], dirty = false, compact = false, onExpand }) {
  const [device, setDevice] = useState("mobile");
  return (
    <section className={`studio-preview pro-preview-panel ${compact ? "is-compact" : ""}`} aria-label="پیش‌نمایش زنده‌ی صفحه">
      <div className="studio-preview-toolbar">
        <div className="studio-preview-title"><Eye size={17} /><span>از نگاه مشتری</span><i aria-hidden="true" /></div>
        <div className="studio-preview-controls" role="group" aria-label="اندازه‌ی پیش‌نمایش">
          <button type="button" aria-label="پیش‌نمایش موبایل" title="نمای موبایل" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}><Smartphone size={17} /><span>موبایل</span></button>
          <button type="button" aria-label="پیش‌نمایش دسکتاپ" title="نمای دسکتاپ" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}><Monitor size={17} /><span>دسکتاپ</span></button>
          {onExpand && <button type="button" className="studio-preview-expand" aria-label="بازکردن پیش‌نمایش بزرگ" title="نمای بزرگ‌تر" onClick={onExpand}><Maximize2 size={16} /></button>}
        </div>
      </div>
      <div className="studio-preview-canvas">
        <PagePreview page={page} services={services} device={device} compact={compact} />
      </div>
      <p className={`studio-preview-caption ${dirty ? "has-draft" : ""}`}>{dirty ? "پیش‌نمایش ویرایش فعلی؛ تغییرات هنوز ذخیره نشده‌اند." : "همان طراحی صفحه‌ی عمومی؛ رزرو از لینک منتشرشده انجام می‌شود."}</p>
      {compact && device === "desktop" && onExpand && <button className="studio-preview-expand-hint" type="button" onClick={onExpand}><Maximize2 size={14} /> برای بررسی جزئیات، نمای بزرگ‌تر را باز کن.</button>}
    </section>
  );
}
