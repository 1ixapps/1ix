import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Sparkles, Link as LinkIcon, CalendarClock, Bell, Stethoscope,
    Scissors, Briefcase, ArrowLeft, Check, Star, Layers, Smartphone, ShieldCheck,
    Zap, TrendingUp, Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api from "@/lib/api";

const CATEGORY_IMGS = {
    clinic: "https://static.prod-images.emergentagent.com/jobs/d63501c4-4716-4a32-98ab-269faa27cd17/images/2313e9d14e7cc3107939c6e4d600e7000c1e979164773d73268b00dd0d5982f6.png",
    salon: "https://static.prod-images.emergentagent.com/jobs/d63501c4-4716-4a32-98ab-269faa27cd17/images/d69124472f244ad0889ccd8b03cd16b923dbeb076c4756ae2e8ba8a674d86adb.png",
    freelancer: "https://static.prod-images.emergentagent.com/jobs/d63501c4-4716-4a32-98ab-269faa27cd17/images/dbad66c33e2c713c063caead20ac8f5b3db37efb9016d7c22b2a15f8369707ca.png",
};

const FEATURES = [
    {
        icon: Layers,
        title: "ساخت صفحه حرفه‌ای",
        desc: "صفحه‌ای زیبا و کامل برای کسب‌وکار خود بسازید — درست مثل یک وب‌سایت کوچک و حرفه‌ای.",
        tone: "indigo",
    },
    {
        icon: LinkIcon,
        title: "کوتاه‌کننده لینک",
        desc: "لینک‌های بلند را به آدرس‌های کوتاه و QR Code تبدیل کنید و آمار کلیک‌ها را ببینید.",
        tone: "violet",
    },
    {
        icon: CalendarClock,
        title: "نوبت‌دهی آنلاین",
        desc: "مشتریان شما در چند کلیک نوبت رزرو می‌کنند — بدون دوگانگی و تداخل زمانی.",
        tone: "emerald",
    },
    {
        icon: Bell,
        title: "اطلاع‌رسانی و ارتباط",
        desc: "یادآوری نوبت، پیام به مشتری و اطلاعیه‌های مهم — همه از یک داشبورد ساده.",
        tone: "amber",
    },
    {
        icon: Smartphone,
        title: "موبایل-فرست",
        desc: "هر صفحه و داشبورد به طور کامل برای موبایل بهینه‌سازی شده است.",
        tone: "rose",
    },
    {
        icon: ShieldCheck,
        title: "امن و قابل اعتماد",
        desc: "از داخل حساب شخصی، صفحه و اطلاعات کسب‌وکارت را مدیریت کن.",
        tone: "sky",
    },
];

const TONE_MAP = {
    indigo:  { bg: "bg-indigo-50",  text: "text-indigo-600",  ring: "ring-indigo-100" },
    violet:  { bg: "bg-violet-50",  text: "text-violet-600",  ring: "ring-violet-100" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", ring: "ring-emerald-100" },
    amber:   { bg: "bg-amber-50",   text: "text-amber-600",   ring: "ring-amber-100" },
    rose:    { bg: "bg-rose-50",    text: "text-rose-600",    ring: "ring-rose-100" },
    sky:     { bg: "bg-sky-50",     text: "text-sky-600",     ring: "ring-sky-100" },
};

const CATEGORIES = [
    { id: "clinic",     title: "پزشکان و کلینیک‌ها",     img: CATEGORY_IMGS.clinic,     icon: Stethoscope, tag: "بهداشت و درمان" },
    { id: "salon",      title: "آرایشگاه و سالن زیبایی", img: CATEGORY_IMGS.salon,      icon: Scissors,    tag: "زیبایی" },
    { id: "freelancer", title: "فریلنسر و کسب‌وکار کوچک", img: CATEGORY_IMGS.freelancer, icon: Briefcase,   tag: "خدمات حرفه‌ای" },
];

const STEPS = [
    { num: 1, title: "ثبت‌نام در چند ثانیه",      desc: "با ایمیل ثبت‌نام کنید — رایگان و بدون نیاز به کارت اعتباری." },
    { num: 2, title: "صفحه‌ کسب‌وکارتان را بسازید", desc: "نام، بیو، خدمات، ساعت کاری و دکمه‌های تماس را اضافه کنید." },
    { num: 3, title: "آدرس اختصاصی بگیرید",       desc: "1ix.ir/u/شما — این لینک را در اینستاگرام، شبکه‌ها و کارت ویزیت بگذارید." },
    { num: 4, title: "مشتری و نوبت بگیرید",        desc: "نوبت‌ها، پیام‌ها و آمار را در داشبورد ساده 1ix.ir مدیریت کنید." },
];

const FAQ = [
    { q: "آیا استفاده از 1ix.ir رایگان است؟",       a: "بله، پلن رایگان 1ix.ir شامل ساخت صفحه، لینک کوتاه و نوبت‌دهی پایه است. پلن‌های حرفه‌ای برای کسب‌وکارهایی است که امکانات بیشتری نیاز دارند." },
    { q: "برای چه کسب‌وکارهایی مناسب است؟",       a: "پزشکان، روانشناسان، کلینیک‌ها، آرایشگاه‌ها، فریلنسرها، آموزشگاه‌ها و هر کسب‌وکاری که نیاز به یک صفحه حرفه‌ای + نوبت‌دهی دارد." },
    { q: "آیا نیاز به دانش فنی دارم؟",            a: "خیر. 1ix.ir به شکلی طراحی شده که در چند دقیقه و بدون دانش طراحی یا برنامه‌نویسی صفحه‌ خود را راه‌اندازی کنید." },
    { q: "آیا می‌توانم بعداً دامنه اختصاصی متصل کنم؟", a: "بله — اتصال دامنه اختصاصی در پلن کسب‌وکار/کلینیک به‌زودی فعال می‌شود." },
];

const STATS = [
    { num: "۲ دقیقه", label: "تا راه‌اندازی صفحه" },
    { num: "۹۹٫۹٪",   label: "آپتایم سرویس" },
    { num: "۲۴/۷",    label: "دسترسی به داشبورد" },
    { num: "۰ تومان", label: "شروع رایگان" },
];

const LOGOS = ["کلینیک نگار", "آرایشگاه آذر", "موسسه پارس", "روانشناسی آرام", "آموزشگاه نوین", "استودیو نقش"];

export default function Home() {
    const [plans, setPlans] = useState([]);

    useEffect(() => {
        api.get("/public/plans").then((r) => setPlans(r.data)).catch(() => {});
    }, []);

    return (
        <div className="min-h-screen">
            <Navbar />

            {/* ─────────── HERO ─────────── */}
            <section className="relative overflow-hidden mesh-aurora">
                <div className="absolute inset-0 grid-overlay pointer-events-none" aria-hidden />
                <div className="absolute -top-40 -end-32 w-[28rem] h-[28rem] rounded-full blob"
                     style={{ background: "rgba(99,102,241,0.35)" }} aria-hidden />
                <div className="absolute -bottom-40 -start-32 w-[28rem] h-[28rem] rounded-full blob"
                     style={{ background: "rgba(245,158,11,0.30)" }} aria-hidden />

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-24 sm:pt-24 sm:pb-28 grid lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-7 fade-up">
                        <span className="chip mb-6">
                            <Sparkles className="w-3.5 h-3.5" />
                            نسخه جدید 1ix.ir برای کسب‌وکارهای ایرانی
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot ms-1" />
                        </span>

                        <h1 className="text-4xl sm:text-5xl lg:text-[3.8rem] font-black tracking-tight leading-[1.1] text-[var(--ink-900)]">
                            صفحه‌ حرفه‌ای، لینک کوتاه
                            <br />
                            و <span className="text-gradient">نوبت‌دهی هوشمند</span>
                            <br />
                            <span className="text-gradient-ink">همه در یک پلتفرم</span>
                        </h1>

                        <p className="mt-6 text-lg text-[var(--ink-500)] leading-8 max-w-2xl">
                            1ix.ir یک ابزار ساده و حرفه‌ای برای پزشکان، کلینیک‌ها، آرایشگاه‌ها و فریلنسرهاست
                            تا در چند دقیقه صفحه‌ کسب‌وکار، آدرس کوتاه و سامانه‌ نوبت‌دهی آنلاین خود را راه‌اندازی کنند.
                        </p>

                        <div className="mt-9 flex flex-wrap gap-3">
                            <Link to="/signup" data-testid="hero-cta-signup">
                                <Button size="lg" className="rounded-full h-12 px-6 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white text-base shadow-[0_18px_36px_-14px_rgba(99,102,241,0.7)]">
                                    شروع رایگان <ArrowLeft className="w-4 h-4 ms-2" />
                                </Button>
                            </Link>
                            <a href="#features" data-testid="hero-cta-features">
                                <Button variant="outline" size="lg" className="rounded-full h-12 px-6 text-base border-[var(--line-strong)] bg-white/70 hover:bg-white">
                                    مشاهده امکانات
                                </Button>
                            </a>
                            <Link to="/pricing" data-testid="hero-cta-pricing">
                                <Button variant="ghost" size="lg" className="rounded-full h-12 px-5 text-base text-[var(--ink-700)] hover:bg-white/60">
                                    تعرفه‌ها <ArrowLeft className="w-4 h-4 ms-2" />
                                </Button>
                            </Link>
                        </div>

                        {/* Stats inline */}
                        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6">
                            {STATS.map((s, i) => (
                                <div key={i} data-testid={`stat-${i}`} className="fade-up" style={{ animationDelay: `${0.1 + i * 0.06}s` }}>
                                    <div className="stat-num text-2xl sm:text-[28px] font-black text-[var(--ink-900)]">{s.num}</div>
                                    <div className="text-xs text-[var(--ink-500)] mt-1.5">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Hero preview — premium device card */}
                    <div className="lg:col-span-5 relative fade-up fade-up-delay-2">
                        <div className="absolute -top-10 -end-6 w-72 h-72 rounded-full blob" style={{ background: "rgba(139,92,246,0.5)" }} aria-hidden />
                        <div className="absolute -bottom-10 -start-6 w-72 h-72 rounded-full blob" style={{ background: "rgba(245,158,11,0.45)" }} aria-hidden />

                        <div className="relative glass-card rounded-[28px] p-6 max-w-sm mx-auto sheen float-y">
                            <div className="h-32 rounded-2xl mb-12 relative overflow-hidden"
                                 style={{ background: "conic-gradient(from 220deg at 50% 50%, #6366f1, #8b5cf6, #f59e0b, #6366f1)" }}>
                                <div className="absolute inset-0 grid-overlay opacity-50" />
                                <div className="absolute -bottom-10 start-6 w-20 h-20 rounded-2xl bg-white shadow-[var(--shadow-3)] grid place-items-center text-3xl font-black text-[var(--brand-700)] ring-4 ring-white">
                                    د
                                </div>
                                <span className="absolute top-3 end-3 chip chip-ink text-[10px]">منتشر شده</span>
                            </div>

                            <div className="text-[19px] font-extrabold tracking-tight text-[var(--ink-900)]">دکتر مریم احمدی</div>
                            <div className="text-xs text-[var(--ink-500)] mb-4" dir="ltr">روانشناس بالینی · 1ix.ir/u/maryam</div>

                            <div className="grid gap-2">
                                {[
                                    { t: "تماس",        emoji: "📞", tone: "bg-emerald-50 text-emerald-700 border-emerald-100" },
                                    { t: "واتساپ",       emoji: "💬", tone: "bg-emerald-50 text-emerald-700 border-emerald-100" },
                                    { t: "رزرو نوبت",    emoji: "📅", tone: "bg-indigo-50 text-indigo-700 border-indigo-100" },
                                    { t: "مشاهده آدرس", emoji: "📍", tone: "bg-rose-50 text-rose-700 border-rose-100" },
                                ].map((row, i) => (
                                    <div
                                        key={i}
                                        className={`flex items-center justify-between px-3.5 py-3 rounded-xl border ${row.tone} text-sm font-semibold hover:shadow-[var(--shadow-2)] transition-shadow`}
                                    >
                                        <span className="flex items-center gap-2"><span className="text-base">{row.emoji}</span>{row.t}</span>
                                        <ArrowLeft className="w-4 h-4 opacity-60" />
                                    </div>
                                ))}
                            </div>

                            {/* mini metric strip */}
                            <div className="mt-5 pt-4 border-t border-[var(--line)] grid grid-cols-3 gap-2 text-center">
                                {[
                                    { n: "۱٬۲۰۴", l: "بازدید" },
                                    { n: "۳۲۸",   l: "کلیک" },
                                    { n: "۴۷",    l: "نوبت" },
                                ].map((m, i) => (
                                    <div key={i}>
                                        <div className="stat-num text-base font-extrabold text-[var(--ink-900)]">{m.n}</div>
                                        <div className="text-[10px] text-[var(--ink-500)]">{m.l}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* floating badges */}
                        <div className="hidden sm:flex absolute -bottom-6 -end-4 chip chip-gold shadow-[var(--shadow-2)] bg-white">
                            <Zap className="w-3.5 h-3.5" /> راه‌اندازی فوری
                        </div>
                        <div className="hidden sm:flex absolute -top-3 -start-2 chip shadow-[var(--shadow-2)] bg-white">
                            <TrendingUp className="w-3.5 h-3.5" /> رشد ۲٫۴ برابری مشتری
                        </div>
                    </div>
                </div>

                {/* logo marquee strip */}
                <div className="relative border-t border-[var(--line)] bg-white/60 backdrop-blur-md">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex items-center gap-6 overflow-hidden">
                        <span className="text-xs font-semibold text-[var(--ink-300)] whitespace-nowrap tracking-wider uppercase">مورد اعتماد</span>
                        <div className="flex-1 overflow-hidden">
                            <div className="marquee flex gap-10 whitespace-nowrap">
                                {[...LOGOS, ...LOGOS].map((logo, i) => (
                                    <span key={i} className="text-sm font-semibold text-[var(--ink-500)] opacity-70 hover:opacity-100 transition-opacity">
                                        {logo}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─────────── CATEGORIES ─────────── */}
            <section className="bg-white border-b border-[var(--line)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center mb-12">
                        <span className="chip mb-3"><Briefcase className="w-3.5 h-3.5" /> برای هر کسب‌وکار</span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">برای چه کسب‌وکارهایی؟</h2>
                        <p className="mt-3 text-[var(--ink-500)] max-w-xl mx-auto">
                            1ix.ir کنار شماست — هر جا که نیاز به یک صفحه حرفه‌ای و نوبت‌دهی دارید.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {CATEGORIES.map((c, idx) => (
                            <div
                                key={c.id}
                                className="group relative rounded-3xl overflow-hidden surface-elev hover-lift sheen fade-up"
                                style={{ animationDelay: `${idx * 0.08}s` }}
                                data-testid={`category-${c.id}`}
                            >
                                <div className="aspect-[5/4] overflow-hidden relative">
                                    <img
                                        src={c.img}
                                        alt={c.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1020]/70 via-[#0b1020]/20 to-transparent" />
                                    <span className="absolute top-4 start-4 chip chip-ink text-[10px]">{c.tag}</span>
                                </div>
                                <div className="p-5 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="grid place-items-center w-11 h-11 rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)] ring-1 ring-[var(--brand-100)]">
                                            <c.icon className="w-5 h-5" />
                                        </span>
                                        <div className="font-bold text-[var(--ink-900)]">{c.title}</div>
                                    </div>
                                    <ArrowLeft className="w-4 h-4 text-[var(--ink-300)] group-hover:text-[var(--brand-600)] group-hover:-translate-x-1 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─────────── FEATURES ─────────── */}
            <section id="features" className="relative mesh-soft">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
                    <div className="text-center mb-14">
                        <span className="chip chip-gold mb-3"><Sparkles className="w-3.5 h-3.5" /> امکانات 1ix.ir</span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">هر چه برای ارائه‌ آنلاین کسب‌وکار نیاز دارید</h2>
                        <p className="mt-3 text-[var(--ink-500)] max-w-2xl mx-auto">
                            1ix.ir ابزارهای مهم ارائه آنلاین کسب‌وکار را در یک پلتفرم ساده گردآوری کرده — بدون پیچیدگی، با بیشترین کارایی.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {FEATURES.map((f, i) => {
                            const t = TONE_MAP[f.tone] || TONE_MAP.indigo;
                            return (
                                <div
                                    key={i}
                                    className="surface-elev p-6 hover-lift sheen fade-up"
                                    style={{ animationDelay: `${i * 0.05}s` }}
                                    data-testid={`feature-${i}`}
                                >
                                    <div className={`grid place-items-center w-12 h-12 rounded-2xl ${t.bg} ${t.text} ring-4 ${t.ring} mb-4`}>
                                        <f.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-[17px] mb-2 text-[var(--ink-900)]">{f.title}</h3>
                                    <p className="text-sm text-[var(--ink-500)] leading-7">{f.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ─────────── HOW IT WORKS ─────────── */}
            <section className="relative bg-white border-y border-[var(--line)]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
                    <div className="text-center mb-14">
                        <span className="chip mb-3">۴ مرحله ساده</span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">در چهار مرحله شروع کنید</h2>
                        <p className="mt-3 text-[var(--ink-500)]">از ثبت‌نام تا دریافت اولین مشتری، در کمتر از ۲ دقیقه.</p>
                    </div>

                    <div className="relative grid md:grid-cols-4 gap-6">
                        {/* connector line */}
                        <div className="hidden md:block absolute top-12 inset-x-12 h-px divider-brand" aria-hidden />

                        {STEPS.map((s, i) => (
                            <div
                                key={s.num}
                                className="relative surface-elev p-6 hover-lift fade-up"
                                style={{ animationDelay: `${i * 0.08}s` }}
                                data-testid={`step-${s.num}`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="grid place-items-center w-10 h-10 rounded-2xl text-white font-extrabold shadow-[var(--shadow-glow)]"
                                          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                                        {s.num.toLocaleString("fa-IR")}
                                    </span>
                                    <span className="text-6xl font-black text-[var(--brand-100)] leading-none select-none">
                                        {s.num}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg mb-2 text-[var(--ink-900)]">{s.title}</h3>
                                <p className="text-sm text-[var(--ink-500)] leading-7">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─────────── PRICING TEASER ─────────── */}
            <section id="pricing" className="mesh-soft">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
                    <div className="text-center mb-12">
                        <span className="chip chip-gold mb-3">قیمت‌گذاری شفاف</span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">تعرفه شفاف و منعطف</h2>
                        <p className="mt-3 text-[var(--ink-500)]">رایگان شروع کنید — هر زمان نیاز شد ارتقاء دهید.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {plans.map((p, i) => (
                            <div
                                key={p.id}
                                className={`relative p-8 rounded-3xl fade-up ${
                                    p.popular
                                        ? "surface-glow ring-2 ring-[var(--brand-600)]"
                                        : "surface-elev hover-lift"
                                }`}
                                style={{ animationDelay: `${i * 0.08}s` }}
                                data-testid={`plan-${p.id}`}
                            >
                                {p.popular && (
                                    <span className="absolute -top-3 start-1/2 -translate-x-1/2 sm:translate-x-0 sm:start-6 chip chip-ink"
                                          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#fff", borderColor: "transparent" }}>
                                        <Sparkles className="w-3 h-3" /> محبوب‌ترین
                                    </span>
                                )}
                                <h3 className="text-lg font-bold mb-1 text-[var(--ink-900)]">{p.name}</h3>
                                <p className="text-xs text-[var(--ink-500)] mb-5">
                                    {p.popular ? "بهترین انتخاب برای کسب‌وکارهای رو به رشد" : "مناسب شروع و تست پلتفرم"}
                                </p>

                                <div className="mb-6">
                                    <span className="stat-num text-4xl font-black text-[var(--ink-900)]">
                                        {p.price_monthly === 0 ? "رایگان" : p.price_monthly.toLocaleString("fa-IR")}
                                    </span>
                                    {p.price_monthly !== 0 && (
                                        <span className="text-sm text-[var(--ink-500)] ms-1">تومان / ماه</span>
                                    )}
                                </div>

                                <ul className="space-y-3 mb-7">
                                    {p.features.slice(0, 5).map((f, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--ink-700)]">
                                            <span className="grid place-items-center w-5 h-5 rounded-full bg-[var(--brand-50)] text-[var(--brand-600)] mt-0.5 shrink-0">
                                                <Check className="w-3 h-3" />
                                            </span>
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Link to="/pricing">
                                    <Button
                                        className={`w-full h-11 rounded-xl ${
                                            p.popular
                                                ? "bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white shadow-[var(--shadow-glow)]"
                                                : "bg-white border border-[var(--line-strong)] text-[var(--ink-900)] hover:bg-[var(--brand-50)]"
                                        }`}
                                        data-testid={`plan-cta-${p.id}`}
                                    >
                                        {p.cta} <ArrowLeft className="w-4 h-4 ms-2" />
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─────────── TESTIMONIAL ─────────── */}
            <section className="relative overflow-hidden mesh-ink text-white">
                <div className="absolute -top-32 -end-32 w-96 h-96 rounded-full blob"
                     style={{ background: "rgba(99,102,241,0.55)" }} aria-hidden />
                <div className="absolute -bottom-32 -start-32 w-96 h-96 rounded-full blob"
                     style={{ background: "rgba(245,158,11,0.45)" }} aria-hidden />
                <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 text-center">
                    <Quote className="w-10 h-10 text-amber-300 mx-auto mb-6 opacity-80" />
                    <p className="text-xl sm:text-3xl font-medium leading-[1.6] max-w-3xl mx-auto">
                        «1ix.ir کارم را خیلی راحت کرد. مشتری‌ها لینک صفحه‌ام را در اینستاگرام می‌بینند و
                        خودشان نوبت رزرو می‌کنند. دیگر پاسخگویی تلفنی برای تنظیم نوبت ندارم.»
                    </p>
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white/10 grid place-items-center font-black text-amber-300 text-lg">ع</div>
                        <div className="text-start">
                            <div className="font-bold">دکتر علی حسینی</div>
                            <div className="text-sm text-white/60">متخصص پوست · کلینیک نگار</div>
                        </div>
                        <div className="hidden sm:flex items-center gap-1 ms-6 text-amber-300">
                            {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-300" />)}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─────────── FAQ ─────────── */}
            <section id="faq" className="bg-white">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-24">
                    <div className="text-center mb-10">
                        <span className="chip mb-3">سوالات متداول</span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">پاسخ سوال‌های پرتکرار</h2>
                    </div>
                    <Accordion type="single" collapsible className="space-y-3" data-testid="faq-accordion">
                        {FAQ.map((item, i) => (
                            <AccordionItem
                                key={i}
                                value={`q${i}`}
                                className="surface px-5 border-0 data-[state=open]:shadow-[var(--shadow-2)]"
                            >
                                <AccordionTrigger className="text-start font-semibold text-[var(--ink-900)] hover:no-underline" data-testid={`faq-q-${i}`}>
                                    {item.q}
                                </AccordionTrigger>
                                <AccordionContent className="text-[var(--ink-500)] leading-7">{item.a}</AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </section>

            {/* ─────────── BIG CTA ─────────── */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
                <div className="relative overflow-hidden rounded-[32px] mesh-ink text-white p-10 sm:p-16 text-center noise-overlay">
                    <div className="absolute -top-24 -end-24 w-72 h-72 rounded-full blob"
                         style={{ background: "rgba(139,92,246,0.55)" }} aria-hidden />
                    <div className="absolute -bottom-24 -start-24 w-72 h-72 rounded-full blob"
                         style={{ background: "rgba(245,158,11,0.45)" }} aria-hidden />

                    <span className="relative chip chip-ink mb-5 bg-white/10 border-white/20 text-white">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" /> شروع رایگان · بدون کارت اعتباری
                    </span>

                    <h2 className="relative text-3xl sm:text-5xl font-black tracking-tight mb-4 max-w-3xl mx-auto leading-tight">
                        آماده‌اید کسب‌وکار خود را
                        <br className="hidden sm:block" />
                        <span className="text-gradient">آنلاین</span> کنید؟
                    </h2>
                    <p className="relative text-white/70 mb-8 max-w-2xl mx-auto leading-8">
                        ساخت صفحه و دریافت آدرس اختصاصی شما کمتر از دو دقیقه طول می‌کشد — همین حالا شروع کنید.
                    </p>
                    <div className="relative flex flex-wrap gap-3 justify-center">
                        <Link to="/signup" data-testid="cta-signup-bottom">
                            <Button size="lg" className="rounded-full h-12 px-7 bg-white text-[var(--ink-900)] hover:bg-amber-50 text-base font-bold shadow-[0_18px_40px_-12px_rgba(255,255,255,0.4)]">
                                ساخت صفحه رایگان <ArrowLeft className="w-4 h-4 ms-2" />
                            </Button>
                        </Link>
                        <Link to="/pricing">
                            <Button size="lg" variant="ghost" className="rounded-full h-12 px-7 bg-white/10 text-white hover:bg-white/15 border border-white/15 text-base">
                                مقایسه پلن‌ها
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
