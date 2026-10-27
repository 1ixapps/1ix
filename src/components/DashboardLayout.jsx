import React from "react";
import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, UserSquare2, Link as LinkIcon, Calendar, Bell, Settings,
    LogOut, Sparkles, Wrench, Search, ShieldCheck, ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const NAV = [
    { to: "/dashboard",               icon: LayoutDashboard, label: "نمای کلی", end: true },
    { to: "/dashboard/page",          icon: UserSquare2,     label: "صفحه‌ من" },
    { to: "/dashboard/services",      icon: Wrench,          label: "خدمات" },
    { to: "/dashboard/appointments",  icon: Calendar,        label: "نوبت‌ها" },
    { to: "/dashboard/links",         icon: LinkIcon,        label: "لینک‌ها" },
    { to: "/dashboard/notifications", icon: Bell,            label: "اطلاعیه‌ها" },
    { to: "/dashboard/settings",      icon: Settings,        label: "تنظیمات" },
];

function BrandMark() {
    return (
        <Link to="/" className="flex items-center gap-2.5 group" data-testid="dash-brand">
            <span
                className="grid place-items-center w-10 h-10 rounded-2xl text-white font-black shadow-[0_10px_24px_-10px_rgba(99,102,241,0.7)]"
                style={{ background: "conic-gradient(from 210deg at 50% 50%, #6366f1, #8b5cf6, #f59e0b, #6366f1)" }}
            >
                <span className="grid place-items-center w-[78%] h-[78%] rounded-[10px] bg-[#0b1020] text-white text-base font-black">و</span>
            </span>
            <span className="flex flex-col -space-y-1">
                <span className="font-extrabold text-[16px] tracking-tight text-[var(--ink-900)]">1ix.ir</span>
                <span className="text-[10px] text-[var(--ink-300)] font-semibold tracking-widest uppercase">داشبورد</span>
            </span>
        </Link>
    );
}

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const doLogout = async () => {
        await logout();
        toast.success("خارج شدید");
        navigate("/");
    };

    return (
        <div className="min-h-screen flex bg-[var(--background)]">
            {/* Sidebar */}
            <aside className="hidden md:flex w-64 shrink-0 flex-col border-s border-[var(--line)] bg-white">
                <div className="p-5 border-b border-[var(--line)]">
                    <BrandMark />
                </div>

                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    <div className="px-3 py-2 text-[10px] font-bold tracking-widest uppercase text-[var(--ink-300)]">
                        پنل
                    </div>
                    {NAV.map((n) => (
                        <NavLink
                            key={n.to}
                            to={n.to}
                            end={n.end}
                            className={({ isActive }) =>
                                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                                    isActive
                                        ? "bg-[var(--brand-50)] text-[var(--brand-700)] shadow-[var(--shadow-1)]"
                                        : "text-[var(--ink-700)] hover:bg-[var(--brand-50)]/50 hover:text-[var(--brand-700)]"
                                }`
                            }
                            data-testid={`sidebar-${n.to.replace("/dashboard", "").replace("/", "") || "home"}`}
                        >
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <span className="absolute end-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-s-full bg-[var(--brand-600)]" aria-hidden />
                                    )}
                                    <span className={`grid place-items-center w-7 h-7 rounded-lg transition-colors ${
                                        isActive
                                            ? "bg-[var(--brand-600)] text-white shadow-[var(--shadow-1)]"
                                            : "bg-[var(--brand-50)] text-[var(--brand-600)] group-hover:bg-[var(--brand-100)]"
                                    }`}>
                                        <n.icon className="w-4 h-4" />
                                    </span>
                                    <span className="flex-1">{n.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="p-3 border-t border-[var(--line)] space-y-2">
                    {/* Upgrade promo */}
                    <div className="rounded-2xl p-4 mesh-ink text-white overflow-hidden relative">
                        <div className="absolute -top-8 -end-8 w-32 h-32 rounded-full blob" style={{ background: "rgba(245,158,11,0.45)" }} />
                        <div className="relative">
                            <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold mb-1">
                                <Sparkles className="w-3.5 h-3.5" /> ارتقاء پلن
                            </div>
                            <div className="text-sm font-bold leading-6">امکانات بیشتر را فعال کنید</div>
                            <Link to="/pricing">
                                <Button size="sm" className="mt-3 w-full h-8 rounded-lg bg-white text-[var(--ink-900)] hover:bg-amber-50 text-xs font-semibold">
                                    مشاهده پلن‌ها
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {user?.role === "admin" && (
                        <Link to="/admin">
                            <Button variant="outline" size="sm" className="w-full rounded-xl border-[var(--line-strong)] bg-white" data-testid="sidebar-admin-link">
                                <ShieldCheck className="w-4 h-4 ms-1.5 text-[var(--brand-600)]" />
                                پنل مدیریت
                            </Button>
                        </Link>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl"
                        onClick={doLogout}
                        data-testid="sidebar-logout"
                    >
                        <LogOut className="w-4 h-4 ms-1.5" /> خروج از حساب
                    </Button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="sticky top-0 z-40 glass border-b border-[var(--line)]">
                    <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
                        <div className="md:hidden">
                            <BrandMark />
                        </div>

                        {/* Search (desktop) */}
                        <div className="hidden md:flex items-center max-w-md w-full">
                            <div className="relative w-full">
                                <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-300)]" />
                                <input
                                    type="search"
                                    placeholder="جستجوی سریع…"
                                    className="w-full h-10 ps-3 pe-10 rounded-full bg-[var(--brand-50)]/50 border border-transparent hover:border-[var(--line)] focus:bg-white focus:border-[var(--line-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/30 text-sm transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link to="/pricing" className="hidden sm:inline-flex">
                                <Button size="sm" variant="outline" className="rounded-full h-9 border-[var(--line-strong)] bg-white">
                                    <Sparkles className="w-4 h-4 ms-1.5 text-amber-500" /> ارتقاء
                                </Button>
                            </Link>
                            <button className="grid place-items-center w-9 h-9 rounded-full hover:bg-[var(--brand-50)] text-[var(--ink-700)] relative" aria-label="اطلاعیه‌ها">
                                <Bell className="w-4 h-4" />
                                <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                            </button>
                            <DropdownMenu dir="rtl">
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 hover:bg-[var(--brand-50)] rounded-full p-1 ps-2 transition-colors" data-testid="user-menu-trigger">
                                        <div className="hidden sm:block text-end">
                                            <div className="text-sm font-semibold leading-tight text-[var(--ink-900)]">{user?.name}</div>
                                            <div className="text-[11px] text-[var(--ink-500)] leading-tight" dir="ltr">{user?.email}</div>
                                        </div>
                                        <div className="w-9 h-9 rounded-full grid place-items-center text-white font-bold text-sm"
                                             style={{ background: "conic-gradient(from 210deg at 50% 50%, #6366f1, #8b5cf6, #f59e0b, #6366f1)" }}>
                                            <span className="grid place-items-center w-[80%] h-[80%] rounded-full bg-[#0b1020]">
                                                {user?.name?.[0] || "ک"}
                                            </span>
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 rounded-2xl border-[var(--line)] shadow-[var(--shadow-3)] p-2" align="end">
                                    <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2">
                                        <div className="w-9 h-9 rounded-full bg-[var(--brand-100)] grid place-items-center text-[var(--brand-700)] font-bold">
                                            {user?.name?.[0] || "ک"}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-[var(--ink-900)]">{user?.name}</div>
                                            <div className="text-[11px] text-[var(--ink-500)] font-normal" dir="ltr">{user?.email}</div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate("/dashboard/settings")} className="rounded-xl" data-testid="menu-settings">
                                        <Settings className="w-4 h-4 ms-1.5" /> تنظیمات حساب
                                    </DropdownMenuItem>
                                    {user?.role === "admin" && (
                                        <DropdownMenuItem onClick={() => navigate("/admin")} className="rounded-xl">
                                            <ShieldCheck className="w-4 h-4 ms-1.5" /> پنل مدیریت
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={doLogout} className="text-rose-600 rounded-xl focus:text-rose-700" data-testid="menu-logout">
                                        <LogOut className="w-4 h-4 ms-1.5" /> خروج از حساب
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Mobile horizontal nav */}
                    <div className="md:hidden border-t border-[var(--line)] overflow-x-auto">
                        <div className="flex gap-1 px-3 py-2 min-w-max">
                            {NAV.map((n) => (
                                <NavLink
                                    key={n.to}
                                    to={n.to}
                                    end={n.end}
                                    className={({ isActive }) =>
                                        `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                                            isActive
                                                ? "bg-[var(--brand-600)] text-white shadow-[var(--shadow-1)]"
                                                : "bg-[var(--brand-50)]/40 text-[var(--ink-700)]"
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
