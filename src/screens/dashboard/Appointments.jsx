import React, { useEffect, useMemo, useState } from "react";
import {
    Calendar, Phone, User, Plus, Trash2, Check, X as XIcon, Users,
    ChevronRight, ChevronLeft, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/api";
import JalaliDatePicker from "@/components/JalaliDatePicker";
import SlotPicker from "@/components/SlotPicker";
import ScheduleManager from "@/components/ScheduleManager";
import { formatJalaliDate, toFarsiDigits, isoToJalali } from "@/lib/jalali";

const STATUS_LABEL = {
    pending: "در انتظار",
    confirmed: "تأیید شده",
    canceled: "لغو شده",
    completed: "انجام شده",
};
const STATUS_COLOR = {
    pending:   "bg-amber-50 text-amber-700 border-amber-100",
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-100",
    canceled:  "bg-gray-100 text-gray-600 border-gray-200",
    completed: "bg-indigo-50 text-indigo-700 border-indigo-100",
};
const STATUS_DOT = {
    pending: "bg-amber-500",
    confirmed: "bg-emerald-500",
    canceled: "bg-gray-400",
    completed: "bg-indigo-500",
};

const PERSIAN_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
const PERSIAN_WD_LABELS = ["شن", "یک", "دو", "سه", "چه", "پن", "جم"];
const JS_TO_PERSIAN_COL = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };

function CalendarView({ items }) {
    const today = new Date();
    const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() + 1 });

    const grid = useMemo(() => {
        const first = new Date(cursor.y, cursor.m - 1, 1);
        const daysInMonth = new Date(cursor.y, cursor.m, 0).getDate();
        const startCol = JS_TO_PERSIAN_COL[first.getDay()];
        const cells = [];
        for (let i = 0; i < startCol; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) {
            const iso = `${cursor.y}-${String(cursor.m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            cells.push(iso);
        }
        while (cells.length % 7 !== 0) cells.push(null);
        return cells;
    }, [cursor]);

    const monthLabel = useMemo(() => {
        const j = isoToJalali(`${cursor.y}-${String(cursor.m).padStart(2, "0")}-15`);
        return j ? `${PERSIAN_MONTHS[j.jm - 1]} ${toFarsiDigits(j.jy)}` : `${cursor.m}/${cursor.y}`;
    }, [cursor]);

    const byDate = useMemo(() => {
        const m = new Map();
        for (const a of items) {
            if (!a.date) continue;
            if (!m.has(a.date)) m.set(a.date, []);
            m.get(a.date).push(a);
        }
        return m;
    }, [items]);

    const prev = () => setCursor((c) => (c.m === 1 ? { y: c.y - 1, m: 12 } : { y: c.y, m: c.m - 1 }));
    const next = () => setCursor((c) => (c.m === 12 ? { y: c.y + 1, m: 1 } : { y: c.y, m: c.m + 1 }));

    return (
        <div className="surface-elev p-4 sm:p-6">
            <div className="flex justify-between items-center mb-5">
                <Button variant="ghost" size="sm" onClick={prev} className="rounded-full hover:bg-[var(--brand-50)]" data-testid="calendar-prev">
                    <ChevronRight className="w-4 h-4" />
                </Button>
                <div className="font-extrabold text-[var(--ink-900)]">{monthLabel}</div>
                <Button variant="ghost" size="sm" onClick={next} className="rounded-full hover:bg-[var(--brand-50)]" data-testid="calendar-next">
                    <ChevronLeft className="w-4 h-4" />
                </Button>
            </div>
            <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-[var(--ink-300)] mb-2 uppercase tracking-wider">
                {PERSIAN_WD_LABELS.map((w) => (<div key={w}>{w}</div>))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
                {grid.map((iso, i) => {
                    if (!iso) return <div key={i} className="h-16 sm:h-20" />;
                    const list = byDate.get(iso) || [];
                    const j = isoToJalali(iso);
                    const isToday = iso === new Date().toISOString().slice(0, 10);
                    return (
                        <div
                            key={i}
                            className={`h-16 sm:h-20 p-1.5 rounded-xl border relative overflow-hidden transition-colors ${
                                isToday
                                    ? "border-[var(--brand-600)] bg-[var(--brand-50)]/60 shadow-[var(--shadow-1)]"
                                    : list.length > 0
                                        ? "border-[var(--brand-100)] bg-[var(--brand-50)]/30"
                                        : "border-[var(--line)] hover:bg-[var(--brand-50)]/20"
                            }`}
                            data-testid={`cal-cell-${iso}`}
                        >
                            <div className={`text-xs font-bold ${isToday ? "text-[var(--brand-700)]" : "text-[var(--ink-700)]"}`}>
                                {j ? toFarsiDigits(j.jd) : ""}
                            </div>
                            {list.length > 0 && (
                                <div className="mt-1 flex flex-col gap-0.5">
                                    {list.slice(0, 2).map((a) => (
                                        <span
                                            key={a.id}
                                            className={`text-[10px] px-1 rounded border ${STATUS_COLOR[a.status]} truncate flex items-center gap-1`}
                                            title={`${a.time} — ${a.customer_name}`}
                                        >
                                            <span className={`w-1 h-1 rounded-full ${STATUS_DOT[a.status]}`} />
                                            {toFarsiDigits(a.time)}
                                        </span>
                                    ))}
                                    {list.length > 2 && (
                                        <span className="text-[10px] text-[var(--ink-500)] font-semibold">+{toFarsiDigits(list.length - 2)}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function CustomersView() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api.get("/appointments/customers").then((r) => setCustomers(r.data)).catch(() => setCustomers([])).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-sm text-[var(--ink-500)] py-8 text-center">در حال بارگذاری…</div>;
    if (customers.length === 0) {
        return (
            <div className="surface-elev p-10 text-center">
                <div className="mx-auto grid place-items-center w-12 h-12 rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)] mb-3">
                    <Users className="w-5 h-5" />
                </div>
                <p className="text-sm text-[var(--ink-500)]">هنوز مشتری ثبت نشده است.</p>
            </div>
        );
    }
    return (
        <div className="surface-elev overflow-hidden p-0">
            <table className="w-full text-sm">
                <thead className="bg-[var(--brand-50)]/40 text-[var(--ink-700)]">
                    <tr>
                        <th className="text-start p-4 font-bold text-xs uppercase tracking-wider">مشتری</th>
                        <th className="text-center p-4 font-bold text-xs uppercase tracking-wider">کل نوبت</th>
                        <th className="text-center p-4 font-bold text-xs uppercase tracking-wider hidden sm:table-cell">انجام شده</th>
                        <th className="text-center p-4 font-bold text-xs uppercase tracking-wider hidden sm:table-cell">لغو شده</th>
                        <th className="text-start p-4 font-bold text-xs uppercase tracking-wider">آخرین نوبت</th>
                    </tr>
                </thead>
                <tbody>
                    {customers.map((c) => (
                        <tr key={c.phone} className="border-t border-[var(--line)] hover:bg-[var(--brand-50)]/20" data-testid={`customer-row-${c.phone}`}>
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[var(--brand-100)] grid place-items-center text-[var(--brand-700)] font-bold text-sm">
                                        {c.name?.[0] || "م"}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-[var(--ink-900)]">{c.name}</div>
                                        <div className="text-xs text-[var(--ink-500)] font-mono" dir="ltr">{c.phone}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-center stat-num font-bold text-[var(--ink-900)]">{toFarsiDigits(c.total)}</td>
                            <td className="p-4 text-center hidden sm:table-cell stat-num font-bold text-emerald-600">{toFarsiDigits(c.completed)}</td>
                            <td className="p-4 text-center hidden sm:table-cell stat-num text-[var(--ink-500)]">{toFarsiDigits(c.canceled)}</td>
                            <td className="p-4 text-[var(--ink-700)]">{c.last_date ? formatJalaliDate(c.last_date, { monthName: true }) : "—"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function Appointments() {
    const [items, setItems] = useState([]);
    const [filter, setFilter] = useState("all");
    const [view, setView] = useState("list");
    const [services, setServices] = useState([]);
    const [page, setPage] = useState(null);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ service_id: "", customer_name: "", customer_phone: "", customer_email: "", date: "", time: "", notes: "" });

    const load = () => api.get("/appointments").then((r) => setItems(r.data));
    useEffect(() => {
        load();
        api.get("/services").then((r) => setServices(r.data)).catch(() => {});
        api.get("/pages/me").then((r) => setPage(r.data)).catch(() => {});
    }, []);

    const filtered = filter === "all" ? items : items.filter((a) => a.status === filter);
    const activeSchedule = (page?.working_hours || []).some((hour) => hour.enabled);
    const pendingCount = items.filter((item) => item.status === "pending").length;
    const confirmedCount = items.filter((item) => item.status === "confirmed").length;

    const submit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form };
            if (!payload.service_id) delete payload.service_id;
            await api.post("/appointments", payload);
            toast.success("نوبت ثبت شد");
            setOpen(false);
            setForm({ service_id: "", customer_name: "", customer_phone: "", customer_email: "", date: "", time: "", notes: "" });
            load();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "خطا");
        }
    };

    const update = async (a, fields) => {
        await api.patch(`/appointments/${a.id}`, fields);
        load();
    };

    const del = async (a) => {
        if (!window.confirm("حذف این نوبت؟")) return;
        await api.delete(`/appointments/${a.id}`);
        toast.success("حذف شد");
        load();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <span className="chip mb-2"><Calendar className="w-3.5 h-3.5" /> نوبت‌ها</span>
                    <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-900)]">مدیریت نوبت‌ها</h1>
                    <p className="text-sm text-[var(--ink-500)] mt-1">پیگیری و مدیریت نوبت‌های کسب‌وکار شما</p>
                </div>
                <Button onClick={() => setOpen(true)} className="rounded-xl h-10 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white shadow-[var(--shadow-glow)]" data-testid="appt-create-btn">
                    <Plus className="w-4 h-4 ms-1.5" /> ثبت نوبت
                </Button>
            </div>

            {page && !activeSchedule && (
                <div className="surface-elev p-4 sm:p-5 border-amber-200 bg-amber-50/60 flex flex-wrap gap-4 items-center justify-between">
                    <div>
                        <div className="font-bold text-amber-900">برای پذیرش نوبت، برنامه زمانی را فعال کنید</div>
                        <p className="text-sm text-amber-800 mt-1">روزهای کاری و ساعت ارائه خدمت هنوز تعریف نشده‌اند.</p>
                    </div>
                    <Button type="button" onClick={() => setView("schedule")} className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white" data-testid="open-schedule-setup">
                        تنظیم روز و ساعت
                    </Button>
                </div>
            )}

            <div className="grid sm:grid-cols-3 gap-3">
                <div className="surface-elev p-4">
                    <div className="text-xs font-semibold text-[var(--ink-500)]">همه نوبت‌ها</div>
                    <div className="stat-num text-2xl font-black text-[var(--ink-900)] mt-2">{toFarsiDigits(items.length)}</div>
                </div>
                <div className="surface-elev p-4 border-amber-100">
                    <div className="text-xs font-semibold text-amber-700">نیازمند بررسی</div>
                    <div className="stat-num text-2xl font-black text-amber-600 mt-2">{toFarsiDigits(pendingCount)}</div>
                </div>
                <div className="surface-elev p-4 border-emerald-100">
                    <div className="text-xs font-semibold text-emerald-700">تأیید شده</div>
                    <div className="stat-num text-2xl font-black text-emerald-600 mt-2">{toFarsiDigits(confirmedCount)}</div>
                </div>
            </div>

            <Tabs value={view} onValueChange={setView} dir="rtl">
                <TabsList className="grid grid-cols-4 w-full max-w-xl bg-[var(--brand-50)]/40 border border-[var(--line)] rounded-xl p-1 h-auto">
                    <TabsTrigger value="list" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-[var(--shadow-1)] data-[state=active]:text-[var(--brand-700)] font-semibold" data-testid="view-list">لیست</TabsTrigger>
                    <TabsTrigger value="calendar" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-[var(--shadow-1)] data-[state=active]:text-[var(--brand-700)] font-semibold" data-testid="view-calendar">تقویم</TabsTrigger>
                    <TabsTrigger value="customers" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-[var(--shadow-1)] data-[state=active]:text-[var(--brand-700)] font-semibold" data-testid="view-customers">مشتریان</TabsTrigger>
                    <TabsTrigger value="schedule" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-[var(--shadow-1)] data-[state=active]:text-[var(--brand-700)] font-semibold" data-testid="view-schedule">زمان‌بندی</TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="space-y-4">
                    <Tabs value={filter} onValueChange={setFilter} dir="rtl">
                        <TabsList className="grid grid-cols-5 max-w-2xl bg-white border border-[var(--line)] rounded-xl p-1 h-auto">
                            <TabsTrigger value="all"       className="rounded-lg text-xs font-semibold data-[state=active]:bg-[var(--ink-900)] data-[state=active]:text-white">همه</TabsTrigger>
                            <TabsTrigger value="pending"   className="rounded-lg text-xs font-semibold data-[state=active]:bg-amber-500 data-[state=active]:text-white">در انتظار</TabsTrigger>
                            <TabsTrigger value="confirmed" className="rounded-lg text-xs font-semibold data-[state=active]:bg-emerald-500 data-[state=active]:text-white">تأیید شده</TabsTrigger>
                            <TabsTrigger value="completed" className="rounded-lg text-xs font-semibold data-[state=active]:bg-[var(--brand-600)] data-[state=active]:text-white">انجام شده</TabsTrigger>
                            <TabsTrigger value="canceled"  className="rounded-lg text-xs font-semibold data-[state=active]:bg-gray-500 data-[state=active]:text-white">لغو شده</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {filtered.length === 0 ? (
                        <div className="surface-elev p-12 text-center">
                            <div className="mx-auto grid place-items-center w-12 h-12 rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)] mb-3">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold mb-1 text-[var(--ink-900)]">نوبتی در این لیست نیست</h3>
                            <p className="text-sm text-[var(--ink-500)]">با ثبت نوبت جدید، فهرست شما پر می‌شود.</p>
                        </div>
                    ) : (
                        <div className="surface-elev overflow-hidden p-0">
                            <table className="w-full text-sm">
                                <thead className="bg-[var(--brand-50)]/40 text-[var(--ink-700)]">
                                    <tr>
                                        <th className="text-start p-4 font-bold text-xs uppercase tracking-wider">مشتری</th>
                                        <th className="text-start p-4 font-bold text-xs uppercase tracking-wider hidden sm:table-cell">خدمت</th>
                                        <th className="text-start p-4 font-bold text-xs uppercase tracking-wider">زمان</th>
                                        <th className="text-center p-4 font-bold text-xs uppercase tracking-wider">وضعیت</th>
                                        <th className="text-end p-4 font-bold text-xs uppercase tracking-wider">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((a) => (
                                        <tr key={a.id} className="border-t border-[var(--line)] hover:bg-[var(--brand-50)]/20" data-testid={`appt-row-${a.id}`}>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-[var(--brand-100)] grid place-items-center text-[var(--brand-700)] font-bold text-sm shrink-0">
                                                        {a.customer_name?.[0] || "م"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold text-[var(--ink-900)] flex items-center gap-1.5">
                                                            <User className="w-3.5 h-3.5 text-[var(--ink-300)]" /> {a.customer_name}
                                                        </div>
                                                        <div className="text-xs text-[var(--ink-500)] font-mono flex items-center gap-1.5 mt-0.5" dir="ltr">
                                                            <Phone className="w-3 h-3" /> {a.customer_phone}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 hidden sm:table-cell text-[var(--ink-700)]">{a.service_title || "—"}</td>
                                            <td className="p-4">
                                                <div className="font-semibold text-[var(--ink-900)]">{formatJalaliDate(a.date, { monthName: true })}</div>
                                                <div className="text-xs text-[var(--ink-500)] persian-nums" dir="ltr">ساعت {toFarsiDigits(a.time)}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`chip text-[11px] ${STATUS_COLOR[a.status]}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[a.status]}`} />
                                                    {STATUS_LABEL[a.status]}
                                                </span>
                                            </td>
                                            <td className="p-4 text-end whitespace-nowrap">
                                                {a.status === "pending" && (
                                                    <Button size="sm" variant="ghost" onClick={() => update(a, { status: "confirmed" })} className="hover:bg-emerald-50" title="تأیید">
                                                        <Check className="w-4 h-4 text-emerald-600" />
                                                    </Button>
                                                )}
                                                {a.status === "confirmed" && (
                                                    <Button size="sm" variant="ghost" onClick={() => update(a, { status: "completed" })} className="hover:bg-[var(--brand-50)]" title="انجام شد">
                                                        <Check className="w-4 h-4 text-[var(--brand-600)]" />
                                                    </Button>
                                                )}
                                                {a.status !== "canceled" && a.status !== "completed" && (
                                                    <Button size="sm" variant="ghost" onClick={() => update(a, { status: "canceled" })} className="hover:bg-amber-50" title="لغو">
                                                        <XIcon className="w-4 h-4 text-amber-600" />
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => del(a)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="calendar">
                    <CalendarView items={items} />
                </TabsContent>

                <TabsContent value="customers">
                    <CustomersView />
                </TabsContent>

                <TabsContent value="schedule">
                    <ScheduleManager page={page} onSaved={setPage} onCreateAppointment={() => setOpen(true)} />
                </TabsContent>
            </Tabs>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent dir="rtl" className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border-0 surface-elev">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-extrabold tracking-tight">ثبت نوبت جدید</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-3">
                        <div>
                            <Label className="text-[13px] font-semibold">خدمت</Label>
                            <Select value={form.service_id} onValueChange={(v) => setForm({ ...form, service_id: v, time: "" })}>
                                <SelectTrigger className="mt-1.5 h-11 rounded-xl border-[var(--line-strong)]"><SelectValue placeholder="بدون خدمت" /></SelectTrigger>
                                <SelectContent>
                                    {services.map((s) => (<SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-[13px] font-semibold">نام مشتری</Label>
                            <Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required className="mt-1.5 h-11 rounded-xl border-[var(--line-strong)]" data-testid="appt-name-input" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-[13px] font-semibold">تلفن</Label>
                                <Input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} dir="ltr" required className="mt-1.5 h-11 rounded-xl border-[var(--line-strong)] text-start" data-testid="appt-phone-input" />
                            </div>
                            <div>
                                <Label className="text-[13px] font-semibold">ایمیل (اختیاری)</Label>
                                <Input value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} dir="ltr" className="mt-1.5 h-11 rounded-xl border-[var(--line-strong)] text-start" />
                            </div>
                        </div>
                        <div>
                            <Label className="text-[13px] font-semibold">تاریخ</Label>
                            <div className="mt-1.5">
                                <JalaliDatePicker
                                    value={form.date}
                                    onChange={(iso) => setForm({ ...form, date: iso, time: "" })}
                                    testId="appt-date-input"
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-[13px] font-semibold">ساعت</Label>
                            <div className="mt-1.5">
                                {page?.username ? (
                                    <SlotPicker
                                        username={page.username}
                                        date={form.date}
                                        serviceId={form.service_id}
                                        value={form.time}
                                        onChange={(t) => setForm({ ...form, time: t })}
                                        testId="appt-slot-picker"
                                        onManageSchedule={() => {
                                            setOpen(false);
                                            setView("schedule");
                                        }}
                                    />
                                ) : (
                                    <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} dir="ltr" required className="h-11 rounded-xl border-[var(--line-strong)] text-start" />
                                )}
                            </div>
                        </div>
                        <div>
                            <Label className="text-[13px] font-semibold">یادداشت (اختیاری)</Label>
                            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1.5 rounded-xl border-[var(--line-strong)]" />
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={!form.time} className="rounded-xl h-11 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white shadow-[var(--shadow-glow)]" data-testid="appt-submit-btn">
                                <Sparkles className="w-4 h-4 ms-1.5" /> ثبت نوبت
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
