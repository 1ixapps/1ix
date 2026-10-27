import React, { useEffect, useState } from "react";
import { Link as LinkIcon, Check, X } from "lucide-react";
import api from "@/lib/api";
import { toFarsiDigits } from "@/lib/jalali";

export default function AdminLinks() {
    const [items, setItems] = useState([]);
    useEffect(() => { api.get("/admin/links").then((r) => setItems(r.data)); }, []);

    return (
        <div className="space-y-6">
            <div>
                <span className="chip mb-2"><LinkIcon className="w-3.5 h-3.5" /> لینک‌ها</span>
                <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-900)]">لینک‌های کوتاه</h1>
                <p className="text-sm text-[var(--ink-500)] mt-1">همه لینک‌های کوتاه ساخته‌شده در پلتفرم</p>
            </div>

            <div className="surface-elev overflow-hidden p-0">
                <table className="w-full text-sm">
                    <thead className="bg-[var(--brand-50)]/40 text-[var(--ink-700)]">
                        <tr>
                            <th className="text-start p-4 font-bold text-xs uppercase tracking-wider">آدرس کوتاه</th>
                            <th className="text-start p-4 font-bold text-xs uppercase tracking-wider hidden sm:table-cell">مقصد</th>
                            <th className="text-center p-4 font-bold text-xs uppercase tracking-wider">کلیک</th>
                            <th className="text-center p-4 font-bold text-xs uppercase tracking-wider">فعال</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((l) => (
                            <tr key={l.id} className="border-t border-[var(--line)] hover:bg-[var(--brand-50)]/20">
                                <td className="p-4">
                                    <div className="font-semibold text-[var(--brand-700)] font-mono" dir="ltr">/r/{l.slug}</div>
                                    <div className="text-xs text-[var(--ink-500)] mt-0.5">{l.title || "—"}</div>
                                </td>
                                <td className="p-4 hidden sm:table-cell">
                                    <div className="truncate max-w-xs text-[var(--ink-500)] font-mono text-xs" dir="ltr" title={l.destination}>{l.destination}</div>
                                </td>
                                <td className="p-4 text-center stat-num font-bold text-[var(--ink-900)]">{toFarsiDigits((l.clicks || 0).toLocaleString("fa-IR"))}</td>
                                <td className="p-4 text-center">
                                    {l.active ? (
                                        <span className="inline-grid place-items-center w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 ring-2 ring-emerald-100">
                                            <Check className="w-3.5 h-3.5" />
                                        </span>
                                    ) : (
                                        <span className="inline-grid place-items-center w-7 h-7 rounded-full bg-gray-100 text-gray-500 ring-2 ring-gray-200">
                                            <X className="w-3.5 h-3.5" />
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr><td colSpan={4} className="p-10 text-center text-sm text-[var(--ink-300)] border-t border-[var(--line)]">لینکی ثبت نشده است</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
