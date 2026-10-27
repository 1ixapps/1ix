import React, { useEffect, useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { toFarsiDigits } from "@/lib/jalali";

export default function Notifications() {
    const [items, setItems] = useState([]);

    const load = () => api.get("/notifications").then((r) => setItems(r.data));
    useEffect(() => { load(); }, []);

    const markAll = async () => {
        await api.post("/notifications/read-all");
        toast.success("همه به‌عنوان خوانده شده علامت‌گذاری شدند");
        load();
    };

    const markOne = async (n) => {
        await api.post(`/notifications/${n.id}/read`);
        load();
    };

    const del = async (n) => {
        await api.delete(`/notifications/${n.id}`);
        load();
    };

    const unread = items.filter(n => !n.read).length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                    <span className="chip mb-2"><Bell className="w-3.5 h-3.5" /> اطلاعیه‌ها</span>
                    <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-900)]">
                        اطلاعیه‌ها
                        {unread > 0 && (
                            <span className="ms-2 inline-flex items-center justify-center text-[11px] rounded-full bg-rose-500 text-white font-bold w-6 h-6 align-middle">
                                {toFarsiDigits(unread)}
                            </span>
                        )}
                    </h1>
                    <p className="text-sm text-[var(--ink-500)] mt-1">آخرین رویدادها و پیام‌های کسب‌وکار شما</p>
                </div>
                <Button onClick={markAll} variant="outline" className="rounded-xl h-10 border-[var(--line-strong)] bg-white" data-testid="notif-mark-all">
                    <CheckCheck className="w-4 h-4 ms-1.5" /> خوانده‌شد همه
                </Button>
            </div>

            {items.length === 0 ? (
                <div className="surface-elev p-12 text-center">
                    <div className="mx-auto grid place-items-center w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 ring-4 ring-amber-100 mb-4">
                        <Bell className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-1 text-[var(--ink-900)]">اطلاعیه‌ای دریافت نکرده‌اید</h3>
                    <p className="text-sm text-[var(--ink-500)]">آخرین رویدادهای حساب کاربری شما اینجا نمایش داده می‌شود.</p>
                </div>
            ) : (
                <ul className="space-y-2.5">
                    {items.map((n) => (
                        <li
                            key={n.id}
                            className={`surface-elev p-4 flex items-start gap-3 transition-colors ${
                                !n.read ? "ring-1 ring-[var(--brand-200)]" : ""
                            }`}
                            data-testid={`notif-item-${n.id}`}
                        >
                            <span className={`grid place-items-center w-9 h-9 rounded-xl shrink-0 ${
                                n.read
                                    ? "bg-[var(--brand-50)]/40 text-[var(--ink-300)]"
                                    : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[var(--shadow-1)]"
                            }`}>
                                <Bell className="w-4 h-4" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <div className="font-semibold text-[var(--ink-900)]">{n.title}</div>
                                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 pulse-dot" />}
                                </div>
                                <div className="text-sm text-[var(--ink-500)] mt-1 leading-7">{n.body}</div>
                                <div className="text-[11px] text-[var(--ink-300)] mt-2 font-mono">{new Date(n.created_at).toLocaleString("fa-IR")}</div>
                            </div>
                            <div className="flex gap-1">
                                {!n.read && (
                                    <Button size="sm" variant="ghost" onClick={() => markOne(n)} className="rounded-lg text-[var(--brand-700)] hover:bg-[var(--brand-50)]">
                                        خواندم
                                    </Button>
                                )}
                                <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => del(n)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
