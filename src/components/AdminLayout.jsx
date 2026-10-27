import React from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, Users, FileText, Link as LinkIcon, Calendar, Inbox,
    Megaphone, LogOut, Sparkles, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const NAV = [
    { to: "/admin",                icon: LayoutDashboard, label: "نمای کلی",  end: true },
    { to: "/admin/users",          icon: Users,           label: "کاربران" },
    { to: "/admin/pages",          icon: FileText,        label: "صفحات" },
    { to: "/admin/links",          icon: LinkIcon,        label: "لینک‌ها" },
    { to: "/admin/appointments",   icon: Calendar,        label: "نوبت‌ها" },
    { to: "/admin/tickets",        icon: Inbox,           label: "تیکت‌ها" },
    { to: "/admin/announcements",  icon: Megaphone,       label: "اعلانات" },
];

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const doLogout = async () => {
        await logout();
        toast.success("خارج شدید");
        navigate("/");
    };

    return (
        <div className="min-h-screen flex bg-[var(--background)]">
            {/* Premium ink sidebar */}
            <aside className="hidden md:flex w-64 shrink-0 flex-col mesh-ink text-white relative overflow-hidden">
                <div className="absolute -top-32 -end-24 w-72 h-72 rounded-full blob" style={{ background: "rgba(139,92,246,0.45)" }} aria-hidden />
                <div className="absolute -bottom-32 -start-24 w-72 h-72 rounded-full blob" style={{ background: "rgba(245,158,11,0.35)" }} aria-hidden />

                <Link to="/" className="relative flex items-center gap-3 p-5 border-b border-white/10">
                    <span
                        className="grid place-items-center w-10 h-10 rounded-2xl text-white font-black"
                        style={{ background: "conic-gradient(from 210deg at 50% 50%, #6366f1, #8b5cf6, #f59e0b, #6366f1)" }}
                    >
                        <span className="grid place-items-center w-[78%] h-[78%] rounded-[10px] bg-[#0b1020] text-base">و</span>
                    </span>
                    <div className="leading-tight">
                        <div className="font-extrabold text-[15px]">پنل مدیریت</div>
                        <div className="text-[10px] tracking-widest text-white/50 uppercase">1ix.ir · 1ix.ir</div>
                    </div>
                </Link>

                <nav className="relative flex-1 p-3 space-y-1 overflow-y-auto">
                    <div className="px-3 py-2 text-[10px] font-bold tracking-widest uppercase text-white/40">
                        مدیریت
                    </div>
                    {NAV.map((n) => (
                        <NavLink
                            key={n.to}
                            to={n.to}
                            end={n.end}
                            className={({ isActive }) =>
                                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                                    isActive
                                        ? "bg-white/10 text-white shadow-inner ring-1 ring-white/10"
                                        : "text-white/70 hover:bg-white/5 hover:text-white"
                                }`
                            }
                            data-testid={`admin-nav-${n.to.replace("/admin", "").replace("/", "") || "home"}`}
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <span className="absolute end-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-s-full bg-amber-400" aria-hidden />
                                    )}
                                    <span className={`grid place-items-center w-7 h-7 rounded-lg transition-colors ${
                                        isActive ? "bg-amber-400 text-[var(--ink-900)]" : "bg-white/5 text-white/80 group-hover:bg-white/10"
                                    }`}>
                                        <n.icon className="w-4 h-4" />
                                    </span>
                                    <span className="flex-1">{n.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="relative p-3 border-t border-white/10 space-y-2">
                    <Link to="/dashboard">
                        <Button variant="outline" size="sm" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white rounded-xl">
                            <LayoutDashboard className="w-4 h-4 ms-1.5 text-amber-300" />
                            داشبورد کاربری
                        </Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="w-full text-amber-300 hover:bg-white/5 hover:text-amber-200 rounded-xl" onClick={doLogout}>
                        <LogOut className="w-4 h-4 ms-1.5" /> خروج
                    </Button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="sticky top-0 z-40 glass border-b border-[var(--line)]">
                    <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="chip chip-ink">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Admin
                            </span>
                            <span className="font-bold text-[var(--ink-900)] hidden sm:inline">پنل مدیریت 1ix.ir</span>
                        </div>
                        <div className="text-xs text-[var(--ink-500)] font-mono" dir="ltr">{user?.email}</div>
                    </div>
                    <div className="md:hidden border-t border-[var(--line)] overflow-x-auto">
                        <div className="flex gap-1 px-3 py-2 min-w-max">
                            {NAV.map((n) => (
                                <NavLink
                                    key={n.to}
                                    to={n.to}
                                    end={n.end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                                            isActive ? "bg-[var(--ink-900)] text-white" : "bg-[var(--brand-50)]/40 text-[var(--ink-700)]"
                                        }`
                                    }
                                >
                                    <n.icon className="w-3.5 h-3.5" />
                                    {n.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </header>
                <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 fade-up">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
