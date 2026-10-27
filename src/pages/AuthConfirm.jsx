import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthShell, AuthSidePanel } from "./Login";
import { useAuth } from "@/contexts/AuthContext";
import { pickError } from "@/lib/api";
import "@/styles/auth-feedback.css";

export default function AuthConfirm() {
  const [params] = useSearchParams();
  const { confirmEmail } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const code = params.get("code");
  const hash = params.get("token_hash");
  const recovery = params.get("flow") === "recovery" || params.get("type") === "recovery";
  const valid = Boolean(code || hash) && !params.has("error");
  const submit = async () => {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const input = code ? { code } : { token_hash: hash, type: recovery ? "recovery" : "email" };
      const user = await confirmEmail(input);
      navigate(recovery ? "/reset-password" : user.role === "admin" ? "/admin" : "/dashboard/page", { replace: true });
    } catch (failure) { setError(pickError(failure)); }
    finally { setBusy(false); }
  };
  return <AuthShell side={<AuthSidePanel title="یک قدم تا شروع." subtitle="ایمیلت را تأیید کن تا با خیال راحت وارد حساب وانیکس شوی." bullets={[{ icon: ShieldCheck, text: "لینک یک‌بارمصرف و نشست امن" }]} />}>
    <div className="v3-auth-card auth-card"><section className="auth-confirmation" aria-labelledby="confirm-heading">
      <div className="auth-confirmation-icon"><MailCheck size={28} /></div>
      <h1 id="confirm-heading">{recovery ? "ادامهٔ بازیابی رمز" : "تأیید ایمیل"}</h1>
      <p>{valid ? "برای تکمیل تأیید و ورود به حساب، دکمهٔ زیر را بزن." : "لینک معتبر نیست یا منقضی شده است؛ لینک تازه درخواست کن."}</p>
      {error && <p role="alert" className="auth-error">{error}</p>}
      {valid && <Button className="auth-submit" disabled={busy} onClick={submit}>{busy ? "در حال تأیید…" : recovery ? "تأیید و تنظیم رمز جدید" : "تأیید و ورود به حساب"}</Button>}
      <div className="auth-confirmation-links"><Link to={recovery ? "/forgot-password" : "/signup"}>درخواست لینک تازه</Link><Link to="/login">بازگشت به ورود</Link></div>
    </section></div>
  </AuthShell>;
}
