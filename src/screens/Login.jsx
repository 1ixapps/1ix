import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, LogIn, ArrowLeft, Eye, EyeOff, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Brand from "@/components/Brand";
import BuilderCharacter from "@/components/BuilderCharacter";
import GoogleSignIn from "@/components/GoogleSignIn";
import { googleAuthErrors } from "@/lib/googleAuth";
import { toFarsiDigits } from "@/lib/jalali";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { safeAuthReturn } from "@/lib/plans";
import { pickError } from "@/lib/api";
import "@/styles/auth-feedback.css";

export function AuthSidePanel({ title, subtitle, bullets = [] }) {
  return (
    <aside className="auth-brand-panel">
      <Brand />
      <div className="auth-brand-copy">
        <span className="auth-platform-badge"><Sparkles size={15} aria-hidden="true" /> پلتفرم کسب‌وکار آنلاین</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <ul className="auth-brand-list">{bullets.map((item) => <li key={item.text}><span className="auth-benefit-icon"><item.icon size={18} aria-hidden="true" /></span><span className="auth-benefit-text">{item.text}</span></li>)}</ul>
      </div>
      <div className="auth-brand-footer"><BuilderCharacter /><div><strong>یک صفحه، کلی امکان.</strong><p>با سلیقه‌ی خودت بسازش.</p></div></div>
    </aside>
  );
}

export function AuthShell({ children, side }) {
  return (
    <div className="v3-auth-shell auth-shell" dir="rtl">
      {side}
      <main className="auth-main">
        <div className="auth-mobile-brand"><Brand /><span className="auth-platform-badge">پلتفرم کسب‌وکار آنلاین</span></div>
        <div className="auth-main-card">{children}</div>
        <p className="auth-copyright" dir="ltr"><span>© {toFarsiDigits(new Date().getFullYear())}</span><bdi>1ix.ir</bdi></p>
      </main>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [googleBusy, setGoogleBusy] = useState(false);
  const errorKey = new URLSearchParams(location.search).get("oauth_error");
  const oauthError = Object.prototype.hasOwnProperty.call(googleAuthErrors, errorKey) ? googleAuthErrors[errorKey] : "";
  const submit = async (event) => {
    event.preventDefault();
    if (submitting || googleBusy) return;
    if (!email || !password) { toast.error("ایمیل و رمز عبور را وارد کن."); return; }
    setSubmitting(true); setError("");
    try {
      const user = await login(email, password);
      toast.success("خوش آمدی " + user.name);
      navigate(safeAuthReturn(location.state?.from, user.role === "admin" ? "/admin" : "/dashboard"));
    } catch (error) {
      setError(pickError(error));
    } finally { setSubmitting(false); }
  };
  return (
    <AuthShell side={<AuthSidePanel title="خوش برگشتی." subtitle="صفحه، لینک‌ها و نوبت‌های کسب‌وکارت، همین‌جا منتظرت هستند." bullets={[
      { icon: Zap, text: "دسترسی ساده به کارهای روزمره" },
      { icon: ShieldCheck, text: "مدیریت اطلاعات در حساب شخصی خودت" },
      { icon: Sparkles, text: "صفحه‌سازی، لینک و نوبت‌دهی در یک پنل" },
    ]} />}>
      <div className="v3-auth-card auth-card">
        <div className="auth-card-heading"><h1>ورود به حساب</h1><p>حساب نداری؟ <Link to="/signup" data-testid="login-to-signup">ساخت حساب</Link></p></div>
        {oauthError && <p role="alert" className="auth-error">{oauthError}</p>}
        <GoogleSignIn next={safeAuthReturn(location.state?.from, "")} disabled={submitting} onBusyChange={setGoogleBusy} />
        <form onSubmit={submit} className="auth-form" data-testid="login-form">
          {error && <p role="alert" className="auth-error">{error} <Link to="/signup">تأیید ایمیل</Link></p>}
          <div><Label htmlFor="email">ایمیل</Label><div className="auth-field"><Mail className="auth-field-icon" size={17} /><Input id="email" type="email" dir="ltr" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="auth-input" data-testid="login-email-input" autoComplete="email" required /></div></div>
          <div><div className="auth-label-row"><Label htmlFor="password">رمز عبور</Label><Link to="/forgot-password">رمزت را فراموش کردی؟</Link></div>
            <div className="auth-field"><Lock className="auth-field-icon" size={17} /><Input id="password" dir="ltr" type={showPass ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} className="auth-input auth-input-password" data-testid="login-password-input" autoComplete="current-password" required />
              <button type="button" className="auth-password-toggle" onClick={() => setShowPass(!showPass)} aria-label={showPass ? "پنهان کردن رمز" : "نمایش رمز"} aria-pressed={showPass}>{showPass ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
          </div>
          <Button type="submit" disabled={submitting || googleBusy} className="auth-submit" data-testid="login-submit-btn"><LogIn size={16} />{submitting ? "در حال ورود…" : "ورود به حساب"}{!submitting && <ArrowLeft size={16} />}</Button>
        </form>
        <Button asChild variant="ghost" className="auth-back"><Link to="/">بازگشت به صفحه‌ی اصلی</Link></Button>
      </div>
    </AuthShell>
  );
}
