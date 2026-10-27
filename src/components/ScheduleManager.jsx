import React, { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, Clock3, Save, Settings2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import api from "@/lib/api";
import { toFarsiDigits } from "@/lib/jalali";

const DAYS = [
    { id: "saturday", label: "شنبه" },
    { id: "sunday", label: "یکشنبه" },
    { id: "monday", label: "دوشنبه" },
    { id: "tuesday", label: "سه‌شنبه" },
    { id: "wednesday", label: "چهارشنبه" },
    { id: "thursday", label: "پنجشنبه" },
    { id: "friday", label: "جمعه" },
];

const compactDay = (value = "") => String(value)
    .trim()
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\u200e\u200f\s_-]/g, "");

const DAY_ALIASES = {
    saturday: "saturday", sat: "saturday", shanbe: "saturday", شنبه: "saturday",
    sunday: "sunday", sun: "sunday", yekshanbe: "sunday", یکشنبه: "sunday",
    monday: "monday", mon: "monday", doshanbe: "monday", دوشنبه: "monday",
    tuesday: "tuesday", tue: "tuesday", seshanbe: "tuesday", سهشنبه: "tuesday",
    wednesday: "wednesday", wed: "wednesday", chaharshanbe: "wednesday", چهارشنبه: "wednesday",
    thursday: "thursday", thu: "thursday", panjshanbe: "thursday", پنجشنبه: "thursday",
    friday: "friday", fri: "friday", jome: "friday", jomeh: "friday", جمعه: "friday",
};

function normalizeDayId(day) {
    return DAY_ALIASES[compactDay(day)] || day;
}

const suggestedHours = () => DAYS.map((day) => ({
    day: day.id,
    enabled: day.id !== "friday",
    open_time: "09:00",
    close_time: "18:00",
}));

function buildHours(hours) {
    if (!hours?.length) return suggestedHours();
    return DAYS.map((day) => (
        hours.find((entry) => normalizeDayId(entry.day) === day.id)
        || { day: day.id, enabled: false, open_time: "09:00", close_time: "18:00" }
    ));
}

function buildBooking(booking) {
    return {
        enabled: booking?.enabled !== false,
        slot_minutes: booking?.slot_minutes ?? 30,
        buffer_minutes: booking?.buffer_minutes ?? 0,
        lead_time_hours: booking?.lead_time_hours ?? 2,
        advance_days: booking?.advance_days ?? 30,
    };
}

export default function ScheduleManager({ page, onSaved, onCreateAppointment }) {
    const [hours, setHours] = useState(suggestedHours);
    const [booking, setBooking] = useState(buildBooking());
    const [saving, setSaving] = useState(false);
    const hasStoredSchedule = Boolean(page?.working_hours?.length);

    useEffect(() => {
        setHours(buildHours(page?.working_hours));
        setBooking(buildBooking(page?.booking));
    }, [page]);

    const activeDays = useMemo(() => hours.filter((hour) => hour.enabled).length, [hours]);
    const updateHour = (index, key, value) => {
        setHours((current) => current.map((hour, i) => (i === index ? { ...hour, [key]: value } : hour)));
    };
    const useWeekdays = () => setHours((current) => current.map((hour) => ({ ...hour, enabled: hour.day !== "friday" })));
    const useEveryDay = () => setHours((current) => current.map((hour) => ({ ...hour, enabled: true })));

    const save = async () => {
        if (!page) return;
        if (!activeDays) {
            toast.error("حداقل یک روز کاری را فعال کنید.");
            return;
        }
        const invalid = hours.some((hour) => hour.enabled && hour.open_time >= hour.close_time);
        if (invalid) {
            toast.error("ساعت پایان هر روز باید بعد از ساعت شروع باشد.");
            return;
        }
        setSaving(true);
        try {
            const { data } = await api.patch("/pages/me", {
                working_hours: hours,
                booking: { ...(page.booking || {}), ...booking },
            });
            onSaved(data);
            toast.success("برنامه زمانی نوبت‌دهی ذخیره شد.");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "ذخیره برنامه زمانی انجام نشد.");
        } finally {
            setSaving(false);
        }
    };

    if (!page) {
        return (
            <div className="surface-elev p-8 text-center">
                <Settings2 className="w-8 h-8 text-[var(--brand-600)] mx-auto mb-3" />
                <h3 className="font-bold text-[var(--ink-900)]">ابتدا صفحه کسب‌وکار را بسازید</h3>
                <p className="text-sm text-[var(--ink-500)] mt-2">برنامه زمانی به صفحه عمومی شما متصل می‌شود.</p>
            </div>
        );
    }

    return (
        <div className="grid lg:grid-cols-[1fr_20rem] gap-5 items-start">
            <div className="surface-elev p-4 sm:p-6 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-extrabold text-[var(--ink-900)] flex items-center gap-2">
                            <CalendarCheck2 className="w-5 h-5 text-[var(--brand-600)]" />
                            روزها و ساعت‌های قابل رزرو
                        </h2>
                        <p className="text-sm text-[var(--ink-500)] mt-1">مشتری فقط در این بازه‌ها ساعت آزاد می‌بیند.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={useWeekdays} data-testid="schedule-weekdays">
                            <Wand2 className="w-3.5 h-3.5 ms-1" /> شنبه تا پنجشنبه
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={useEveryDay} data-testid="schedule-everyday">
                            همه روزها
                        </Button>
                    </div>
                </div>

                {!hasStoredSchedule && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        هنوز ساعت کاری ذخیره نشده است. برنامه پیشنهادی زیر را بررسی و ذخیره کنید تا ثبت نوبت فعال شود.
                    </div>
                )}

                <div className="space-y-2">
                    {hours.map((hour, index) => (
                        <div
                            key={hour.day}
                            className={`grid grid-cols-[5.5rem_auto] sm:grid-cols-[7rem_4rem_1fr] gap-3 items-center rounded-2xl border p-3 transition-colors ${
                                hour.enabled ? "border-[var(--brand-100)] bg-[var(--brand-50)]/30" : "border-[var(--line)] bg-gray-50/70"
                            }`}
                        >
                            <span className="font-bold text-sm text-[var(--ink-900)]">{DAYS[index].label}</span>
                            <Switch
                                checked={hour.enabled}
                                onCheckedChange={(checked) => updateHour(index, "enabled", checked)}
                                data-testid={`schedule-enabled-${hour.day}`}
                            />
                            <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
                                <Input
                                    type="time"
                                    dir="ltr"
                                    disabled={!hour.enabled}
                                    value={hour.open_time}
                                    onChange={(e) => updateHour(index, "open_time", e.target.value)}
                                    className="h-10 rounded-xl bg-white text-start"
                                    data-testid={`schedule-open-${hour.day}`}
                                />
                                <span className="text-xs text-[var(--ink-500)]">تا</span>
                                <Input
                                    type="time"
                                    dir="ltr"
                                    disabled={!hour.enabled}
                                    value={hour.close_time}
                                    onChange={(e) => updateHour(index, "close_time", e.target.value)}
                                    className="h-10 rounded-xl bg-white text-start"
                                    data-testid={`schedule-close-${hour.day}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <aside className="surface-elev p-5 space-y-5 lg:sticky lg:top-6">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-bold text-[var(--ink-900)]">رزرو آنلاین</div>
                        <div className="text-xs text-[var(--ink-500)] mt-1">{toFarsiDigits(activeDays)} روز فعال</div>
                    </div>
                    <Switch
                        checked={booking.enabled}
                        onCheckedChange={(enabled) => setBooking((current) => ({ ...current, enabled }))}
                        data-testid="schedule-booking-enabled"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs">فاصله شروع</Label>
                        <Input
                            type="number"
                            min="5"
                            step="5"
                            dir="ltr"
                            value={booking.slot_minutes}
                            onChange={(e) => setBooking((current) => ({ ...current, slot_minutes: Number(e.target.value) || 30 }))}
                            className="mt-1.5 h-10 rounded-xl text-start"
                            data-testid="schedule-slot-minutes"
                        />
                        <div className="text-[11px] text-[var(--ink-500)] mt-1">دقیقه</div>
                    </div>
                    <div>
                        <Label className="text-xs">فاصله تنفس</Label>
                        <Input
                            type="number"
                            min="0"
                            step="5"
                            dir="ltr"
                            value={booking.buffer_minutes}
                            onChange={(e) => setBooking((current) => ({ ...current, buffer_minutes: Number(e.target.value) || 0 }))}
                            className="mt-1.5 h-10 rounded-xl text-start"
                            data-testid="schedule-buffer-minutes"
                        />
                        <div className="text-[11px] text-[var(--ink-500)] mt-1">دقیقه</div>
                    </div>
                    <div>
                        <Label className="text-xs">رزرو زودتر از</Label>
                        <Input
                            type="number"
                            min="0"
                            dir="ltr"
                            value={booking.lead_time_hours}
                            onChange={(e) => setBooking((current) => ({ ...current, lead_time_hours: Number(e.target.value) || 0 }))}
                            className="mt-1.5 h-10 rounded-xl text-start"
                            data-testid="schedule-lead-hours"
                        />
                        <div className="text-[11px] text-[var(--ink-500)] mt-1">ساعت</div>
                    </div>
                    <div>
                        <Label className="text-xs">افق رزرو</Label>
                        <Input
                            type="number"
                            min="1"
                            max="365"
                            dir="ltr"
                            value={booking.advance_days}
                            onChange={(e) => setBooking((current) => ({ ...current, advance_days: Number(e.target.value) || 30 }))}
                            className="mt-1.5 h-10 rounded-xl text-start"
                            data-testid="schedule-advance-days"
                        />
                        <div className="text-[11px] text-[var(--ink-500)] mt-1">روز آینده</div>
                    </div>
                </div>

                <div className="rounded-2xl bg-[var(--brand-50)] p-3.5 text-xs text-[var(--ink-700)] flex items-start gap-2">
                    <Clock3 className="w-4 h-4 text-[var(--brand-600)] shrink-0 mt-0.5" />
                    ساعت‌ها بر اساس مدت خدمت و فاصله تنفس، خودکار به مشتری نمایش داده می‌شوند.
                </div>

                <Button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="w-full h-11 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white shadow-[var(--shadow-glow)]"
                    data-testid="schedule-save"
                >
                    <Save className="w-4 h-4 ms-1.5" />
                    {saving ? "در حال ذخیره…" : "ذخیره برنامه زمانی"}
                </Button>
                {hasStoredSchedule && activeDays > 0 && booking.enabled && (
                    <Button type="button" variant="outline" onClick={onCreateAppointment} className="w-full h-11 rounded-xl" data-testid="schedule-new-appointment">
                        ثبت نوبت جدید
                    </Button>
                )}
            </aside>
        </div>
    );
}
