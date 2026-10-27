import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowDownLeft, ArrowUpLeft, BriefcaseBusiness, CalendarDays, Check, CheckCheck, ChevronLeft, Clock3, LayoutTemplate, Link2, Palette, Scissors, Sparkles, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import NavbarPremium from "@/components/NavbarPremium";
import FooterPremium from "@/components/FooterPremium";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import BuilderCharacter from "@/components/BuilderCharacter";
import SeoHead from "@/components/SeoHead";
import PricingPlanCard from "@/components/PricingPlanCard";
import "@/styles/home-creative.css";
import { absoluteUrl, HOME_TITLE, HOME_DESCRIPTION, siteStructuredData } from "../../shared/seo.mjs";

const features = [
    { id: "pages", icon: Palette, number: "۰۱", title: "یک صفحه، به سلیقهٔ تو.", text: "خدمات، نمونه‌کارها و راه‌های ارتباطی؛ همه با رنگ و هویت کسب‌وکارت.", tone: "coral", action: "ساخت صفحه", path: "/dashboard/page" },
    { id: "links", icon: Link2, number: "۰۲", title: "کوتاه کن. به اشتراک بگذار.", text: "یک لینک خوش‌دست برای صفحه، خدمات و کمپین‌هایت؛ با آمار کلیک واقعی.", tone: "yellow", action: "ساخت لینک کوتاه", path: "/dashboard/links" },
    { id: "booking", icon: CalendarDays, number: "۰۳", title: "وقت‌ها، سر جای خودشان.", text: "رزرو بر اساس خدمات و ساعات کاری تو؛ مدیریت همهٔ نوبت‌ها در یک پنل.", tone: "mint", action: "مدیریت نوبت‌ها", path: "/dashboard/appointments" },
];

const useCases = [
    { id: "clinic", icon: Stethoscope, title: "کلینیک و مطب", name: "کلینیک شما", headline: "اعتماد، از همان نگاه اول.", text: "تخصصت را معرفی کن و مسیر انتخاب خدمت تا رزرو را برای مراجعه‌کننده روشن نگه دار.", items: ["معرفی تخصص و خدمات", "راه‌های ارتباطی و نشانی", "نوبت‌دهی بر اساس ساعات کاری"], services: ["مشاوره", "ویزیت", "خدمات تخصصی"], tone: "lilac" },
    { id: "beauty", icon: Scissors, title: "سالن زیبایی", name: "سالن شما", headline: "سلیقه‌ات را قبل از قرار نشان بده.", text: "نمونه‌کارها و خدماتت را یکجا بچین تا مشتری با خیال راحت انتخاب کند.", items: ["گالری نمونه‌کار", "معرفی خدمات و تعرفه‌ها", "لینک رزرو برای شبکه‌های اجتماعی"], services: ["رنگ و لایت", "کوتاهی", "مراقبت مو"], tone: "coral" },
    { id: "nail", icon: Sparkles, title: "ناخن و میکاپ", name: "استودیوی شما", headline: "جزئیات کارت، دیده می‌شوند.", text: "به نمونه‌کارهایت فضای بیشتری بده و راه ارتباط و رزرو را دم دست بگذار.", items: ["گالری سبک‌ها و نمونه‌کارها", "قیمت و مدت خدمات", "برنامهٔ کاری مشخص"], services: ["طراحی ناخن", "میکاپ", "ترمیم"], tone: "yellow" },
    { id: "services", icon: BriefcaseBusiness, title: "خدمات تخصصی", name: "کسب‌وکار شما", headline: "حرفه‌ای معرفی شو. ساده در دسترس باش.", text: "از مشاوره تا خدمات حضوری، صفحه‌ای داشته باش که مشتری بداند کجا شروع کند.", items: ["معرفی تجربه و خدمات", "لینک‌های تماس و ارتباط", "مدیریت قرارهای کاری"], services: ["مشاوره", "جلسهٔ حضوری", "خدمات شما"], tone: "mint" },
];

const faqs = [
    { q: "برای ساخت صفحه دانش فنی لازم است؟", a: "نه. اطلاعات کسب‌وکار را وارد می‌کنی، ظاهر را انتخاب می‌کنی و نتیجه را در پیش‌نمایش می‌بینی." },
    { q: "نوبت‌دهی با ساعات کاری هماهنگ است؟", a: "بله. زمان‌های قابل رزرو از خدمات و ساعات کاری خودت ساخته می‌شوند؛ مشتری فقط از زمان‌های مجاز انتخاب می‌کند." },
    { q: "بعداً می‌توانم صفحه را تغییر بدهم؟", a: "بله. محتوا، خدمات، لینک‌ها، ظاهر و تنظیمات رزرو از داشبورد قابل ویرایش‌اند." },
    { q: "بعد از دورهٔ آزمایشی چه می‌شود؟", a: "بعد از تأیید ایمیل، ۷ روز امکانات حرفه‌ای داری. با پایان این دوره، پلن رایگان فعال می‌ماند؛ برای ادامهٔ امکانات حرفه‌ای می‌توانی از طریق پشتیبانی تمدید کنی." },
];

function ProductVisual({ kind }) {
    if (kind === "pages") return <div className="home-page-art" aria-hidden="true">
        <div className="home-art-browser-bar"><span /><span /><span /><i /></div>
        <div className="home-art-cover"><span className="home-art-cover-shape" /><Palette size={25} /></div>
        <div className="home-art-page-body"><div className="home-art-avatar"><Sparkles size={25} /></div><strong>کسب‌وکار شما</strong><span className="home-art-line" /><div className="home-art-page-tiles"><span><LayoutTemplate size={18} /> خدمات</span><span><Palette size={18} /> نمونه‌کار</span><span><CalendarDays size={18} /> نوبت‌دهی</span></div></div>
        <span className="home-art-palette"><i /><i /><i /><i /></span>
    </div>;
    if (kind === "links") return <div className="home-link-art" aria-hidden="true"><span className="home-link-path"><i /><i /><i /></span><div className="home-link-token"><Link2 size={21} /><span dir="ltr">1ix.ir/your-link</span><ArrowUpLeft size={19} /></div><span className="home-art-caption">یک آدرس کوتاه، برای مسیرهای بیشتر</span></div>;
    return <div className="home-booking-art" aria-hidden="true"><div className="home-art-calendar"><CalendarDays size={25} /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div><div><span className="home-booking-mini-label"><Clock3 size={15} /> زمان‌بندی با تو</span><strong>رزرو، هماهنگ با کارت.</strong><span className="home-art-caption">خدمات + ساعات کاری</span></div></div>;
}

function HeroScene() {
    return <figure className="home-hero-scene" aria-label="وانی؛ همراه صفحه‌سازی وانیکس">
        <div className="home-scene-bar"><span className="home-scene-dots" aria-hidden="true"><i /><i /><i /></span><span>جای ایده‌های تو</span><Sparkles size={17} aria-hidden="true" /></div>
        <div className="home-scene-stage">
            <span className="home-scene-label"><span aria-hidden="true" /> کمی سلیقه. کلی امکان.</span>
            <svg className="home-scene-orbit" viewBox="0 0 480 390" fill="none" aria-hidden="true"><ellipse cx="240" cy="206" rx="198" ry="132" stroke="currentColor" strokeDasharray="5 8" transform="rotate(-15 240 206)" /><path d="m65 245-9 18 20-3M410 145l10-18-21 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <BuilderCharacter decorative={false} className="home-hero-wani" />
            <span className="home-scene-sticker is-page"><Palette size={18} aria-hidden="true" /> به رنگ خودت</span>
            <span className="home-scene-sticker is-booking"><CalendarDays size={18} aria-hidden="true" /> وقت‌ها مرتب</span>
            <span className="home-scene-star" aria-hidden="true"><Sparkles size={30} strokeWidth={1.5} /></span>
        </div>
        <figcaption><div><strong>وانی؛ همراه ساختن تو.</strong><span>از اولین قدم تا آماده‌شدن صفحه.</span></div><a href="#product" aria-label="آشنایی با امکانات وانیکس"><ArrowDownLeft size={23} aria-hidden="true" /></a></figcaption>
    </figure>;
}

function IndustryShowcase({ startPath }) {
    const [selected, setSelected] = useState("clinic");
    const current = useCases.find(item => item.id === selected);
    const Icon = current.icon;
    return <section id="use-cases" className="home-section home-industries" aria-labelledby="home-industries-heading">
        <div className="v3-container">
            <div className="home-section-heading"><div><span className="home-eyebrow">برای کاری که تو می‌کنی</span><h2 id="home-industries-heading">کسب‌وکارها فرق دارند.<br /><span>صفحه‌ها هم باید فرق کنند.</span></h2></div><p>از مطب تا استودیو؛ محتوای صفحه را با نیاز کسب‌وکارت بچین.</p></div>
            <div className="home-industry-picker" role="group" aria-label="انتخاب نوع کسب‌وکار">{useCases.map(item => <button key={item.id} type="button" aria-pressed={selected === item.id} aria-controls="home-industry-detail" onClick={() => setSelected(item.id)}><item.icon size={19} aria-hidden="true" />{item.title}{selected === item.id && <Check size={16} aria-hidden="true" />}</button>)}</div>
            <div id="home-industry-detail" className={"home-industry-detail is-" + current.tone} aria-live="polite" aria-atomic="true">
                <div className="home-industry-copy"><span className="home-industry-kicker"><Icon size={19} aria-hidden="true" />{current.title}</span><h3>{current.headline}</h3><p>{current.text}</p><ul>{current.items.map(item => <li key={item}><CheckCheck size={17} aria-hidden="true" />{item}</li>)}</ul><Link to={startPath} className="home-text-link">صفحهٔ کسب‌وکارت را بساز <ArrowLeft size={17} aria-hidden="true" /></Link></div>
                <figure className="home-industry-example"><figcaption>نمونهٔ چیدمان محتوا</figcaption><div className="home-example-card"><div className="home-example-cover"><span /><Icon size={32} strokeWidth={1.5} aria-hidden="true" /></div><div className="home-example-body"><span className="home-example-avatar"><Icon size={24} aria-hidden="true" /></span><h4>{current.name}</h4><p>معرفی، خدمات و راه‌های ارتباطی</p><div className="home-example-services">{current.services.map((service, index) => <div key={service}><span>{service}</span><span aria-hidden="true">{"۰" + (index + 1).toLocaleString("fa-IR")}</span></div>)}</div><span className="home-example-booking"><CalendarDays size={16} aria-hidden="true" /> امکان نوبت‌دهی آنلاین</span></div></div></figure>
            </div>
        </div>
    </section>;
}

export default function HomeRedesign({ initialPlans } = {}) {
    const { user } = useAuth() || {};
    const startPath = user ? "/dashboard/page" : "/signup";
    const [plans, setPlans] = useState(initialPlans || []);
    const [plansState, setPlansState] = useState(initialPlans ? "ready" : "loading");
    const pendingPlans = useRef(null);
    useEffect(() => {
        if (initialPlans) return;
        let active = true;
        const request = pendingPlans.current || api.get("/public/plans");
        pendingPlans.current = request;
        request.then(({ data }) => { if (active) { setPlans(Array.isArray(data) ? data : []); setPlansState("ready"); } })
            .catch(() => { if (active) setPlansState("error"); })
            .finally(() => { if (pendingPlans.current === request) pendingPlans.current = null; });
        return () => { active = false; };
    }, [initialPlans]);

    return <div className="v3-site home-creative min-h-screen" dir="rtl">
        <SeoHead title={HOME_TITLE} description={HOME_DESCRIPTION} canonical={absoluteUrl("/")} structuredData={siteStructuredData()} />
        <a href="#home-main" className="home-skip-link">رفتن به محتوای اصلی</a>
        <NavbarPremium />
        <main id="home-main" tabIndex={-1}>
            <section className="home-hero" aria-labelledby="home-hero-heading"><div className="v3-container">
                <div className="home-hero-grid">
                    <div className="home-hero-copy"><span className="home-eyebrow"><span className="home-eyebrow-dot" /> برای کسب‌وکار تو، با سلیقهٔ تو</span><h1 id="home-hero-heading">کسب‌وکارت،<br /><span className="home-headline-mark">یک لینک جلوتر.</span></h1><p className="home-hero-description">صفحهٔ حرفه‌ای، لینک کوتاه و نوبت‌دهی آنلاین؛<br className="home-desktop-break" /> با سایت‌ساز فارسی وانیکس، همه در یک جا.</p><div className="home-hero-actions"><Button asChild className="v3-btn-primary"><Link to={startPath}>{user ? "ادامهٔ ساخت صفحه" : "ساخت صفحه رایگان"}<ArrowLeft size={18} aria-hidden="true" /></Link></Button><Button asChild variant="outline" className="v3-btn-secondary"><a href="#product">کشف امکانات <ArrowDownLeft size={18} aria-hidden="true" /></a></Button></div><div className="home-hero-notes"><span><Check size={15} aria-hidden="true" /> بدون نیاز به کدنویسی</span><span><Sparkles size={15} aria-hidden="true" /> ۷ روز امکانات حرفه‌ای برای شروع</span></div></div>
                    <HeroScene />
                </div>
                <nav className="home-product-path" aria-label="سه قابلیت وانیکس">{features.map(item => <a key={item.id} href={"#feature-" + item.id}><span className={"home-path-icon is-" + item.tone}><item.icon size={20} aria-hidden="true" /></span><span><small>{item.number}</small><strong>{item.id === "pages" ? "صفحه‌ات را بساز" : item.id === "links" ? "لینکت را بده" : "نوبت‌ها را مدیریت کن"}</strong></span><ChevronLeft size={18} aria-hidden="true" /></a>)}</nav>
            </div></section>

            <section id="product" className="home-section home-product" aria-labelledby="home-product-heading"><div className="v3-container">
                <div className="home-section-heading"><div><span className="home-eyebrow">کمتر پراکنده. بیشتر منسجم.</span><h2 id="home-product-heading">سه ابزار.<br /><span className="home-heading-underline">یک حضور حرفه‌ای.</span></h2></div><p>معرفی شو، به اشتراک بگذار، قرارها را مدیریت کن.<br />همه از همان حسابی که ساختی.</p></div>
                <div className="home-feature-grid">{features.map(item => <article id={"feature-" + item.id} key={item.id} className={"home-feature-card is-" + item.tone}><div className="home-feature-top"><span className="home-feature-icon"><item.icon size={22} aria-hidden="true" /></span><span>{item.number}</span></div><ProductVisual kind={item.id} /><div className="home-feature-copy"><h3>{item.title}</h3><p>{item.text}</p><Link to={user ? item.path : "/signup"} className="home-text-link">{item.action}<ArrowLeft size={17} aria-hidden="true" /></Link></div></article>)}</div>
            </div></section>

            <IndustryShowcase startPath={startPath} />

            <section className="home-flow" aria-labelledby="home-flow-heading"><div className="v3-container home-flow-inner"><div><span className="home-eyebrow">از اینجا شروع می‌شود</span><h2 id="home-flow-heading">سه قدم تا<br />صفحهٔ خودت.</h2><ArrowDownLeft className="home-flow-arrow" size={48} strokeWidth={1.25} aria-hidden="true" /></div><ol>{[{ title: "خودت را معرفی کن", text: "نام، اطلاعات و راه‌های ارتباطی کسب‌وکارت." }, { title: "رنگ خودت را اضافه کن", text: "ظاهر صفحه، خدمات، نمونه‌کارها و ساعات کاری." }, { title: "لینکت را به دنیا بده", text: "صفحه را منتشر کن و در دسترس مشتری‌ها باش." }].map((item, index) => <li key={item.title}><span>{"۰" + (index + 1).toLocaleString("fa-IR")}</span><div><h3>{item.title}</h3><p>{item.text}</p></div><ArrowLeft size={19} aria-hidden="true" /></li>)}</ol></div></section>

            <section id="pricing" className="home-section home-pricing" aria-labelledby="home-pricing-heading"><div className="v3-container">
                <div className="home-section-heading"><div><span className="home-eyebrow">تعرفه‌های وانیکس</span><h2 id="home-pricing-heading">ساده شروع کن.<br /><span>با خیال راحت رشد کن.</span></h2></div><Link to="/pricing" className="home-text-link">مقایسهٔ کامل پلن‌ها <ArrowLeft size={17} aria-hidden="true" /></Link></div>
                {plansState === "loading" ? <div className="home-plan-skeletons" role="status" aria-label="در حال دریافت تعرفه‌ها">{[0, 1, 2].map(item => <div key={item} />)}</div> : plans.length > 0 ? <div className="oneix-plan-grid">{plans.slice(0, 3).map(plan => <PricingPlanCard key={plan.id} plan={plan} compact />)}</div> : <p className="home-pricing-fallback">برای مشاهدهٔ تعرفه‌ها و مقایسهٔ امکانات، <Link to="/pricing">صفحهٔ پلن‌ها</Link> را ببین.</p>}
            </div></section>

            <section id="faq" className="home-section home-faq" aria-labelledby="home-faq-heading"><div className="v3-container home-faq-grid"><div className="home-section-heading"><div><span className="home-eyebrow">اگر هنوز سؤالی مانده</span><h2 id="home-faq-heading">جواب‌ها،<br /><span>کوتاه و روشن.</span></h2></div><p>چیزهایی که قبل از اولین قدم بد نیست بدانی.</p></div><Accordion type="single" collapsible>{faqs.map((item, index) => <AccordionItem key={item.q} value={"faq-" + index}><AccordionTrigger>{item.q}</AccordionTrigger><AccordionContent>{item.a}</AccordionContent></AccordionItem>)}</Accordion></div></section>

            <section className="home-final" aria-labelledby="home-final-heading"><div className="v3-container"><div className="home-final-inner"><BuilderCharacter className="home-final-character" /><div><span className="home-eyebrow">حالا نوبت توست</span><h2 id="home-final-heading">ایده‌اش با تو.<br />شروعش با وانیکس.</h2></div><div className="home-final-action"><Button asChild className="v3-btn-dark"><Link to={startPath}>{user ? "رفتن به صفحه‌ساز" : "صفحه‌ام را می‌سازم"} <ArrowLeft size={19} aria-hidden="true" /></Link></Button><span>یک صفحه. کلی امکان.</span></div></div></div></section>
        </main>
        <FooterPremium />
    </div>;
}
