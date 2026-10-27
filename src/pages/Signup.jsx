import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, UserPlus, Eye, EyeOff, ArrowLeft, Zap, ShieldCheck, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AuthShell, AuthSidePanel } from "@/pages/Login";
import EmailConfirmation from "@/components/EmailConfirmation";
import { pickError } from "@/lib/api";

function fieldError(key, value) {
    if (key === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : "ایمیل معتبر وارد کن.";
    if (value.length < 6) return "رمز عبور باید حداقل ۶ کاراکتر باشد.";
    const bytes = new Blob([value]).size;
    return bytes > 72 ? "رمز عبور طولانی است؛ حداکثر ۷۲ بایت مجاز است." : "";
}

function passwordStrength(p) {
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p) || /[^\w\s]/.test(p)) score++;
    if (/\d/.test(p) && /[a-zA-Z]/.test(p)) score++;
    return Math.min(score, 4);
}

const STRENGTH = [
    { label: "خیلی ضعیف", color: "bg-rose-500",    width: "w-1/4" },
    { label: "ضعیف",       color: "bg-rose-400",    width: "w-2/4" },
    { label: "متوسط",      color: "bg-amber-500",   width: "w-3/4" },
    { label: "قوی",        color: "bg-emerald-500", width: "w-full" },
    { label: "خیلی قوی",   color: "bg-emerald-600", width: "w-full" },
];

export default function Signup() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [showPass, setShowPass] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [confirmationEmail, setConfirmationEmail] = useState("");
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
    const strength = useMemo(() => passwordStrength(form.password), [form.password]);
    const s = STRENGTH[strength];

    const submit = async (event) => {
        event.preventDefault();
        if (submitting) return;
        const errors = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, fieldError(key, value)]).filter(([, message]) => message));
        setFieldErrors(errors); setError("");
        if (Object.keys(errors).length) { document.getElementById(Object.keys(errors)[0])?.focus(); return; }
        setSubmitting(true);
        try {
            const result = await register(form.email.trim().toLowerCase(), form.password);
            if (result?.confirmation_required) {
                setConfirmationEmail(result.email || form.email.trim().toLowerCase());
                setForm(value => ({ ...value, password: "" }));
            } else {
                toast.success("حساب آماده است.");
                navigate("/dashboard/page");
            }
        } catch (failure) {
            const detail = failure?.response?.data?.detail;
            if (Array.isArray(detail)) {
                const fields = Object.fromEntries(detail.filter(item => ["email","password"].includes(item.loc?.[1])).map(item => [item.loc[1], item.msg]));
                setFieldErrors(fields);
                document.getElementById(Object.keys(fields)[0])?.focus();
            }
            setError(pickError(failure));
        } finally { setSubmitting(false); }
    };

    return (
        <AuthShell
            side={
                <AuthSidePanel
                    title="کسب‌وکارتان را در چند دقیقه آنلاین کنید"
                    subtitle="۷ روز امکانات حرفه‌ای را بدون کارت اعتباری امتحان کنید؛ بعد از آن پلن رایگان برای همیشه فعال می‌ماند."
                    bullets={[
                        { icon: Zap,         text: "شروع سریع با قالب‌های آماده‌ی کسب‌وکار" },
                        { icon: Layers,      text: "صفحه شخصی + گالری + خدمات + ساعت کاری" },
                        { icon: ShieldCheck, text: "بدون نیاز به کارت اعتباری و بدون تعهد" },
                    ]}
                />
            }
        >
            <div className="v3-auth-card auth-card">
                {confirmationEmail ? <EmailConfirmation email={confirmationEmail} onEdit={() => { setConfirmationEmail(""); setError(""); }} /> : <>
                <div className="auth-card-heading">
                    <h1 className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-[var(--ink-900)]">ساخت حساب کاربری</h1>
                    <p className="text-sm text-[var(--ink-500)] mt-1.5">
                        قبلاً حساب دارید؟{" "}
                        <Link to="/login" className="auth-switch-link font-semibold text-[var(--brand-700)] hover:underline" data-testid="signup-to-login">
                            ورود
                        </Link>
                    </p>
                </div>

                <form onSubmit={submit} className="auth-form" data-testid="signup-form" noValidate>
                    <span className="auth-step">مرحلهٔ ۱ از ۲ · اطلاعات حساب</span>
                    {error && <p className="auth-error" role="alert">{error}</p>}
                    <div>
                        <Label htmlFor="email" className="text-[13px] font-semibold text-[var(--ink-700)]">ایمیل</Label>
                        {fieldErrors.email && <span id="email-error" className="auth-field-error">{fieldErrors.email}</span>}
                        <div className="auth-field">
                            <Mail className="auth-field-icon" size={18} aria-hidden="true" />
                            <Input
                                id="email"
                                aria-invalid={Boolean(fieldErrors.email)}
                                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                                type="email"
                                value={form.email}
                                onChange={set("email")}
                                placeholder="you@example.com"
                                dir="ltr"
                                className="auth-input"
                                data-testid="signup-email-input"
                                onBlur={() => setFieldErrors(value => ({ ...value, email: fieldError("email", form.email) }))}
                                autoComplete="email"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="password" className="text-[13px] font-semibold text-[var(--ink-700)]">رمز عبور</Label>
                        {fieldErrors.password && <span id="password-error" className="auth-field-error">{fieldErrors.password}</span>}
                        <div className="auth-field">
                            <Lock className="auth-field-icon" size={18} aria-hidden="true" />
                            <Input
                                id="password"
                                aria-invalid={Boolean(fieldErrors.password)}
                                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                                dir="ltr"
                                type={showPass ? "text" : "password"}
                                value={form.password}
                                onChange={set("password")}
                                className="auth-input auth-input-password"
                                data-testid="signup-password-input"
                                onBlur={() => setFieldErrors(value => ({ ...value, password: fieldError("password", form.password) }))}
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass((s) => !s)}
                                className="auth-password-toggle"
                                aria-pressed={showPass}
                                aria-label={showPass ? "پنهان کردن رمز" : "نمایش رمز"}
                            >
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Strength meter */}
                        <div className="mt-2.5 flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
                                <div className={`h-full ${s.color} ${form.password ? s.width : "w-0"} transition-all`} />
                            </div>
                            <span className="text-[11px] text-[var(--ink-500)] font-semibold min-w-[55px] text-end">
                                {form.password ? s.label : "حداقل ۶"}
                            </span>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={submitting}
                        className="auth-submit"
                        data-testid="signup-submit-btn"
                    >
                        <UserPlus className="w-4 h-4 ms-2" />
                        {submitting ? "در حال ساخت حساب…" : "ساخت حساب کاربری"}
                        {!submitting && <ArrowLeft className="w-4 h-4 ms-2" />}
                    </Button>


                </form>
                </>}
            </div>
        </AuthShell>
    );
}
