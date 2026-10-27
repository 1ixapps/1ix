import React, { useEffect, useState } from "react";
import { Calendar, Phone, User } from "lucide-react";
import api from "@/lib/api";
import { formatJalaliDate, toFarsiDigits } from "@/lib/jalali";

const STATUS = { pending: "در انتظار", confirmed: "تأیید شده", canceled: "لغو", completed: "انجام شده" };
const COLOR = {
    pending:   "bg-amber-50 text-amber-700 border-amber-100",
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-100",
    canceled:  "bg-gray-100 text-gray-600 border-gray-200",
    completed: "bg-indigo-50 text-indigo-700 border-indigo-100",
};
const DOT = {
    pending: "bg-amber-500",
    confirmed: "bg-emerald-500",
    canceled: "bg-gray-400",
    completed: "bg-indigo-500",
};

export default function AdminAppointments() {
    const [items, setItems] = useState([]);
    useEffect(() => { api.get("/admin/appointments").then((r) => setItems(r.data)); }, []);

    return (
        <div className="space-y-6">
            <div>
                <span className="chip mb-2"><Calendar className="w-3.5 h-3.5" /> نوبت‌ها</span>
                <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-900)]">نوبت‌های پلتفرم</h1>
                <p className="text-sm text-[var(--ink-500)] mt-1">نمای کلی از همه نوبت‌های ثبت‌شده در سیستم</p>
            </div>

            <div className="surface-elev overflow-hidden p-0">
                <table className="w-full text-sm">
                    <thead className="bg-[var(--brand-50)]/40 text-[var(--ink-700)]">
                        <tr>
                            <th className="text-start p-4 font-bold text-xs uppercase tracking-wider">مشتری</th>
                            <th className="text-start p-4 font-bold text-xs uppercase tracking-wider">خدمت</th>
                            <th className="text-start p-4 font-bold text-xs uppercase tracking-wider">زمان</th>
                            <th className="text-center p-4 font-bold text-xs uppercase tracking-wider">وضعیت</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((a) => (
                            <tr key={a.id} className="border-t border-[var(--line)] hover:bg-[var(--brand-50)]/20">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-[var(--brand-100)] grid place-items-center text-[var(--brand-700)] font-bold text-sm shrink-0">
                                            {a.customer_name?.[0] || "م"}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-[var(--ink-900)] flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5 text-[var(--ink-300)]" /> {a.customer_name}
                                            </div>
                                            <div className="text-xs text-[var(--ink-500)] font-mono flex items-center gap-1 mt-0.5" dir="ltr">
                                                <Phone className="w-3 h-3" /> {a.customer_phone}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-[var(--ink-700)]">{a.service_title || "—"}</td>
                                <td className="p-4">
                                    <div className="font-semibold text-[var(--ink-900)]">{formatJalaliDate(a.date, { monthName: true })}</div>
                                    <div className="text-xs text-[var(--ink-500)] persian-nums" dir="ltr">ساعت {toFarsiDigits(a.time)}</div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`chip text-[11px] ${COLOR[a.status]}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${DOT[a.status]}`} />
                                        {STATUS[a.status]}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr><td colSpan={4} className="p-10 text-center text-sm text-[var(--ink-300)] border-t border-[var(--line)]">نوبتی ثبت نشده است</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
