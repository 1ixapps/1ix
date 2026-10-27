import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
    Bell,
    CalendarDays,
    LayoutDashboard,
    Link2,
    LogOut,
    Settings,
    ShieldCheck,
    Sparkles,
    UserRound,
    Wrench,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Brand from "@/components/Brand";
import WorkspaceHeader from "@/components/WorkspaceHeader";
import SubscriptionProgress from "@/components/SubscriptionProgress";
import * as NavigationDialog from "@radix-ui/react-dialog";
import "@/styles/workspace-polish.css";
import { PLAN_LABELS } from "@/lib/plans";

const primaryNav = [
    { to: "/dashboard", icon: LayoutDashboard, label: "نمای کلی", end: true },
    { to: "/dashboard/page", icon: UserRound, label: "صفحه کسب‌وکار" },
    { to: "/dashboard/services", icon: Wrench, label: "خدمات" },
    { to: "/dashboard/appointments", icon: CalendarDays, label: "نوبت‌ها و مشتریان" },
    { to: "/dashboard/links", icon: Link2, label: "لینک‌های کوتاه" },
];

const secondaryNav = [
    { to: "/dashboard/notifications", icon: Bell, label: "اعلان‌ها" },
    { to: "/dashboard/settings", icon: Settings, label: "تنظیمات" },
    { to: "/dashboard/plan", icon: Sparkles, label: "پلن و امکانات" },
];

function NavItem({ item, onNavigate }) {
    return (
        <NavLink to={item.to} end={item.end} onClick={onNavigate} className={({ isActive }) => "group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors " + (isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950")}>
            {({ isActive }) => (
                <>
                    <span className={"grid h-8 w-8 place-items-center rounded-lg transition-colors " + (isActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-white")}>
                        <item.icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {isActive && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />}
                </>
            )}
        </NavLink>
    );
}

function Sidebar({ user, onLogout, onNavigate, mobile = false, loggingOut = false }) {
    return (
        <div className="flex h-full flex-col bg-white">
            <div className="flex h-[72px] items-center justify-between border-b border-slate-200 px-5">
                <Brand />
                {mobile && <button type="button" onClick={onNavigate} className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="بستن منو"><X className="h-5 w-5" /></button>}
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="ناوبری داشبورد">
                <p className="mb-2 px-3 text-[10px] font-extrabold tracking-[.12em] text-slate-400">مدیریت کسب‌وکار</p>
                <div className="space-y-1">{primaryNav.map((item) => <NavItem key={item.to} item={item} onNavigate={onNavigate} />)}</div>
                <div className="my-5 h-px bg-slate-100" />
                <p className="mb-2 px-3 text-[10px] font-extrabold tracking-[.12em] text-slate-400">حساب کاربری</p>
                <div className="space-y-1">{secondaryNav.map((item) => <NavItem key={item.to} item={item} onNavigate={onNavigate} />)}</div>
            </nav>
            <div className="border-t border-slate-200 p-3">
                <div className="mb-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-700"><Sparkles className="h-4 w-4" /> پلن {PLAN_LABELS[user?.plan] || "رایگان"}</div>
                    <SubscriptionProgress user={user} />
                    <Button asChild variant="outline" className="mt-3 h-9 w-full rounded-xl border-indigo-200 bg-white text-xs font-bold text-indigo-700 hover:bg-indigo-100"><Link to="/dashboard/plan" onClick={onNavigate}>مشاهدهٔ امکانات</Link></Button>
                </div>
                {user?.role === "admin" && <Button asChild variant="ghost" className="mb-1 h-10 w-full justify-start rounded-xl text-slate-600"><Link to="/admin" onClick={onNavigate}><ShieldCheck className="h-4 w-4" /> پنل مدیریت</Link></Button>}
                <Button variant="ghost" disabled={loggingOut} onClick={onLogout} className="h-10 w-full justify-start rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700"><LogOut className="h-4 w-4" /> خروج از حساب</Button>
            </div>
        </div>
    );
}

export default function DashboardLayoutPremium() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const menuButtonRef = useRef(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => setMenuOpen(false), [location.pathname]);

    useEffect(() => {
        if (typeof window.matchMedia !== "function") return;
        const desktop = window.matchMedia("(min-width: 1024px)");
        const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
        desktop.addEventListener?.("change", closeOnDesktop);
        return () => desktop.removeEventListener?.("change", closeOnDesktop);
    }, []);

    const handleLogout = async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            await logout();
            toast.success("با موفقیت از حساب خارج شدید");
            navigate("/");
        } catch {
            toast.error("خروج انجام نشد. دوباره تلاش کنید.");
        } finally { setLoggingOut(false); }
    };

    return (
        <div className="v3-dashboard luxury-shell dashboard-content workspace-shell min-h-screen bg-[#f6f7f9] text-slate-950" dir="rtl">
            <aside className="v3-sidebar luxury-sidebar dashboard-sidebar fixed inset-y-0 right-0 z-40 hidden w-[272px] border-l border-slate-200 lg:block"><Sidebar user={user} onLogout={handleLogout} loggingOut={loggingOut} /></aside>
            <NavigationDialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
                <NavigationDialog.Portal>
                    <NavigationDialog.Overlay className="workspace-mobile-overlay" />
                    <NavigationDialog.Content className="workspace-mobile-navigation" dir="rtl" onCloseAutoFocus={(event) => { event.preventDefault(); menuButtonRef.current?.focus(); }}>
                        <NavigationDialog.Title className="sr-only">منوی مدیریت کسب‌وکار</NavigationDialog.Title>
                        <NavigationDialog.Description className="sr-only">دسترسی به صفحه، لینک‌ها، نوبت‌ها و تنظیمات حساب</NavigationDialog.Description>
                        <Sidebar user={user} onLogout={handleLogout} loggingOut={loggingOut} onNavigate={() => setMenuOpen(false)} mobile />
                    </NavigationDialog.Content>
                </NavigationDialog.Portal>
            </NavigationDialog.Root>
            <div className="workspace-body min-h-screen lg:mr-[272px]">
                <WorkspaceHeader user={user} pathname={location.pathname} onMenu={() => setMenuOpen(true)} menuOpen={menuOpen} menuButtonRef={menuButtonRef} onLogout={handleLogout} loggingOut={loggingOut} />
                <main className="workspace-main mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"><Outlet /></main>
            </div>
        </div>
    );
}
