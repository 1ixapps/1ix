import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, LogIn, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
    { to: "/", label: "خانه" },
    { to: "/pricing", label: "تعرفه‌ها" },
    { to: "/#features", label: "امکانات", hash: true },
    { to: "/#faq", label: "سوالات", hash: true },
];

function BrandMark({ size = 36 }) {
    return (
        <span
            className="grid place-items-center rounded-2xl text-white font-black shadow-[0_8px_22px_-8px_rgba(99,102,241,0.6)]"
            style={{
                width: size,
                height: size,
                background:
                    "conic-gradient(from 210deg at 50% 50%, #6366f1, #8b5cf6, #f59e0b, #6366f1)",
            }}
            aria-hidden
        >
            <span className="grid place-items-center w-[78%] h-[78%] rounded-[10px] bg-[#0b1020] text-white text-[15px] font-black">
                و
            </span>
        </span>
    );
}

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const on = () => setScrolled(window.scrollY > 4);
        on();
        window.addEventListener("scroll", on, { passive: true });
        return () => window.removeEventListener("scroll", on);
    }, []);

    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    return (
        <header
            className={`sticky top-0 z-50 transition-all duration-300 ${
                scrolled
                    ? "bg-white/80 glass border-b border-[var(--line)]"
                    : "bg-white/40 backdrop-blur-md border-b border-transparent"
            }`}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center h-16 gap-6">
                <Link
                    to="/"
                    className="flex items-center gap-2.5 group"
                    data-testid="navbar-brand"
                >
                    <BrandMark />
                    <span className="flex flex-col -space-y-1">
                        <span className="font-extrabold text-[17px] tracking-tight text-[var(--ink-900)]">
                            1ix.ir
                        </span>
                        <span className="text-[10px] text-[var(--ink-300)] font-semibold tracking-widest uppercase">
                            1ix.ir
                        </span>
                    </span>
                </Link>

                <nav className="hidden md:flex items-center gap-1 ms-2 p-1 rounded-full border border-[var(--line)] bg-white/60">
                    {navLinks.map((l) =>
                        l.hash ? (
                            <a
                                key={l.to}
                                href={l.to}
                                className="text-sm font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)] hover:bg-[var(--brand-50)] px-3.5 py-1.5 rounded-full transition-colors"
                                data-testid={`nav-link-${l.label}`}
                            >
                                {l.label}
                            </a>
                        ) : (
                            <NavLink
                                key={l.to}
                                to={l.to}
                                className={({ isActive }) =>
                                    `text-sm font-medium transition-colors px-3.5 py-1.5 rounded-full ${
                                        isActive
                                            ? "bg-[var(--ink-900)] text-white shadow-[var(--shadow-2)]"
                                            : "text-[var(--ink-500)] hover:text-[var(--ink-900)] hover:bg-[var(--brand-50)]"
                                    }`
                                }
                                data-testid={`nav-link-${l.label}`}
                            >
                                {l.label}
                            </NavLink>
                        ),
                    )}
                </nav>

                <div className="ms-auto flex items-center gap-2">
                    {user ? (
                        <Button
                            onClick={() =>
                                navigate(
                                    user.role === "admin"
                                        ? "/admin"
                                        : "/dashboard",
                                )
                            }
                            className="btn-ink rounded-full h-10 px-5"
                            data-testid="navbar-dashboard-btn"
                        >
                            داشبورد من
                            <ArrowLeft className="w-4 h-4 ms-1.5" />
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => navigate("/login")}
                                className="hidden sm:inline-flex rounded-full h-10 px-4 text-[var(--ink-700)]"
                                data-testid="navbar-login-btn"
                            >
                                <LogIn className="w-4 h-4 ms-1" /> ورود
                            </Button>
                            <Button
                                onClick={() => navigate("/signup")}
                                className="rounded-full h-10 px-5 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white shadow-[0_10px_24px_-10px_rgba(99,102,241,0.7)]"
                                data-testid="navbar-signup-btn"
                            >
                                شروع رایگان
                                <ArrowLeft className="w-4 h-4 ms-1.5" />
                            </Button>
                        </>
                    )}
                    <button
                        type="button"
                        className="md:hidden p-2 rounded-xl hover:bg-[var(--brand-50)] text-[var(--ink-700)]"
                        onClick={() => setOpen((s) => !s)}
                        data-testid="navbar-menu-toggle"
                        aria-label="منو"
                    >
                        {open ? (
                            <X className="w-5 h-5" />
                        ) : (
                            <Menu className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            {open && (
                <div className="md:hidden border-t border-[var(--line)] bg-white">
                    <div className="px-4 py-3 flex flex-col gap-1">
                        {navLinks.map((l) =>
                            l.hash ? (
                                <a
                                    key={l.to}
                                    href={l.to}
                                    onClick={() => setOpen(false)}
                                    className="py-2.5 px-3 rounded-lg text-[var(--ink-700)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]"
                                    data-testid={`nav-mobile-${l.label}`}
                                >
                                    {l.label}
                                </a>
                            ) : (
                                <NavLink
                                    key={l.to}
                                    to={l.to}
                                    onClick={() => setOpen(false)}
                                    className="py-2.5 px-3 rounded-lg text-[var(--ink-700)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]"
                                    data-testid={`nav-mobile-${l.label}`}
                                >
                                    {l.label}
                                </NavLink>
                            ),
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
