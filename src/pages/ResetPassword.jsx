import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api, { pickError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { AuthShell, AuthSidePanel } from "./Login";
import "@/styles/auth-feedback.css";

export default function ResetPassword() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async event => {
    event.preventDefault(); if (busy) return;
    if (password.length < 6) { setError("رمز جدید باید حداقل ۶ کاراکتر باشد."); return; }
    if (password !== repeat) { setError("تکرار رمز با رمز جدید یکسان نیست."); return; }
    setBusy(true); setError("");
    try {
      await api.post("/auth/reset-password", { password });
      toast.success("رمز عبور با موفقیت تغییر کرد.");
      navigate("/dashboard", { replace: true });
    } catch (failure) { setError(pickError(failure)); }
    finally { setBusy(false); }
  };
  return <AuthShell side={<AuthSidePanel title="یک شروع امن." subtitle="رمز عبور تازه‌ای انتخاب کن و دوباره به کارهایت برگرد." bullets={[{ icon: ShieldCheck, text: "لینک بازیابی یک‌بارمصرف و زمان‌دار است" }]} />}>
    <div className="v3-auth-card auth-card">
      <div className="auth-card-heading"><h1>تنظیم رمز جدید</h1><p>رمزی انتخاب کن که در سایت‌های دیگر استفاده نمی‌کنی.</p></div>
      {loading ? <p role="status">در حال بررسی نشست…</p> : !user ? <div className="auth-confirmation"><p role="alert">ابتدا لینک بازیابی ایمیل را در همین مرورگر باز کن.</p><Link to="/forgot-password" className="auth-switch-link">درخواست لینک بازیابی تازه</Link></div> :
        <form onSubmit={submit} className="auth-form" data-testid="reset-form">
          {error && <p role="alert" className="auth-error">{error}</p>}
          <div><Label htmlFor="new-password">رمز جدید</Label><div className="auth-field">
            <Lock className="auth-field-icon" size={17} /><Input id="new-password" type={visible ? "text" : "password"} dir="ltr" className="auth-input auth-input-password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} minLength={6} required />
            <button type="button" className="auth-password-toggle" onClick={() => setVisible(value => !value)} aria-label={visible ? "پنهان کردن رمز" : "نمایش رمز"} aria-pressed={visible}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </div></div>
          <div><Label htmlFor="repeat-password">تکرار رمز جدید</Label><div className="auth-field"><Lock className="auth-field-icon" size={17} /><Input id="repeat-password" type={visible ? "text" : "password"} dir="ltr" className="auth-input" autoComplete="new-password" value={repeat} onChange={event => setRepeat(event.target.value)} minLength={6} required /></div></div>
          <Button type="submit" className="auth-submit" disabled={busy}>{busy ? "در حال ذخیره…" : "ذخیرهٔ رمز جدید"}</Button>
        </form>}
    </div>
  </AuthShell>;
}
