import React, { useEffect, useState } from "react";
import { ExternalLink, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { toFarsiDigits } from "@/lib/jalali";

export default function AdminPages() {
    const [items, setItems] = useState([]);
    const load = () => api.get("/admin/pages").then((r) => setItems(r.data));
    useEffect(() => { load(); }, []);

    const toggle = async (p) => { await api.patch(`/admin/pages/${p.id}`, { published: !p.published }); load(); };

    return (
        <div className="space-y-6">
            <div>
                <span className="chip mb-2"><FileText className="w-3.5 h-3.5" /> صفحات</span>
                <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-900)]">صفحات کاربران</h1>
                <p className="text-sm text-[var(--ink-500)] mt-1">همه صفحات کسب‌وکار ساخته‌شده در پلتفرم</p>
            </div>

            <div className="surface-elev overflow-hidden p-0">
                <table className="w-full text-sm">
                    <thead className="bg-[var(--brand-50)]/40 text-[var(--ink-700)]">
                        <tr>
                            <th className="text-start p-4 font-bold text-xs uppercase tracking-wider">صفحه</th>
                            <th className="text-start p-4 font-bold text-xs uppercase tracking-wider hidden sm:table-cell">دسته‌بندی</th>
                            <th className="text-center p-4 font-bold text-xs uppercase tracking-wider">بازدید</th>
                            <th className="text-center p-4 font-bold text-xs uppercase tracking-wider">منتشر شده</th>
                            <th className="text-end p-4 font-bold text-xs uppercase tracking-wider">عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((p) => (
                            <tr key={p.id} className="border-t border-[var(--line)] hover:bg-[var(--brand-50)]/20">
                                <td className="p-4">
                                    <div className="font-semibold text-[var(--ink-900)]">{p.business_name}</div>
                                    <div className="text-xs text-[var(--brand-700)] font-mono mt-0.5" dir="ltr">1ix.ir/u/{p.username}</div>
                                </td>
                                <td className="p-4 hidden sm:table-cell text-[var(--ink-700)]">{p.category || "—"}</td>
                                <td className="p-4 text-center">
                                    <span className="inline-flex items-center gap-1.5 stat-num font-bold text-[var(--ink-900)]">
                                        <Eye className="w-3.5 h-3.5 text-[var(--ink-300)]" />
                                        {toFarsiDigits((p.views || 0).toLocaleString("fa-IR"))}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <Switch checked={p.published} onCheckedChange={() => toggle(p)} />
                                </td>
                                <td className="p-4 text-end">
                                    <Link to={`/u/${p.username}`} target="_blank">
                                        <Button size="sm" variant="ghost" className="hover:bg-[var(--brand-50)]">
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr><td colSpan={5} className="p-10 text-center text-sm text-[var(--ink-300)] border-t border-[var(--line)]">صفحه‌ای ثبت نشده است</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
