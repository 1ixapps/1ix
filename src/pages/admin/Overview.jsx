import React, { useEffect, useState } from "react";
import { Users, FileText, Link as LinkIcon, Calendar, Inbox, TrendingUp, ShieldCheck, Sparkles } from "lucide-react";
import api from "@/lib/api";
import { LineSeriesCard, BarSeriesCard, PieDistCard } from "@/components/Charts";
import { toFarsiDigits } from "@/lib/jalali";

const TONE = {
    indigo:  { grad: "from-indigo-500 to-indigo-600" },
    amber:   { grad: "from-amber-500 to-orange-500" },
    emerald: { grad: "from-emerald-500 to-teal-600" },
    rose:    { grad: "from-rose-500 to-pink-500" },
    violet:  { grad: "from-violet-500 to-purple-600" },
};

const Card = ({ icon: Icon, label, value, tone = "indigo" }) => {
    const t = TONE[tone] || TONE.indigo;
    return (
        <div className="surface-elev p-5 hover-lift">
            <div className="flex justify-between items-start">
                <div className="min-w-0">
                    <div className="text-xs text-[var(--ink-500)] font-semibold">{label}</div>
                    <div className="stat-num text-2xl sm:text-[28px] font-black mt-1 text-[var(--ink-900)]">{toFarsiDigits(value || 0)}</div>
                </div>
                <div className={`grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br ${t.grad} text-white shadow-[var(--shadow-1)] shrink-0`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
};

export default function AdminOverview() {
    const [s, setS] = useState({});
    const [ts, setTs] = useState(null);

    useEffect(() => {
        api.get("/admin/stats").then((r) => setS(r.data)).catch(() => {});
        api.get("/admin/stats/timeseries").then((r) => setTs(r.data)).catch(() => {});
    }, []);

    return (
        <div className="space-y-6">
            <div>
                <span className="chip mb-2"><ShieldCheck className="w-3.5 h-3.5" /> پنل مدیریت</span>
                <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-900)]">نمای کلی پنل مدیریت</h1>
                <p className="text-sm text-[var(--ink-500)] mt-1">آمار کلی پلتفرم 1ix.ir در یک نگاه</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="admin-stats">
                <Card icon={Users}    label="کاربران"    value={s.users}            tone="indigo" />
                <Card icon={FileText} label="صفحات"      value={s.pages}            tone="amber" />
                <Card icon={FileText} label="منتشر شده"  value={s.published_pages}  tone="emerald" />
                <Card icon={LinkIcon} label="لینک‌ها"     value={s.links}            tone="rose" />
                <Card icon={Calendar} label="نوبت‌ها"    value={s.appointments}     tone="violet" />
            </div>

            {ts && (
                <div className="grid lg:grid-cols-2 gap-6">
                    <LineSeriesCard title="ثبت‌نام کاربران در ۱۴ روز اخیر" data={ts.users_series} color="#4f46e5" testId="admin-chart-users" />
                    <BarSeriesCard title="صفحات ساخته شده در ۱۴ روز اخیر" data={ts.pages_series} color="#f59e0b" testId="admin-chart-pages" />
                </div>
            )}

            {ts && (
                <div className="grid lg:grid-cols-2 gap-6">
                    <BarSeriesCard title="نوبت‌ها در ۱۴ روز اخیر" data={ts.appts_series} color="#10b981" testId="admin-chart-appts" />
                    <PieDistCard title="توزیع پلن کاربران" data={ts.plan_dist} testId="admin-chart-plans" />
                </div>
            )}

            <div className="surface-elev p-6">
                <div className="flex items-start gap-3 mb-4">
                    <span className="grid place-items-center w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 ring-4 ring-amber-100">
                        <Inbox className="w-5 h-5" />
                    </span>
                    <div>
                        <h3 className="font-bold text-[var(--ink-900)]">پشتیبانی</h3>
                        <p className="text-xs text-[var(--ink-500)]">تیکت‌های دریافت‌شده از کاربران</p>
                    </div>
                </div>
                <Card icon={Inbox} label="کل تیکت‌ها" value={s.tickets} tone="amber" />
            </div>
        </div>
    );
}
