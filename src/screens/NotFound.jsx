import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Home, Search, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/NavbarPremium";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex-1 relative overflow-hidden mesh-aurora grid place-items-center px-4 py-16">
                <div className="absolute -top-32 -end-32 w-96 h-96 rounded-full blob" style={{ background: "rgba(99,102,241,0.35)" }} aria-hidden />
                <div className="absolute -bottom-32 -start-32 w-96 h-96 rounded-full blob" style={{ background: "rgba(245,158,11,0.35)" }} aria-hidden />
                <div className="absolute inset-0 grid-overlay opacity-50 pointer-events-none" />

                <div className="relative max-w-lg text-center fade-up">
                    <div className="relative inline-block mb-6">
                        <div className="text-[10rem] sm:text-[12rem] font-black text-gradient leading-none tracking-tighter select-none">
                            ۴۰۴
                        </div>
                        <span className="absolute -top-2 -end-4 chip chip-gold shadow-[var(--shadow-2)] bg-white rotate-6">
                            <Compass className="w-3.5 h-3.5" /> راه را گم کردیم
                        </span>
                    </div>

                    <h1 className="text-3xl font-extrabold tracking-tight text-[var(--ink-900)] mb-3">صفحه یافت نشد</h1>
                    <p className="text-[var(--ink-500)] mb-8 leading-7">
                        به نظر می‌رسد لینک اشتباه است، صفحه‌ منتشر نشده، یا حذف شده.
                        بیایید برگردیم به جای امن!
                    </p>

                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link to="/">
                            <Button className="rounded-xl h-11 px-5 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white shadow-[var(--shadow-glow)]">
                                <Home className="w-4 h-4 ms-2" /> بازگشت به خانه
                                <ArrowLeft className="w-4 h-4 ms-2" />
                            </Button>
                        </Link>
                        <Link to="/pricing">
                            <Button variant="outline" className="rounded-xl h-11 px-5 border-[var(--line-strong)] bg-white">
                                <Search className="w-4 h-4 ms-2" /> مشاهده تعرفه‌ها
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
