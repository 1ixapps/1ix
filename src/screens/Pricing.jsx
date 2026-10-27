import React, { useEffect, useState } from "react";
import { Check, Sparkles, ShieldCheck, Zap, HelpCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/NavbarPremium";
import Footer from "@/components/FooterPremium";
import api from "@/lib/api";
import SeoHead from "@/components/SeoHead";
import { absoluteUrl, pageSeo } from "../../shared/seo.mjs";
import PricingPlanCard from "@/components/PricingPlanCard";

const COMPARE_ROWS = [
    { label: "صفحه‌ شخصی کسب‌وکار",   free: true,  pro: true,  business: true },
    { label: "لینک کوتاه و QR Code",   free: "۵",   pro: "نامحدود", business: "نامحدود" },
    { label: "نوبت‌دهی آنلاین",         free: true,  pro: true,  business: true },
    { label: "حذف برند 1ix.ir",         free: false, pro: true,  business: true },
    { label: "آمار پیشرفته",            free: false, pro: true,  business: true },
    { label: "دامنه اختصاصی",           free: false, pro: false, business: true },
    { label: "پشتیبانی اولویت‌دار",      free: false, pro: false, business: true },
];

const FAQ = [
    { q: "آیا می‌توانم پلن خود را ارتقاء یا تغییر دهم؟",     a: "برای تغییر یا تمدید پلن با پشتیبانی تلگرام در ارتباط باش. مبلغ و زمان فعال‌سازی قبل از تأیید به تو اعلام می‌شود." },
    { q: "آیا تخفیفی برای پرداخت سالانه وجود دارد؟",         a: "بله. با انتخاب صورت‌حساب سالانه، معادل ۲ ماه به‌صورت رایگان دریافت می‌کنید." },
    { q: "چگونه می‌توانم پرداخت کنم؟",                         a: "پس از ۷ روز حرفه‌ای، برای تمدید امکانات حرفه‌ای از پشتیبانی تلگرام راهنمایی بگیرید. پلن رایگان همیشه فعال می‌ماند." },
];

const Tick = ({ on }) => on
    ? <Check className="w-4 h-4 text-emerald-600 mx-auto" />
    : <span className="block h-px w-4 mx-auto bg-[var(--line-strong)]" />;

export default function Pricing({ initialPlans } = {}) {
    const [plans, setPlans] = useState(initialPlans || []);
    const [yearly, setYearly] = useState(false);

    useEffect(() => {
        if (initialPlans) return;
        api.get("/public/plans").then((r) => setPlans(r.data)).catch(() => {});
    }, [initialPlans]);
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, []);

    return (
        <div className="v3-pricing luxury-pricing min-h-screen bg-[#fbfaf7]">
            <SeoHead
                title={pageSeo("/pricing").title}
                description={pageSeo("/pricing").description}
                keywords={pageSeo("/pricing").keywords}
                canonical={absoluteUrl("/pricing")}
            />
            <Navbar />

            {/* HERO */}
            <section className="luxury-hero vanix-hero relative overflow-hidden mesh-aurora">
                <div className="absolute -top-32 -end-24 w-96 h-96 rounded-full blob"
                     style={{ background: "rgba(99,102,241,0.35)" }} aria-hidden />
                <div className="absolute -bottom-32 -start-24 w-96 h-96 rounded-full blob"
                     style={{ background: "rgba(245,158,11,0.30)" }} aria-hidden />

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-12 sm:pb-16 text-center">
                    <span className="chip mb-4"><Sparkles className="w-3.5 h-3.5" /> قیمت‌گذاری شفاف</span>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[var(--ink-900)]">
                        تعرفه‌های <span className="text-gradient">وانیکس</span>
                    </h1>
                    <p className="mt-4 text-[var(--ink-500)] max-w-2xl mx-auto leading-8">
                        ۷ روز همه‌ی امکانات حرفه‌ای را امتحان کنید؛ بعد از آن، پلن رایگان برای همیشه در دسترس شماست. برای تمدید حرفه‌ای با پشتیبانی تلگرام در ارتباط باشید.
                    </p>

                    {/* Toggle pill */}
                    <div className="oneix-billing-control mt-9 inline-flex items-center gap-3 surface px-2 py-2 rounded-full shadow-[var(--shadow-1)]">
                        <button
                            type="button"
                            onClick={() => setYearly(false)}
                            aria-pressed={!yearly}
                            className={`text-sm font-semibold rounded-full px-4 py-1.5 transition-all ${
                                !yearly ? "bg-[var(--ink-900)] text-white shadow-[var(--shadow-2)]" : "text-[var(--ink-500)]"
                            }`}
                        >
                            ماهانه
                        </button>
                        <Switch checked={yearly} onCheckedChange={setYearly} aria-label="نمایش تعرفه‌های سالانه" data-testid="billing-toggle" />
                        <button
                            type="button"
                            onClick={() => setYearly(true)}
                            aria-pressed={yearly}
                            className={`text-sm font-semibold rounded-full px-4 py-1.5 transition-all flex items-center gap-2 ${
                                yearly ? "bg-[var(--ink-900)] text-white shadow-[var(--shadow-2)]" : "text-[var(--ink-500)]"
                            }`}
                        >
                            سالانه
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${yearly ? "bg-amber-300/30 text-amber-200" : "bg-amber-100 text-amber-700"}`}>
                                ۲ ماه رایگان
                            </span>
                        </button>
                    </div>
                </div>
            </section>

            {/* PLANS */}
            <section className="relative">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
                    <div className="oneix-plan-grid oneix-plan-grid--pricing">
                        {plans.map((plan) => (
                            <PricingPlanCard key={plan.id} plan={plan} yearly={yearly} />
                        ))}
                    </div>

                    {/* Trust strip */}
                    <div className="premium-card mt-12 surface p-5 max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-[var(--ink-500)]">
                        <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> تمدید با پشتیبانی</span>
                        <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> شروع با دورهٔ حرفه‌ای</span>
                        <span className="flex items-center gap-2"><Check className="w-4 h-4 text-[var(--brand-600)]" /> بدون تعهد</span>
                        <span className="flex items-center gap-2"><HelpCircle className="w-4 h-4 text-[var(--ink-500)]" /> پشتیبانی فارسی</span>
                    </div>
                </div>
            </section>

            {/* COMPARE TABLE */}
            <section className="bg-white border-y border-[var(--line)]">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-extrabold tracking-tight">مقایسه‌ پلن‌ها</h2>
                        <p className="mt-3 text-[var(--ink-500)]">جزئیات هر پلن را در یک نگاه ببینید.</p>
                    </div>
                    <div className="premium-card surface-elev overflow-hidden">
                        <div className="oneix-plan-comparison grid grid-cols-4 text-sm">
                            <div className="px-5 py-4 font-bold text-[var(--ink-900)] bg-[var(--brand-50)]/40">امکانات</div>
                            <div className="px-5 py-4 text-center font-bold text-[var(--ink-700)]">رایگان</div>
                            <div className="px-5 py-4 text-center font-bold text-white bg-[var(--brand-600)]">حرفه‌ای</div>
                            <div className="px-5 py-4 text-center font-bold text-[var(--ink-700)]">کسب‌وکار</div>
                            {COMPARE_ROWS.map((r, i) => (
                                <React.Fragment key={i}>
                                    <div className={`px-5 py-3.5 border-t border-[var(--line)] ${i % 2 ? "bg-[var(--brand-50)]/20" : ""}`}>{r.label}</div>
                                    <div className={`px-5 py-3.5 border-t border-[var(--line)] text-center ${i % 2 ? "bg-[var(--brand-50)]/20" : ""}`}>
                                        {typeof r.free === "boolean" ? <Tick on={r.free} /> : <span className="text-[var(--ink-700)] font-semibold">{r.free}</span>}
                                    </div>
                                    <div className={`px-5 py-3.5 border-t border-[var(--line)] text-center bg-[var(--brand-50)]/40 ${i === COMPARE_ROWS.length - 1 ? "rounded-b-none" : ""}`}>
                                        {typeof r.pro === "boolean" ? <Tick on={r.pro} /> : <span className="text-[var(--ink-900)] font-semibold">{r.pro}</span>}
                                    </div>
                                    <div className={`px-5 py-3.5 border-t border-[var(--line)] text-center ${i % 2 ? "bg-[var(--brand-50)]/20" : ""}`}>
                                        {typeof r.business === "boolean" ? <Tick on={r.business} /> : <span className="text-[var(--ink-700)] font-semibold">{r.business}</span>}
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-10">
                    <span className="chip mb-3">سوالات پرتکرار</span>
                    <h2 className="text-3xl font-extrabold tracking-tight">قبل از خرید بدانید</h2>
                </div>
                <div className="space-y-3">
                    {FAQ.map((item, i) => (
                        <details key={i} className="premium-card group surface px-5 py-4 cursor-pointer">
                            <summary className="flex items-center justify-between font-semibold text-[var(--ink-900)] list-none">
                                {item.q}
                                <span className="grid place-items-center w-7 h-7 rounded-full bg-[var(--brand-50)] text-[var(--brand-600)] group-open:rotate-45 transition-transform">
                                    +
                                </span>
                            </summary>
                            <p className="text-sm text-[var(--ink-500)] mt-3 leading-7">{item.a}</p>
                        </details>
                    ))}
                </div>

                <p className="mt-10 text-center text-xs text-[var(--ink-500)]">
                    پس از ثبت‌نام و تأیید ایمیل، ۷ روز امکانات حرفه‌ای فعال می‌شود و بعد از آن پلن رایگان شما ادامه پیدا می‌کند.
                </p>
            </section>

            <Footer />
        </div>
    );
}
