import React, { useId } from "react";
import { CalendarDays, Clock3, Plus, Moon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { BUSINESS_DAYS } from "@/lib/businessPage";
import { toFarsiDigits } from "@/lib/jalali";
import "@/styles/working-hours.css";

const DAY_IDS = Object.keys(BUSINESS_DAYS);
const isTime = (value) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value || "");

export default function WorkingHoursEditor({ hours = [], onChange }) {
  const prefix = useId();
  const days = hours.map((hour, index) => ({ hour, index })).sort((a, b) => {
    const order = (day) => DAY_IDS.includes(day) ? DAY_IDS.indexOf(day) : DAY_IDS.length;
    return order(a.hour.day) - order(b.hour.day);
  });
  const update = (index, field, value) => onChange(hours.map((hour, i) => i === index ? { ...hour, [field]: value } : hour));
  const init = () => onChange(DAY_IDS.map((day) => ({ day, enabled: day !== "friday", open_time: "09:00", close_time: "18:00" })));
  const active = hours.filter((hour) => hour.enabled).length;
  return (
    <section className="working-hours-editor" aria-label="تنظیم برنامهٔ هفتگی">
      <div className="wh-editor-heading"><span className="wh-heading-icon"><CalendarDays size={20} aria-hidden="true" /></span><div><h3>برنامهٔ هفتگی</h3><p>{hours.length ? `${toFarsiDigits(active)} روز کاری از ${toFarsiDigits(hours.length)} روز تنظیم‌شده` : "روزها و زمان حضورت را مشخص کن."}</p></div></div>
      {hours.length === 0 ? (
        <div className="wh-empty"><Clock3 size={28} aria-hidden="true" /><p>هنوز ساعت کاری تنظیم نکرده‌ای.</p><Button type="button" onClick={init}><Plus size={17} /> تنظیم برنامهٔ هفتگی</Button></div>
      ) : (
        <div className="wh-days">
          {days.map(({ hour, index }) => {
            const label = BUSINESS_DAYS[hour.day] || hour.day || "روز مشخص‌نشده";
            const id = prefix + "-" + index;
            const error = !hour.enabled ? "" : !isTime(hour.open_time) || !isTime(hour.close_time) ? "زمان شروع و پایان را مشخص کن." : hour.close_time <= hour.open_time ? "ساعت پایان باید بعد از ساعت شروع باشد." : "";
            return (
              <div className={`wh-day ${hour.enabled ? "is-enabled" : "is-closed"}`} key={hour.day + "-" + index} data-testid={`working-day-${hour.day}`}>
                <div className="wh-day-heading">
                  <div className="wh-day-name"><span className="wh-day-marker" aria-hidden="true">{hour.enabled ? <Clock3 size={17} /> : <Moon size={17} />}</span><strong>{label}</strong></div>
                  <label className="wh-day-toggle" htmlFor={id + "-enabled"}><span>{hour.enabled ? "روز کاری" : "تعطیل"}</span><Switch id={id + "-enabled"} checked={Boolean(hour.enabled)} onCheckedChange={(value) => update(index, "enabled", value)} aria-label={`روز کاری ${label}`} /></label>
                </div>
                {hour.enabled ? (
                  <div className="wh-time-fields">
                    <div className="wh-time-field"><label htmlFor={id + "-open"}>از ساعت</label><Input id={id + "-open"} type="time" lang="fa" step="60" value={hour.open_time || ""} onChange={(event) => update(index, "open_time", event.target.value)} dir="ltr" aria-label={`شروع کار ${label}`} aria-invalid={Boolean(error)} aria-describedby={error ? id + "-error" : undefined} /></div>
                    <span className="wh-range-divider" aria-hidden="true">تا</span>
                    <div className="wh-time-field"><label htmlFor={id + "-close"}>تا ساعت</label><Input id={id + "-close"} type="time" lang="fa" step="60" value={hour.close_time || ""} onChange={(event) => update(index, "close_time", event.target.value)} dir="ltr" aria-label={`پایان کار ${label}`} aria-invalid={Boolean(error)} aria-describedby={error ? id + "-error" : undefined} /></div>
                  </div>
                ) : null}
                {error && <p className="wh-time-error" id={id + "-error"} role="alert"><AlertCircle size={14} aria-hidden="true" />{error}</p>}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
