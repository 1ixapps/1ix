import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    UserSquare2, Link as LinkIcon, CalendarClock, Bell, ArrowLeft, Eye, MousePointerClick,
    Sparkles, Plus, ChevronLeft, Check, Wrench, TrendingUp, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api, { fullUploadUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { LineSeriesCard, BarSeriesCard, PieDistCard } from "@/components/Charts";
import { formatJalaliDate, toFarsiDigits } from "@/lib/jalali";
import ShareDialog from "@/components/ShareDialog";

const TONE = {
    indigo:  { bg: "bg-indigo-50",  text: "text-indigo-600",  ring: "ring-indigo-100",  grad: "from-indigo-500 to-indigo-600" },
    amber:   { bg: "bg-amber-50",   text: "text-amber-600",   ring: "ring-amber-100",   grad: "from-amber-500 to-orange-500" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100", grad: "from-emerald-500 to-teal-600" },
    rose:    { bg: "bg-rose-50",    text: "text-rose-600",    ring: "ring-rose-100",    grad: "from-rose-500 to-pink-500" },
};

const StatCard = ({ icon: Icon, label, value, tone = "indigo", trend, testId }) => {
    const t = TONE[tone] || TONE.indigo;
    return (
        <div className="surface-elev p-5 hover-lift" data-testid={testId}>
            <div className="flex items-start justify-between">
                <div className="min-w-0">
                    <div className="text-xs text-[var(--ink-500)] font-semibold">{label}</div>
                    <div className="stat-num text-2xl sm:text-[28px] font-black mt-1 text-[var(--ink-900)]">{value}</div>
                    {trend && (
                        <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                            <TrendingUp className="w-3 h-3" /> {trend}
                        </div>
                    )}
                </div>
                <div className={`grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br ${t.grad} text-white shadow-[var(--shadow-1)] shrink-0`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
};

export default function Overview() {
    const { user } = useAuth();
    const [page, setPage] = useState(null);
    const [links, setLinks] = useState([]);
    const [appts, setAppts] = useState([]);
    const [notifs, setNotifs] = useState([]);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        Promise.all([
            api.get("/pages/me").then((r) => setPage(r.data)).catch(() => setPage(null)),
            api.get("/links").then((r) => setLinks(r.data)).catch(() => []),
            api.get("/appointments").then((r) => setAppts(r.data)).catch(() => []),
            api.get("/notifications").then((r) => setNotifs(r.data)).catch(() => []),
            api.get("/stats/overview").then((r) => setStats(r.data)).catch(() => setStats(null)),
        ]);
    }, []);

    const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
    const upcoming = appts.filter(a => a.status !== "canceled" && a.status !== "completed").slice(0, 5);
    const completion = page
        ? [
            page.profile_image, page.bio, page.about,
            (page.actions || []).length > 0,
            (page.gallery || []).length > 0,
            (page.working_hours || []).length > 0,
            page.published,
        ].filter(Boolean).length * (100 / 7)
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="chip">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
                            داشبورد فعال
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--ink-900)]">
                        سلام {user?.name?.split(" ")[0] || "کاربر"} 👋
                    </h1>
                    <p className="text-[var(--ink-500)] text-sm mt-1">به داشبورد 1ix.ir خوش آمدید — یک نگاه به آمار امروز</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {!page && (
                        <Link to="/dashboard/page" data-testid="overview-create-page">
                            <Button className="rounded-xl h-10 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white shadow-[var(--shadow-glow)]">
                                <Plus className="w-4 h-4 ms-1.5" /> ساخت صفحه
                            </Button>
                        </Link>
                    )}
                    <Link to="/dashboard/links">
                        <Button variant="outline" className="rounded-xl h-10 border-[var(--line-strong)] bg-white">
                            <Plus className="w-4 h-4 ms-1.5" /> لینک جدید
                        </Button>
                    </Link>
                    <Link to="/dashboard/services">
                        <Button variant="outline" className="rounded-xl h-10 border-[var(--line-strong)] bg-white">
                            <Plus className="w-4 h-4 ms-1.5" /> سرویس جدید
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Page completion / Empty CTA */}
            {page ? (
                <div className="surface-elev p-6 relative overflow-hidden">
                    <div className="absolute -top-16 -end-16 w-48 h-48 rounded-full blob" style={{ background: "rgba(99,102,241,0.18)" }} aria-hidden />
                    <div className="relative flex flex-wrap items-center justify-between gap-3 mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-[var(--brand-50)] grid place-items-center text-[var(--brand-700)] font-extrabold text-xl overflow-hidden ring-4 ring-white shadow-[var(--shadow-1)]">
                                {page.profile_image ? (
                                    <img src={fullUploadUrl(page.profile_image)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    page.business_name?.[0] || "و"
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-[15px] text-[var(--ink-900)]">{page.business_name}</div>
                                <div className="text-xs text-[var(--ink-500)] font-mono mt-0.5" dir="ltr">1ix.ir/u/{page.username}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className={`chip text-[11px] ${
                                    page.published
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                        : "bg-amber-50 text-amber-700 border-amber-100"
                                }`}
                                data-testid="page-status-badge"
                            >
                                {page.published ? <Check className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                                {page.published ? "منتشر شده" : "پیش‌نویس"}
                            </span>
                            {page.published && (
                                <ShareDialog
                                    url={`${window.location.origin}/u/${page.username}`}
                                    title={page.business_name}
                                    label="اشتراک‌گذاری"
                                    testId="overview-share-btn"
                                />
                            )}
                            <Link to={`/u/${page.username}`} target="_blank">
                                <Button size="sm" variant="outline" className="rounded-xl border-[var(--line-strong)] bg-white">
                                    <Eye className="w-4 h-4 ms-1.5" /> پیش‌نمایش
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-[var(--ink-500)] font-semibold">تکمیل پروفایل</span>
                            <span className="stat-num font-extrabold text-[var(--ink-900)]">{toFarsiDigits(Math.round(completion))}٪</span>
                        </div>
                        <div className="h-2.5 bg-[var(--brand-50)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-l from-indigo-600 via-violet-500 to-amber-500 transition-all"
                                style={{ width: `${Math.round(completion)}%` }}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative overflow-hidden rounded-3xl mesh-ink text-white p-6 sm:p-8">
                    <div className="absolute -top-24 -end-24 w-72 h-72 rounded-full blob" style={{ background: "rgba(245,158,11,0.45)" }} aria-hidden />
                    <div className="absolute -bottom-24 -start-24 w-72 h-72 rounded-full blob" style={{ background: "rgba(139,92,246,0.45)" }} aria-hidden />
                    <div className="relative flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <span className="chip chip-ink bg-white/10 border-white/20 text-white mb-3">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> شروع سریع
                            </span>
                            <h2 className="text-xl sm:text-2xl font-extrabold mb-1.5">اولین صفحه‌ کسب‌وکار خود را بسازید</h2>
                            <p className="text-white/70 text-sm leading-7">کمتر از ۲ دقیقه — رایگان و بدون نیاز به دانش فنی</p>
                        </div>
                        <Link to="/dashboard/page">
                            <Button className="rounded-xl h-11 px-5 bg-white text-[var(--ink-900)] hover:bg-amber-50 font-bold" data-testid="overview-start-now">
                                شروع کنید <ArrowLeft className="w-4 h-4 ms-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Eye}              tone="indigo"  label="بازدید صفحه"     value={toFarsiDigits(page?.views || 0)}                          testId="stat-views" />
                <StatCard icon={MousePointerClick} tone="amber"   label="کلیک لینک‌ها"     value={toFarsiDigits(totalClicks)}                                testId="stat-clicks" />
                <StatCard icon={CalendarClock}     tone="emerald" label="نوبت‌های فعال"    value={toFarsiDigits(upcoming.length)}                            testId="stat-appts" />
                <StatCard icon={Bell}              tone="rose"    label="اطلاعیه‌های جدید" value={toFarsiDigits(notifs.filter(n => !n.read).length)}        testId="stat-notifs" />
            </div>

            {/* Charts */}
            {stats && (
                <div className="grid lg:grid-cols-2 gap-6">
                    <BarSeriesCard  title="نوبت‌های ۱۴ روز اخیر"      data={stats.appts_series}  color="#4f46e5" testId="chart-appts" />
                    <LineSeriesCard title="کلیک لینک‌ها در ۱۴ روز اخیر" data={stats.clicks_series} color="#f59e0b" testId="chart-clicks" />
                </div>
            )}

            {/* Status distribution + Top links */}
            {stats && (
                <div className="grid lg:grid-cols-2 gap-6">
                    <PieDistCard title="وضعیت نوبت‌ها" data={stats.status_dist} testId="chart-status" />
                    <div className="surface-elev p-5">
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-[var(--ink-900)]">
                            <TrendingUp className="w-4 h-4 text-[var(--brand-600)]" /> پرکلیک‌ترین لینک‌ها
                        </h3>
                        {stats.top_links.length === 0 ? (
                            <div className="text-center py-10 text-sm text-[var(--ink-300)]">هنوز لینکی ندارید</div>
                        ) : (
                            <ul className="space-y-1.5">
                                {stats.top_links.map((l, i) => (
                                    <li key={l.slug} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--brand-50)]/40 transition-colors">
                                        <span className="grid place-items-center w-7 h-7 rounded-lg bg-[var(--brand-50)] text-[var(--brand-600)] font-bold text-xs">
                                            {toFarsiDigits(i + 1)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm text-[var(--ink-900)] truncate">{l.title || "—"}</div>
                                            <div className="text-xs text-[var(--brand-700)] font-mono truncate" dir="ltr">/r/{l.slug}</div>
                                        </div>
                                        <div className="stat-num font-extrabold text-[var(--brand-700)]">{toFarsiDigits(l.clicks || 0)}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* Lists */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="surface-elev p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold flex items-center gap-2 text-[var(--ink-900)]">
                            <span className="grid place-items-center w-8 h-8 rounded-lg bg-[var(--brand-50)] text-[var(--brand-600)]">
                                <CalendarClock className="w-4 h-4" />
                            </span>
                            نوبت‌های پیش‌رو
                        </h3>
                        <Link to="/dashboard/appointments" className="text-xs font-semibold text-[var(--brand-700)] hover:underline flex items-center gap-1">
                            مشاهده همه <ChevronLeft className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    {upcoming.length === 0 ? (
                        <div className="text-center py-10 text-sm text-[var(--ink-300)]">هنوز نوبتی ثبت نشده</div>
                    ) : (
                        <ul className="space-y-2">
                            {upcoming.map((a) => (
                                <li key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-[var(--line)] hover:border-[var(--brand-200)] hover:bg-[var(--brand-50)]/30 transition-colors">
                                    <div className="min-w-0">
                                        <div className="font-semibold text-sm text-[var(--ink-900)]">{a.customer_name}</div>
                                        <div className="text-xs text-[var(--ink-500)] mt-0.5">
                                            {a.service_title || "خدمت"} · {formatJalaliDate(a.date)} · ساعت {toFarsiDigits(a.time)}
                                        </div>
                                    </div>
                                    <span className={`chip text-[10px] ${
                                        a.status === "confirmed"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                            : "bg-amber-50 text-amber-700 border-amber-100"
                                    }`}>
                                        {a.status === "confirmed" ? "تأیید شده" : "در انتظار"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="surface-elev p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold flex items-center gap-2 text-[var(--ink-900)]">
                            <span className="grid place-items-center w-8 h-8 rounded-lg bg-amber-50 text-amber-600">
                                <Bell className="w-4 h-4" />
                            </span>
                            اطلاعیه‌های اخیر
                        </h3>
                        <Link to="/dashboard/notifications" className="text-xs font-semibold text-[var(--brand-700)] hover:underline flex items-center gap-1">
                            مشاهده همه <ChevronLeft className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    {notifs.length === 0 ? (
                        <div className="text-center py-10 text-sm text-[var(--ink-300)]">اطلاعیه جدیدی وجود ندارد</div>
                    ) : (
                        <ul className="space-y-2">
                            {notifs.slice(0, 5).map((n) => (
                                <li key={n.id} className="flex items-start gap-3 p-3 rounded-xl border border-[var(--line)]">
                                    <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.read ? "bg-[var(--ink-300)]" : "bg-[var(--brand-500)] pulse-dot"}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm text-[var(--ink-900)]">{n.title}</div>
                                        <div className="text-xs text-[var(--ink-500)] mt-0.5 line-clamp-2">{n.body}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Quick actions */}
            <div className="surface-elev p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[var(--ink-900)] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" /> عملیات سریع
                    </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { to: "/dashboard/page",         icon: UserSquare2,   label: "ویرایش صفحه", tone: "indigo" },
                        { to: "/dashboard/links",        icon: LinkIcon,      label: "لینک جدید",   tone: "amber" },
                        { to: "/dashboard/services",     icon: Wrench,        label: "خدمت جدید",   tone: "emerald" },
                        { to: "/dashboard/appointments", icon: CalendarClock, label: "ثبت نوبت",    tone: "rose" },
                    ].map((q) => {
                        const t = TONE[q.tone] || TONE.indigo;
                        return (
                            <Link
                                key={q.to}
                                to={q.to}
                                className="group surface p-4 text-center hover-lift sheen"
                            >
                                <span className={`mx-auto grid place-items-center w-10 h-10 rounded-2xl bg-gradient-to-br ${t.grad} text-white shadow-[var(--shadow-1)] mb-2`}>
                                    <q.icon className="w-4 h-4" />
                                </span>
                                <div className="text-sm font-semibold text-[var(--ink-900)]">{q.label}</div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
