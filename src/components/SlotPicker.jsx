import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, Loader2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toFarsiDigits } from "@/lib/jalali";

const REASON_TEXT = {
    closed: "در این روز مجموعه تعطیل است.",
    holiday: "این تاریخ در فهرست تعطیلات قرار دارد.",
    past: "این تاریخ گذشته است.",
    too_far: "این تاریخ بیش از حد مجاز در آینده است.",
    disabled: "نوبت‌دهی این صفحه غیرفعال است.",
    not_configured: "هنوز روز و ساعت قابل رزرو تعریف نشده است.",
    invalid_schedule: "ساعات کاری نیاز به اصلاح دارد.",
    full: "تمام ظرفیت‌های این روز رزرو شده‌اند.",
    lead_time: "برای تاریخ انتخاب‌شده زمان قابل رزروی باقی نمانده است. یک تاریخ بعدی را انتخاب کنید.",
    error: "دریافت ساعت‌های آزاد انجام نشد. دوباره تلاش کنید.",
};

/**
 * Smart slot picker. Calls /api/appointments/available-slots/{username}.
 * - value: selected slot string "HH:MM"
 * - onChange(slot)
 * - username, date, serviceId
 */
export default function SlotPicker({ username, date, serviceId, value, onChange, testId, onManageSchedule }) {
    const [loading, setLoading] = useState(false);
    const [slots, setSlots] = useState([]);
    const [reason, setReason] = useState(null);
    const [duration, setDuration] = useState(null);

    useEffect(() => {
        if (!date || !username) {
            setSlots([]);
            setReason(null);
            return;
        }
        setLoading(true);
        const q = serviceId ? `?date=${date}&service_id=${serviceId}` : `?date=${date}`;
        api.get(`/appointments/available-slots/${username}${q}`)
            .then((r) => {
                setSlots(r.data.slots || []);
                setReason(r.data.reason || null);
                setDuration(r.data.duration_minutes || null);
            })
            .catch(() => {
                setSlots([]);
                setReason("error");
            })
            .finally(() => setLoading(false));
    }, [username, date, serviceId]);

    if (!date) {
        return (
            <div className="flex items-center gap-2 text-xs text-[var(--ink-500)] py-3 px-3 rounded-xl border border-dashed border-[var(--line-strong)] bg-white">
                <Clock3 className="w-4 h-4 text-[var(--brand-600)]" />
                ابتدا تاریخ را انتخاب کنید
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-[var(--ink-500)] py-3 px-3 rounded-xl border border-[var(--line)] bg-white shadow-[var(--shadow-1)]">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--brand-600)]" /> در حال بررسی ساعت‌های آزاد...
            </div>
        );
    }

    if (slots.length === 0) {
        return (
            <div className="text-sm text-amber-900 bg-amber-50/80 border border-amber-200 rounded-xl p-4">
                <div className="flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <span>{!onManageSchedule && ["not_configured", "invalid_schedule", "disabled"].includes(reason) ? "رزرو آنلاین فعلاً در دسترس نیست؛ از راه‌های ارتباطی صفحه هماهنگ کنید." : REASON_TEXT[reason] || "ساعت آزادی برای این تاریخ وجود ندارد."}</span>
                </div>
                {onManageSchedule && (reason === "closed" || reason === "not_configured" || reason === "invalid_schedule") && (
                    <Button type="button" variant="outline" size="sm" onClick={onManageSchedule} className="mt-3 bg-white border-amber-200 hover:bg-amber-100 text-amber-900" data-testid="slot-manage-schedule">
                        <Settings2 className="w-3.5 h-3.5 ms-1" /> تعریف روز و ساعت
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div>
            {duration && (
                <div className="text-xs text-[var(--ink-500)] mb-3 font-semibold flex items-center gap-1.5">
                    <Clock3 className="w-3.5 h-3.5 text-[var(--brand-600)]" />
                    مدت هر نوبت: <span className="stat-num">{toFarsiDigits(duration)}</span> دقیقه
                </div>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" data-testid={testId}>
                {slots.map((s) => {
                    const selected = s === value;
                    return (
                        <button
                            type="button"
                            key={s}
                            onClick={() => onChange(s)}
                            data-testid={`slot-${s}`}
                            className={`relative px-3.5 py-2.5 rounded-xl text-sm font-bold border transition-all persian-nums ${
                                selected
                                    ? "bg-[var(--brand-600)] border-[var(--brand-600)] text-white shadow-[var(--shadow-glow)] ring-2 ring-[var(--brand-200)]"
                                    : "bg-white border-[var(--line-strong)] text-[var(--ink-700)] hover:border-[var(--brand-300)] hover:bg-[var(--brand-50)]/40"
                            }`}
                            dir="ltr"
                        >
                            {selected && <CheckCircle2 className="absolute -top-1.5 -end-1.5 w-4 h-4 rounded-full bg-white text-[var(--brand-600)]" />}
                            {toFarsiDigits(s)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
