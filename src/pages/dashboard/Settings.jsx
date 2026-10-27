import React, { useRef, useState } from "react";
import { Phone, Mail, User, Settings as SettingsIcon, CheckCircle2, Sparkles, ShieldCheck, MessageCircle, ArrowLeft, Loader2, Save } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AccountAvatar from "@/components/AccountAvatar";
import SubscriptionProgress from "@/components/SubscriptionProgress";
import { useAuth } from "@/contexts/AuthContext";
import { toEnglishDigits, toFarsiDigits } from "@/lib/jalali";
import { PLAN_LABELS, TELEGRAM_SUPPORT_URL } from "@/lib/plans";
import "@/styles/account-settings.css";

function SectionHeading({ icon: Icon, title, description, tone = "" }) {
  return <div className="account-settings-section-heading"><span className={"account-settings-icon " + tone}><Icon size={20} aria-hidden="true" /></span><div><h2>{title}</h2><p>{description}</p></div></div>;
}

function errorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map(item => item.msg).filter(Boolean).join(" ") || "اطلاعات را بررسی و دوباره تلاش کن.";
  return "درخواست انجام نشد. اتصال را بررسی و دوباره تلاش کن.";
}

const normalizePhone = value => toEnglishDigits(value || "").replace(/[\s()-]/g, "").replace(/^00/, "+");

export default function Settings() {
  const { user, updateProfile, updatePhone } = useAuth();
  const [draftName, setDraftName] = useState(null);
  const [nameBusy, setNameBusy] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSaved, setNameSaved] = useState(false);
  const profileInFlight = useRef(false);
  const profileName = draftName ?? user?.name ?? "";
  const nameChanged = profileName.trim() !== (user?.name || "");
  const [draftPhone, setDraftPhone] = useState(null);
  const [phoneSaved, setPhoneSaved] = useState(false);
  const phoneValue = draftPhone ?? toFarsiDigits(user?.phone || "");
  const normalizedPhone = normalizePhone(phoneValue);
  const phoneChanged = normalizedPhone !== normalizePhone(user?.phone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const paid = ["pro", "business"].includes(user?.plan);

  const submitProfile = async (event) => {
    event.preventDefault();
    if (profileInFlight.current) return;
    const name = profileName.trim();
    if (!name || name.length > 120) {
      setNameError(!name ? "نام و نام خانوادگی را وارد کن." : "نام نباید بیشتر از ۱۲۰ کاراکتر باشد.");
      event.currentTarget.querySelector("input")?.focus();
      return;
    }
    if (!nameChanged) return;
    profileInFlight.current = true; setNameBusy(true); setNameError(""); setNameSaved(false);
    try {
      await updateProfile(name);
      setDraftName(null);
      setNameSaved(true);
    } catch (failure) {
      setNameError(errorMessage(failure));
    } finally { profileInFlight.current = false; setNameBusy(false); }
  };

  const submitPhone = async (event) => {
    event.preventDefault();
    if (inFlight.current) return;
    if (!/^(?:09[0-9]{9}|\+[1-9][0-9]{7,14})$/.test(normalizedPhone)) {
      setError("شماره موبایل معتبر وارد کن.");
      event.currentTarget.querySelector("input")?.focus();
      return;
    }
    if (!phoneChanged) return;
    inFlight.current = true; setBusy(true); setError(""); setPhoneSaved(false);
    try {
      await updatePhone(normalizedPhone);
      setDraftPhone(null);
      setPhoneSaved(true);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally { inFlight.current = false; setBusy(false); }
  };

  return (
    <div className="account-settings" dir="rtl">
      <header className="account-settings-heading">
        <div><span className="account-settings-eyebrow"><SettingsIcon size={15} aria-hidden="true" /> حساب وانیکس</span><h1>تنظیمات حساب</h1><p>اطلاعات شخصی، امنیت و اشتراک، در یک نگاه.</p></div>
        <Button asChild variant="outline"><Link to="/dashboard/plan"><Sparkles size={16} aria-hidden="true" /> پلن و امکانات</Link></Button>
      </header>

      <div className="account-settings-grid">
        <section className="account-settings-card" aria-label="اطلاعات حساب">
          <SectionHeading icon={User} title="اطلاعات حساب" description="نامی که در پنل نمایش داده می‌شود را ویرایش کن." />
          <div className="account-settings-profile">
            <AccountAvatar user={user} className="account-settings-avatar" />
            <div><strong>{user?.name || "حساب من"}</strong><span className={"account-settings-badge " + (paid ? "is-pro" : "")}><Sparkles size={13} aria-hidden="true" /> پلن {PLAN_LABELS[user?.plan] || "رایگان"}</span></div>
          </div>
          <dl className="account-settings-details">
            <div><dt><Mail size={15} aria-hidden="true" /> ایمیل</dt><dd dir="ltr">{user?.email || "—"}</dd></div>
          </dl>
          <form onSubmit={submitProfile} className="account-settings-profile-form" aria-label="ویرایش نام" aria-busy={nameBusy} noValidate>
            <div className="account-settings-field">
              <Label htmlFor="settings-name">نام و نام خانوادگی</Label>
              <Input id="settings-name" name="name" autoComplete="name" dir="auto" value={profileName} maxLength={120} disabled={nameBusy} onChange={(event) => { setDraftName(event.target.value); setNameError(""); setNameSaved(false); }} aria-invalid={Boolean(nameError)} aria-describedby={"settings-name-help" + (nameError ? " settings-name-error" : "")} required />
              <p id="settings-name-help" className="account-settings-field-help">می‌توانی نام دلخواهت را برای نمایش در پنل وارد کنی.</p>
            </div>
            {nameError && <p id="settings-name-error" className="account-settings-error" role="alert">{nameError}</p>}
            <div className="account-settings-card-actions">
              <Button type="submit" disabled={nameBusy || !nameChanged}>{nameBusy ? <Loader2 size={16} className="account-settings-spinner" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}{nameBusy ? "در حال ذخیره" : "ذخیره نام"}</Button>
              {nameChanged && <Button type="button" variant="ghost" disabled={nameBusy} onClick={() => { setDraftName(null); setNameError(""); setNameSaved(false); }}>انصراف</Button>}
              {nameSaved && <span className="account-settings-save-status" role="status"><CheckCircle2 size={16} aria-hidden="true" /> نام ذخیره شد.</span>}
            </div>
          </form>
        </section>

        <section className="account-settings-card account-settings-subscription" aria-label="وضعیت اشتراک">
          <SectionHeading icon={Sparkles} title={"پلن " + (PLAN_LABELS[user?.plan] || "رایگان")} description={user?.trial_active ? "دورهٔ آزمایشی حرفه‌ای شما فعال است." : "وضعیت اشتراک و زمان باقی‌ماندهٔ حسابت."} />
          <SubscriptionProgress user={user} />
          <div className="account-settings-card-actions"><Button asChild variant="outline"><Link to="/dashboard/plan">مشاهدهٔ امکانات <ArrowLeft size={15} aria-hidden="true" /></Link></Button><a href={TELEGRAM_SUPPORT_URL} target="_blank" rel="noreferrer">تمدید با پشتیبانی</a></div>
        </section>

        <section className="account-settings-card" aria-label="شماره موبایل">
          <SectionHeading icon={Phone} title="شماره موبایل" description="شمارهٔ تماس خود را ثبت یا ویرایش کن." tone="is-mint" />
          <form onSubmit={submitPhone} className="account-settings-phone-form" aria-label="ویرایش شماره موبایل" aria-busy={busy} noValidate>
            <div className="account-settings-field">
              <Label htmlFor="settings-phone">شماره موبایل</Label>
              <Input id="settings-phone" name="tel" type="tel" inputMode="tel" autoComplete="tel" value={phoneValue} onChange={(event) => { setDraftPhone(event.target.value); setError(""); setPhoneSaved(false); }} placeholder="۰۹۱۲۱۲۳۴۵۶۷" maxLength={50} dir="ltr" disabled={busy} aria-describedby={error ? "phone-error" : undefined} aria-invalid={Boolean(error)} required />
            </div>
            {error && <p id="phone-error" className="account-settings-error" role="alert">{error}</p>}
            <div className="account-settings-card-actions">
              <Button type="submit" disabled={busy || !phoneChanged}>{busy ? <Loader2 size={16} className="account-settings-spinner" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}{busy ? "در حال ذخیره" : "ذخیره شماره"}</Button>
              {phoneChanged && <Button type="button" variant="ghost" disabled={busy} onClick={() => { setDraftPhone(null); setError(""); setPhoneSaved(false); }}>انصراف</Button>}
              {phoneSaved && <span className="account-settings-save-status" role="status"><CheckCircle2 size={16} aria-hidden="true" /> شماره موبایل ذخیره شد.</span>}
            </div>
          </form>
        </section>

        <section className="account-settings-card" aria-label="امنیت حساب">
          <SectionHeading icon={ShieldCheck} title="امنیت حساب" description="دسترسی به حسابت را امن نگه دار." />
          <div className="account-settings-security"><span><ShieldCheck size={17} aria-hidden="true" /> حفاظت از رمز عبور</span><p>برای تغییر رمز، از مسیر بازیابی و ایمیل ثبت‌شدهٔ حسابت استفاده کن.</p></div>
          <div className="account-settings-card-actions"><Button asChild variant="outline"><Link to="/forgot-password">تغییر رمز عبور <ArrowLeft size={15} aria-hidden="true" /></Link></Button></div>
        </section>
      </div>
      <footer className="account-settings-help"><MessageCircle size={17} aria-hidden="true" /><span>برای مدیریت یا تمدید اشتراک به راهنمایی نیاز داری؟</span><a href={TELEGRAM_SUPPORT_URL} target="_blank" rel="noreferrer">گفت‌وگو با پشتیبانی <ArrowLeft size={14} aria-hidden="true" /></a></footer>
    </div>
  );
}
