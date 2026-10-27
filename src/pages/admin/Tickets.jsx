import React, { useEffect, useState } from "react";
import { Inbox, Mail } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";

const STATUS = { open: "باز", in_progress: "در حال بررسی", resolved: "حل شده", closed: "بسته" };
const STATUS_TONE = {
    open:        "bg-rose-50 text-rose-700 border-rose-100",
    in_progress: "bg-amber-50 text-amber-700 border-amber-100",
    resolved:    "bg-emerald-50 text-emerald-700 border-emerald-100",
    closed:      "bg-gray-100 text-gray-700 border-gray-200",
};

export default function AdminTickets() {
    const [items, setItems] = useState([]);
    const load = () => api.get("/admin/tickets").then((r) => setItems(r.data));
    useEffect(() => { load(); }, []);
    const setStatus = async (t, status) => { await api.patch(`/admin/tickets/${t.id}`, { status }); load(); };

    return (
        <div className="space-y-6">
            <div>
                <span className="chip mb-2"><Inbox className="w-3.5 h-3.5" /> تیکت‌ها</span>
                <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-900)]">تیکت‌های پشتیبانی</h1>
                <p className="text-sm text-[var(--ink-500)] mt-1">پاسخگویی به درخواست‌های کاربران</p>
            </div>

            {items.length === 0 ? (
                <div className="surface-elev p-12 text-center">
                    <div className="mx-auto grid place-items-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 ring-4 ring-emerald-100 mb-4">
                        <Inbox className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-1 text-[var(--ink-900)]">هیچ تیکتی ثبت نشده</h3>
                    <p className="text-sm text-[var(--ink-500)]">پشتیبانی شما خلوت است — احسنت!</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {items.map((t) => (
                        <li key={t.id} className="surface-elev p-5">
                            <div className="flex justify-between items-start mb-3 flex-wrap gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="font-bold text-[var(--ink-900)] flex items-center gap-2">
                                        <span className={`chip text-[10px] ${STATUS_TONE[t.status]}`}>
                                            {STATUS[t.status]}
                                        </span>
                                        {t.subject}
                                    </div>
                                    <div className="text-xs text-[var(--ink-500)] mt-1.5 flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-[var(--ink-700)]">{t.name}</span>
                                        <span>·</span>
                                        <span className="font-mono" dir="ltr">
                                            <Mail className="w-3 h-3 inline ms-1" /> {t.email}
                                        </span>
                                        <span>·</span>
                                        <span>{new Date(t.created_at).toLocaleString("fa-IR")}</span>
                                    </div>
                                </div>
                                <Select value={t.status} onValueChange={(v) => setStatus(t, v)}>
                                    <SelectTrigger className="h-9 w-36 rounded-lg border-[var(--line-strong)]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(STATUS).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="text-sm text-[var(--ink-700)] whitespace-pre-wrap leading-7 bg-[var(--brand-50)]/30 border border-[var(--line)] rounded-xl p-4">{t.message}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
