import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Palette, Link2, CalendarDays, Wrench, BarChart3, Bell, ArrowLeft, RefreshCw, CheckCircle2, MessageCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_LABELS, TELEGRAM_SUPPORT_URL } from "@/lib/plans";
import SubscriptionProgress from "@/components/SubscriptionProgress";
import "@/styles/account-plan.css";

const TOOLS = [
  { title: "صفحه‌ساز کسب‌وکار", text: "هویت برند، گالری، راه‌های ارتباطی و پیش‌نمایش زنده.", to: "/dashboard/page", label: "ویرایش صفحه", icon: Palette, tone: "violet" },
  { title: "لینک‌های کوتاه", text: "آدرس دلخواه، QR قابل اشتراک، رهگیری UTM و خروجی CSV.", to: "/dashboard/links", label: "مدیریت لینک‌ها", icon: Link2, tone: "amber" },
  { title: "نوبت‌ها و مشتریان", text: "مشاهدهٔ رزروها، جزئیات مشتری و تغییر وضعیت نوبت.", to: "/dashboard/appointments", label: "مدیریت نوبت‌ها", icon: CalendarDays, tone: "mint" },
  { title: "خدمات و تعرفه‌ها", text: "تعریف خدمت، مدت زمان، هزینه و وضعیت فعال‌بودن.", to: "/dashboard/services", label: "مدیریت خدمات", icon: Wrench, tone: "rose" },
  { title: "آمار کسب‌وکار", text: "بازدید صفحه، کلیک لینک‌ها و روند نوبت‌های واقعی.", to: "/dashboard", label: "مشاهدهٔ آمار", icon: BarChart3, tone: "sky" },
  { title: "اعلان‌ها", text: "پیگیری پیام‌ها و اعلان‌های ثبت‌شده در حساب.", to: "/dashboard/notifications", label: "مشاهدهٔ اعلان‌ها", icon: Bell, tone: "violet" },
];

export default function Plan() {
  const { user, refresh } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const selected = new URLSearchParams(location.search).get("plan");
  const selectedLabel = PLAN_LABELS[selected];
  const planLabel = PLAN_LABELS[user?.plan] || "نامشخص";
  const paid = ["pro", "business"].includes(user?.plan);
  const recheck = async () => {
    setChecking(true); setError("");
    try { await refresh(); } catch { setError("وضعیت تازه دریافت نشد. اتصال را بررسی و دوباره تلاش کن."); }
    finally { setChecking(false); }
  };
  useEffect(() => {
    let alive = true;
    refresh().catch(() => { if (alive) setError("وضعیت تازه دریافت نشد. اتصال را بررسی و دوباره تلاش کن."); }).finally(() => { if (alive) setChecking(false); });
    return () => { alive = false; };
  }, [refresh]);
  return (
    <div className="account-plan" dir="rtl">
      <header className="account-plan-heading"><div><span className="account-plan-eyebrow"><Sparkles size={15} aria-hidden="true" /> حساب وانیکس</span><h1>پلن و امکانات</h1><p>وضعیت حسابت و ابزارهای آمادهٔ استفاده، یک‌جا.</p></div><Button type="button" variant="outline" disabled={checking} onClick={recheck} aria-busy={checking}><RefreshCw size={16} />{checking ? "در حال بررسی" : "به‌روزرسانی وضعیت"}</Button></header>
      {error && <div className="account-plan-error" role="alert"><AlertCircle size={17} />{error}</div>}
      <section className={`account-plan-status ${paid ? "is-pro" : ""}`} aria-label="وضعیت پلن حساب">
        <span className="account-plan-symbol"><Sparkles size={27} aria-hidden="true" /></span>
        <div className="account-plan-status-copy"><span>پلن فعلی شما</span><h2>{checking ? "در حال دریافت وضعیت" : planLabel}</h2>{!checking && <p>{user?.trial_active ? "دورهٔ آزمایشی حرفه‌ای فعال است." : paid ? "پلن حسابت فعال است؛ از ابزارهای زیر استفاده کن." : "پلن رایگان فعال است. درخواست ارتقا از پشتیبانی انجام می‌شود."}</p>}{!checking && <SubscriptionProgress user={user} />}</div>
        {!checking && !error && <span className="account-plan-active"><CheckCircle2 size={15} />{user?.trial_active ? "آزمایشی" : "فعال"}</span>}
      </section>
      {!checking && selectedLabel && selected !== user?.plan && <div className="account-plan-selection"><div><strong>پلن انتخاب‌شده: {selectedLabel}</strong><p>انتخاب تعرفه، پلن حسابت را خودکار تغییر نمی‌دهد. برای تغییر پلن با پشتیبانی هماهنگ کن.</p></div><Button asChild variant="outline"><a href={TELEGRAM_SUPPORT_URL} target="_blank" rel="noreferrer"><MessageCircle size={16} /> درخواست تغییر پلن</a></Button></div>}
      <div className="account-plan-tools-heading"><h2>ابزارهای حساب شما</h2><p>این میان‌برها به امکانات موجود پنل متصل‌اند.</p></div>
      <div className="account-plan-tools">{TOOLS.map(({ title, text, to, label, icon: Icon, tone }) => <article className="account-plan-tool" key={to}><span className={`account-plan-tool-icon is-${tone}`}><Icon size={21} aria-hidden="true" /></span><h3>{title}</h3><p>{text}</p><Link to={to}>{label}<ArrowLeft size={16} aria-hidden="true" /></Link></article>)}</div>
      <footer className="account-plan-support"><div><strong>تغییر یا تمدید پلن</strong><p>از طریق پشتیبانی تلگرام هماهنگ کن؛ وضعیت نهایی در همین صفحه نمایش داده می‌شود.</p></div><Button asChild><a href={TELEGRAM_SUPPORT_URL} target="_blank" rel="noreferrer"><MessageCircle size={16} /> پشتیبانی تلگرام</a></Button><Link to="/pricing">مقایسهٔ تعرفه‌ها</Link></footer>
    </div>
  );
}
