import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import api, { pickError } from "@/lib/api";
import { toFarsiDigits } from "@/lib/jalali";
import "@/styles/auth-feedback.css";

export default function EmailConfirmation({ email, onEdit }) {
  const [seconds, setSeconds] = useState(60);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  const resend = async () => {
    setSending(true); setError(""); setMessage("");
    try {
      const { data } = await api.post("/auth/resend", { email });
      setMessage(data.message); setSeconds(60);
    } catch (failure) { setError(pickError(failure)); }
    finally { setSending(false); }
  };
  return <section className="auth-confirmation" aria-labelledby="confirmation-title">
    <div className="auth-confirmation-icon"><MailCheck size={28} aria-hidden="true" /></div>
    <span className="auth-step">مرحلهٔ ۲ از ۲ · تأیید ایمیل</span>
    <h1 id="confirmation-title" tabIndex={-1} autoFocus>ایمیلت را تأیید کن</h1>
    <p>لینک تأیید به <bdi className="auth-email" dir="ltr">{email}</bdi> ارسال شد. صندوق ورودی و پوشهٔ اسپم را بررسی کن و لینک را در همین مرورگر باز کن.</p>
    <p className="auth-note">حساب و ۷ روز استفادهٔ حرفه‌ای، بعد از تأیید ایمیل فعال می‌شوند.</p>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {message && <p role="status" className="auth-note">{message}</p>}
    <Button type="button" variant="outline" onClick={resend} disabled={sending || seconds > 0} className="auth-resend">
      <RefreshCw size={16} />{sending ? "در حال ارسال…" : seconds > 0 ? "ارسال دوباره تا " + toFarsiDigits(seconds) + " ثانیه" : "ارسال دوبارهٔ لینک"}
    </Button>
    <div className="auth-confirmation-links"><button type="button" onClick={onEdit}>اصلاح ایمیل</button><Link to="/login">ایمیلم تأیید شده؛ ورود</Link></div>
  </section>;
}
