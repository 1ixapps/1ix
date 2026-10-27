import React from "react";
import { Clock3, Moon } from "lucide-react";
import { BUSINESS_DAYS } from "@/lib/businessPage";
import { toEnglishDigits, toFarsiDigits } from "@/lib/jalali";

const DAY_IDS = Object.keys(BUSINESS_DAYS);
const validTime = (value) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(toEnglishDigits(value || ""));

export default function BusinessHours({ hours = [] }) {
  if (!hours.length) return null;
  const ordered = [...hours].sort((a, b) => {
    const order = (day) => DAY_IDS.includes(day) ? DAY_IDS.indexOf(day) : DAY_IDS.length;
    return order(a.day) - order(b.day);
  });
  return (
    <section className="bp-side-card bp-hours-card" aria-label="ساعات کاری مجموعه">
      <div className="bp-hours-heading"><span className="bp-hours-icon"><Clock3 size={21} aria-hidden="true" /></span><div><h2>ساعات کاری</h2><p>برنامهٔ هفتگی مجموعه</p></div></div>
      <ul className="bp-hours">
        {ordered.map((hour, index) => <li key={hour.day + "-" + index} className={hour.enabled ? "is-working" : "is-closed"}>
          <span className="bp-hours-day">{BUSINESS_DAYS[hour.day] || hour.day || "روز مشخص‌نشده"}</span>
          {!hour.enabled ? <span className="bp-closed"><Moon size={13} aria-hidden="true" />تعطیل</span> : validTime(hour.open_time) && validTime(hour.close_time) ? (
            <span className="bp-hours-range" aria-label={`از ساعت ${toFarsiDigits(hour.open_time)} تا ساعت ${toFarsiDigits(hour.close_time)}`}><span className="bp-hours-from">از</span><time dateTime={toEnglishDigits(hour.open_time)} dir="ltr">{toFarsiDigits(hour.open_time)}</time><span className="bp-hours-to">تا</span><time dateTime={toEnglishDigits(hour.close_time)} dir="ltr">{toFarsiDigits(hour.close_time)}</time></span>
          ) : <span className="bp-hours-unset">ساعت مشخص نشده</span>}
        </li>)}
      </ul>
    </section>
  );
}
