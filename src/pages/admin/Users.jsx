import React, { useEffect, useState } from "react";
import { Search, Trash2, Shield, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { toast } from "sonner";

const PLAN_TONE = {
    free:     "bg-gray-100 text-gray-700 border-gray-200",
    pro:      "bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-100)]",
    business: "bg-amber-50 text-amber-700 border-amber-100",
};

export default function AdminUsers() {
    const [items, setItems] = useState([]);
    const [q, setQ] = useState("");

    const load = () => api.get(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`).then((r) => setItems(r.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { load(); }, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [q]);

    const updateRole = async (u, role) => { await api.patch(`/admin/users/${u.id}`, { role }); load(); toast.success("به‌روز شد"); };
    const updatePlan = async (u, plan) => { await api.patch(`/admin/users/${u.id}`, { plan }); load(); toast.success("به‌روز شد"); };
    const del = async (u) => { if (!window.confirm(`حذف ${u.email}؟`)) return; await api.delete(`/admin/users/${u.id}`); load(); toast.success("حذف شد"); };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                    <span className="chip mb-2"><UsersIcon className="w-3.5 h-3.5" /> کاربران</span>
                    <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-900)]">مدیریت کاربران</h1>
                    <p className="text-sm text-[var(--ink-500)] mt-1">مشاهده، ویرایش نقش و پلن کاربران</p>
                </div>
                <div className="relative">
                    <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-300)]" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو در کاربران…" className="w-72 pe-10 h-10 rounded-xl border-[var(--line-strong)] bg-white" data-testid="admin-users-search" />
                </div>
            </div>

            <div className="surface-elev overflow-hidden p-0">
                <table className="w-full text-sm">
                    <thead className="bg-[var(--brand-50)]/40 text-[var(--ink-700)]">
                        <tr>
                            <th className="text-start p-4 font-bold text-xs uppercase tracking-wider">کاربر</th>
                            <th className="text-start p-4 font-bold text-xs uppercase tracking-wider hidden sm:table-cell">نقش</th>
                            <th className="text-start p-4 font-bold text-xs uppercase tracking-wider">پلن</th>
                            <th className="text-end p-4 font-bold text-xs uppercase tracking-wider">عملیات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((u) => (
                            <tr key={u.id} className="border-t border-[var(--line)] hover:bg-[var(--brand-50)]/20">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-[var(--brand-100)] grid place-items-center text-[var(--brand-700)] font-bold text-sm shrink-0">
                                            {u.name?.[0] || "ک"}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-[var(--ink-900)] flex items-center gap-1.5">
                                                {u.name}
                                                {u.role === "admin" && <Shield className="w-3.5 h-3.5 text-[var(--brand-600)]" />}
                                            </div>
                                            <div className="text-xs text-[var(--ink-500)] font-mono truncate" dir="ltr">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 hidden sm:table-cell">
                                    <Select value={u.role} onValueChange={(v) => updateRole(u, v)}>
                                        <SelectTrigger className="h-9 w-28 rounded-lg border-[var(--line-strong)]"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">کاربر</SelectItem>
                                            <SelectItem value="admin">مدیر</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </td>
                                <td className="p-4">
                                    <Select value={u.plan || "free"} onValueChange={(v) => updatePlan(u, v)}>
                                        <SelectTrigger className={`h-9 w-32 rounded-lg border ${PLAN_TONE[u.plan || "free"]}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="free">رایگان</SelectItem>
                                            <SelectItem value="pro">حرفه‌ای</SelectItem>
                                            <SelectItem value="business">کسب‌وکار</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </td>
                                <td className="p-4 text-end">
                                    {u.role !== "admin" && (
                                        <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => del(u)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                    {u.role === "admin" && (
                                        <span className="chip text-[10px] bg-[var(--brand-50)] text-[var(--brand-700)] border-[var(--brand-100)]">
                                            <Shield className="w-3 h-3" /> مدیر
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr><td colSpan={4} className="p-10 text-center text-sm text-[var(--ink-300)] border-t border-[var(--line)]">کاربری یافت نشد</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
