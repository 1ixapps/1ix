import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Send, ArrowLeft, MailCheck, ShieldCheck, KeyRound, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api, { pickError } from "@/lib/api";
import { AuthShell, AuthSidePanel } from "@/screens/Login";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post("/auth/forgot-password", { email });
            setSent(true);
            toast.success("اگر این ایمیل ثبت شده باشد، لینک بازیابی ارسال می‌شود");
        } catch (e) {
            toast.error(pickError(e));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AuthShell
            side={
                <AuthSidePanel
                    title="بازیابی رمز عبور"
                    subtitle="نگران نباشید — برای بازنشانی رمز کافیست ایمیل خود را وارد کنید تا یک لینک امن برایتان ارسال شود."
                    bullets={[
                        { icon: ShieldCheck, text: "لینک بازیابی فقط یک‌بار و در زمان محدود معتبر است" },
                        { icon: KeyRound,    text: "رمز قدیمی شما همچنان فعال است تا رمز جدید را ثبت کنید" },
                        { icon: Clock,       text: "معمولاً چند ثانیه برای دریافت ایمیل صبر کنید" },
                    ]}
                />
            }
        >
            <div className="surface-elev p-7 sm:p-8 rounded-3xl">
                {sent ? (
                    <div className="text-center py-4">
                        <div className="mx-auto grid place-items-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 ring-4 ring-emerald-100 mb-5">
                            <MailCheck className="w-7 h-7" />
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-900)] mb-2">ایمیل ارسال شد</h1>
                        <p className="text-sm text-[var(--ink-500)] leading-7 max-w-sm mx-auto">
                            اگر این ایمیل در سیستم ثبت شده باشد، یک لینک بازیابی ارسال می‌شود. صندوق ورودی و پوشه اسپم را بررسی کنید.
                        </p>
                        <p className="text-[11px] text-[var(--ink-300)] mt-3">
                            لینک را در همین مرورگر باز کنید و رمز تازه‌ای برای حسابتان انتخاب کنید.
                        </p>
                        <Link to="/login" className="inline-block mt-6">
                            <Button variant="outline" className="rounded-xl h-11 px-5 border-[var(--line-strong)]">
                                <ArrowLeft className="w-4 h-4 ms-2" />
                                بازگشت به ورود
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="mb-6">
                            <span className="chip mb-3"><KeyRound className="w-3.5 h-3.5" /> فراموشی رمز</span>
                            <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-[var(--ink-900)]">بازیابی رمز عبور</h1>
                            <p className="text-sm text-[var(--ink-500)] mt-1.5">
                                ایمیل خود را وارد کنید تا لینک بازیابی برایتان ارسال شود.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-4" data-testid="forgot-form">
                            <div>
                                <Label htmlFor="email" className="text-[13px] font-semibold text-[var(--ink-700)]">ایمیل</Label>
                                <div className="relative mt-1.5">
                                    <Mail className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-300)]" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        dir="ltr"
                                        className="pe-10 text-start h-11 rounded-xl border-[var(--line-strong)] bg-white focus-visible:ring-[var(--brand-500)]/40"
                                        data-testid="forgot-email-input"
                                        required
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full h-11 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-semibold shadow-[var(--shadow-glow)]"
                                data-testid="forgot-submit-btn"
                            >
                                <Send className="w-4 h-4 ms-2" />
                                {submitting ? "در حال ارسال…" : "ارسال لینک بازیابی"}
                            </Button>
                            <p className="text-center text-sm text-[var(--ink-500)]">
                                <Link to="/login" className="font-semibold text-[var(--brand-700)] hover:underline">
                                    بازگشت به ورود
                                </Link>
                            </p>
                        </form>
                    </>
                )}
            </div>
        </AuthShell>
    );
}
