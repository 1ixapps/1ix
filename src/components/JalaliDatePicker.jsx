import React from "react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { dateObjectToIso, jalaliToIso, isoToJalali } from "@/lib/jalali";

// Wrapper around react-multi-date-picker for Jalali (Persian Solar) calendar.
// `value` is an ISO yyyy-mm-dd string; emits ISO yyyy-mm-dd on change.
export default function JalaliDatePicker({ value, onChange, minDate = "today", placeholder = "انتخاب تاریخ", inputClass = "", testId, portal = true }) {
    // Convert ISO to {year, month, day} for DatePicker (Persian)
    let initial;
    if (value) {
        const j = isoToJalali(value);
        if (j) initial = { year: j.jy, month: j.jm, day: j.jd };
    }
    const min = minDate === "today" ? new Date() : minDate;

    return (
        <DatePicker
            calendar={persian}
            locale={persian_fa}
            value={initial}
            onChange={(d) => onChange(dateObjectToIso(d))}
            minDate={min}
            calendarPosition="bottom-right"
            zIndex={10000}
            inputClass={`w-full h-11 border border-[var(--line-strong)] rounded-xl px-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/30 transition-all ${inputClass}`}
            placeholder={placeholder}
            format="YYYY/MM/DD"
            data-testid={testId}
            portal={portal}
        />
    );
}
