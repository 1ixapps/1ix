import React from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, LifeBuoy, ArrowUpRight } from "lucide-react";

function BrandMark() {
    return (
        <span
            className="grid place-items-center w-10 h-10 rounded-2xl text-white font-black"
            style={{
                background:
                    "conic-gradient(from 210deg at 50% 50%, #6366f1, #8b5cf6, #f59e0b, #6366f1)",
            }}
            aria-hidden
        >
            <span className="grid place-items-center w-[78%] h-[78%] rounded-[10px] bg-[#0b1020] text-white text-base">
                و
            </span>
        </span>
    );
}

export default function Footer() {
    return (
        <footer className="relative overflow-hidden bg-[#0b1020] text-white">
            <div
                className="absolute -top-32 -end-32 w-96 h-96 rounded-full blob"
                style={{ background: "rgba(99, 102, 241, 0.55)" }}
            />
            <div
                className="absolute -bottom-32 -start-32 w-96 h-96 rounded-full blob"
                style={{ background: "rgba(245, 158, 11, 0.45)" }}
            />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-10 grid md:grid-cols-12 gap-10">
                <div className="md:col-span-5">
                    <div className="flex items-center gap-3 mb-4">
                        <BrandMark />
                        <div className="leading-tight">
                            <div className="font-extrabold text-lg">1ix.ir</div>
                            <div className="text-[11px] tracking-widest text-white/50 uppercase">
                                1ix.ir
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-white/70 leading-7 max-w-md">
                        پلتفرم حرفه‌ای ساخت صفحه کسب‌وکار، کوتاه‌کننده لینک و
                        نوبت‌دهی آنلاین — ساخته‌شده با عشق برای کسب‌وکارهای
                        ایرانی.
                    </p>

                    <div className="mt-6 flex items-center gap-2">
                        <Link
                            to="/signup"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[#0b1020] text-sm font-semibold hover:bg-amber-50 transition-colors"
                        >
                            شروع رایگان
                            <ArrowUpRight className="w-4 h-4" />
                        </Link>
                        <Link
                            to="/pricing"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/80 hover:bg-white/10 transition-colors"
                        >
                            مشاهده تعرفه‌ها
                        </Link>
                    </div>
                </div>

                <div className="md:col-span-2">
                    <h4 className="font-bold mb-4 text-sm text-white/90">
                        محصول
                    </h4>
                    <ul className="space-y-2.5 text-sm text-white/60">
                        <li>
                            <Link to="/" className="hover:text-white">
                                صفحه اصلی
                            </Link>
                        </li>
                        <li>
                            <Link to="/pricing" className="hover:text-white">
                                تعرفه‌ها
                            </Link>
                        </li>
                        <li>
                            <a href="/#features" className="hover:text-white">
                                امکانات
                            </a>
                        </li>
                        <li>
                            <a href="/#faq" className="hover:text-white">
                                سوالات متداول
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="md:col-span-2">
                    <h4 className="font-bold mb-4 text-sm text-white/90">
                        حساب کاربری
                    </h4>
                    <ul className="space-y-2.5 text-sm text-white/60">
                        <li>
                            <Link to="/signup" className="hover:text-white">
                                ثبت‌نام رایگان
                            </Link>
                        </li>
                        <li>
                            <Link to="/login" className="hover:text-white">
                                ورود
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/forgot-password"
                                className="hover:text-white"
                            >
                                فراموشی رمز عبور
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className="md:col-span-3">
                    <h4 className="font-bold mb-4 text-sm text-white/90">
                        تماس
                    </h4>
                    <ul className="space-y-3 text-sm text-white/60">
                        <li className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-white/40" />
                            <span dir="ltr">hello@1ix.ir</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <LifeBuoy className="w-4 h-4 text-white/40" />
                            <span dir="ltr">support@1ix.ir</span>
                        </li>
                        <li className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-white/40" />
                            <span>تهران، ایران</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="relative border-t border-white/10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 text-xs text-white/50 flex flex-wrap gap-2 justify-between items-center">
                    <span>
                        © {new Date().getFullYear()} 1ix.ir — 1ix.ir | تمام
                        حقوق محفوظ است.
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
                        ساخته شده با ❤︎ برای ایران
                    </span>
                </div>
            </div>
        </footer>
    );
}
