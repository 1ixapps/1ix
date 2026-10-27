import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Bell, CalendarDays, ChevronLeft, Eye, Link2, MousePointerClick, Plus, Settings2, UserRound, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import api, { fullUploadUrl, pickError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { BarSeriesCard, LineSeriesCard } from "@/components/Charts";
import { formatJalaliDate, toFarsiDigits } from "@/lib/jalali";
import ShareDialog from "@/components/ShareDialog";

function MetricCard({ icon: Icon, label, value, detail, tone = "indigo" }) {
    const tones = { indigo: "bg-indigo-50 text-indigo-700", emerald: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", sky: "bg-sky-50 text-sky-700" };
    return <article className="premium-card rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-slate-500">{label}</p><p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{value}</p><p className="mt-2 text-[11px] text-slate-400">{detail}</p></div><span className={"grid h-10 w-10 place-items-center rounded-xl " + (tones[tone] || tones.indigo)}><Icon className="h-5 w-5" /></span></div></article>;
}

function OverviewSkeleton() {
    return <div className="space-y-6" role="status" aria-label="در حال بارگذاری نمای کلی"><div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-200/70" />)}</div><div className="grid gap-6 lg:grid-cols-2"><div className="h-72 animate-pulse rounded-2xl bg-slate-200/70" /><div className="h-72 animate-pulse rounded-2xl bg-slate-200/70" /></div></div>;
}

export default function OverviewRedesign() {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);
    const inFlight = useRef(null);

    useEffect(() => {
        let active = true;
        setLoading(true); setError("");
        // React's development remount shares this pending request; no stale data cache.
        const request = inFlight.current || api.get("/dashboard/overview");
        inFlight.current = request;
        request.then(({ data }) => {
            if (!data?.stats || !Array.isArray(data.upcoming)) throw new Error("اطلاعات داشبورد کامل دریافت نشد؛ دوباره تلاش کن.");
            if (active) setSummary(data);
        }).catch(failure => {
            if (active) setError(pickError(failure));
        }).finally(() => {
            if (inFlight.current === request) inFlight.current = null;
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, [attempt]);

    const page = summary?.page;
    const stats = summary?.stats;
    const totalClicks = stats?.totals?.clicks || 0;
    const upcoming = summary?.upcoming || [];
    const unreadCount = summary?.unread_count || 0;
    const completionItems = page ? [page.profile_image, page.bio, page.about, (page.actions || []).length, (page.gallery || []).length, (page.working_hours || []).some(day => day.enabled), page.published] : [];
    const completion = page ? Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100) : 0;

    if (loading) return <OverviewSkeleton />;
    if (error) return <section className="pro-error-state" role="alert"><AlertCircle size={28} aria-hidden="true" /><h1>داشبورد بارگذاری نشد.</h1><p>{error}</p><Button type="button" onClick={() => setAttempt(value => value + 1)}>تلاش دوباره</Button></section>;

    return <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-extrabold text-indigo-600">نمای کلی کسب‌وکار</p><h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{user?.name ? user.name.split(" ")[0] + "، خوش آمدید" : "خوش آمدید"}</h1><p className="mt-2 text-sm text-slate-500">وضعیت صفحه، لینک‌ها و نوبت‌ها را یکجا دنبال کنید.</p></div>
            <div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="h-11 rounded-xl border-slate-200 bg-white font-bold text-slate-700"><Link to="/dashboard/links"><Link2 className="h-4 w-4" /> ساخت لینک</Link></Button><Button asChild className="h-11 rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700"><Link to="/dashboard/appointments"><Plus className="h-4 w-4" /> ثبت نوبت</Link></Button></div>
        </header>

        {page ? <section className="premium-card overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex min-w-0 items-center gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-indigo-50 text-xl font-black text-indigo-700">{page.profile_image ? <img src={fullUploadUrl(page.profile_image)} alt={page.business_name || "تصویر کسب‌وکار"} className="h-full w-full object-cover" /> : page.business_name?.[0] || "و"}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-extrabold text-slate-950">{page.business_name}</h2><span className={"inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold " + (page.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}><span className={"h-1.5 w-1.5 rounded-full " + (page.published ? "bg-emerald-500" : "bg-amber-500")} />{page.published ? "منتشر شده" : "پیش‌نویس"}</span></div><p className="mt-1 truncate text-xs text-slate-400" dir="ltr">{window.location.origin}/u/{page.username}</p></div></div>
                <div className="flex flex-wrap gap-2">{page.published && <ShareDialog url={window.location.origin + "/u/" + page.username} title={page.business_name} label="اشتراک‌گذاری" />}<Button asChild variant="outline" className="h-10 rounded-xl border-slate-200 bg-white font-bold"><Link to={"/u/" + page.username} target="_blank"><Eye className="h-4 w-4" /> مشاهده صفحه</Link></Button><Button asChild className="h-10 rounded-xl bg-slate-950 font-bold text-white hover:bg-slate-800"><Link to="/dashboard/page"><Settings2 className="h-4 w-4" /> ویرایش صفحه</Link></Button></div>
            </div>
            <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6"><div className="flex items-center justify-between text-xs"><span className="font-bold text-slate-600">تکمیل صفحه</span><span className="font-black text-slate-900">{toFarsiDigits(completion)}٪</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-indigo-600 transition-[width] duration-300" style={{ width: completion + "%" }} /></div></div>
        </section> : <section className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-6 sm:flex-row sm:items-center"><div><p className="text-xs font-extrabold text-indigo-700">قدم اول</p><h2 className="mt-2 text-xl font-black text-slate-950">صفحه حرفه‌ای کسب‌وکارت را بساز</h2><p className="mt-2 text-sm leading-7 text-slate-600">اطلاعات کسب‌وکار، خدمات و راه‌های ارتباطی را اضافه کنید تا صفحه‌تان آماده انتشار شود.</p></div><Button asChild className="h-11 shrink-0 rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-700"><Link to="/dashboard/page">شروع ساخت <ArrowLeft className="h-4 w-4" /></Link></Button></section>}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><MetricCard icon={Eye} label="بازدید صفحه" value={toFarsiDigits(page?.views || 0)} detail="بازدیدهای ثبت‌شده" /><MetricCard icon={MousePointerClick} label="کلیک لینک‌ها" value={toFarsiDigits(totalClicks)} detail={toFarsiDigits(summary?.active_link_count || 0) + " لینک فعال"} tone="sky" /><MetricCard icon={CalendarDays} label="نوبت‌های پیش‌رو" value={toFarsiDigits(summary?.upcoming_count || 0)} detail="در انتظار رسیدگی" tone="emerald" /><MetricCard icon={Bell} label="اعلان‌های خوانده‌نشده" value={toFarsiDigits(unreadCount)} detail={unreadCount ? "نیازمند بررسی" : "همه بررسی شده"} tone="amber" /></section>

        {stats && <section className="grid gap-6 xl:grid-cols-2"><BarSeriesCard title="نوبت‌ها در طول زمان" data={stats.appts_series || []} color="#4f46e5" /><LineSeriesCard title="کلیک لینک‌ها در طول زمان" data={stats.clicks_series || []} color="#0f766e" /></section>}

        <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
            <article className="premium-card rounded-2xl border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-extrabold text-slate-950">نوبت‌های پیش‌رو</h2><p className="mt-1 text-xs text-slate-400">آخرین وضعیت رزروها</p></div><Link to="/dashboard/appointments" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700">مشاهده همه <ChevronLeft className="h-4 w-4" /></Link></div>
                {upcoming.length ? <div className="divide-y divide-slate-100">{upcoming.map((appointment) => <div key={appointment.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CalendarDays className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="truncate text-sm font-extrabold text-slate-900">{appointment.customer_name}</div><div className="mt-1 truncate text-xs text-slate-500">{appointment.service_title || "خدمت"} · {formatJalaliDate(appointment.date)}</div></div><div className="flex items-center justify-between gap-3 sm:justify-end"><span className="text-sm font-black text-slate-800" dir="ltr">{toFarsiDigits(appointment.time)}</span><span className={"rounded-full px-2.5 py-1 text-[10px] font-bold " + (appointment.status === "confirmed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>{appointment.status === "confirmed" ? "تأیید شده" : "در انتظار"}</span></div></div>)}</div> : <div className="px-5 py-12 text-center"><CalendarDays className="mx-auto h-7 w-7 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600">هنوز نوبتی ثبت نشده</p><p className="mt-1 text-xs text-slate-400">نوبت‌های آینده در این بخش نمایش داده می‌شوند.</p></div>}
            </article>
            <article className="premium-card rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-extrabold text-slate-950">اقدام‌های سریع</h2><p className="mt-1 text-xs text-slate-400">کارهای پرتکرار را سریع انجام دهید</p><div className="mt-5 grid gap-2">{[["/dashboard/page", UserRound, "تکمیل صفحه کسب‌وکار"], ["/dashboard/services", Wrench, "افزودن خدمت جدید"], ["/dashboard/links", Link2, "ساخت لینک کوتاه"], ["/dashboard/appointments", CalendarDays, "مدیریت نوبت‌ها"]].map(([to, Icon, label]) => <Link key={to} to={to} className="group flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-indigo-700"><Icon className="h-4 w-4" /></span><span className="flex-1">{label}</span><ChevronLeft className="h-4 w-4 text-slate-300 group-hover:text-indigo-500" /></Link>)}</div></article>
        </section>
    </div>;
}
