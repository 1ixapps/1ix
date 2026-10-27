import React from "react";
import { Link } from "react-router-dom";
import { Bell, CalendarDays, ChevronDown, ChevronLeft, LayoutDashboard, Link2, LogOut, Menu, Settings, ShieldCheck, Sparkles, UserRound, Wrench } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PLAN_LABELS } from "@/lib/plans";
import AccountAvatar from "@/components/AccountAvatar";

const PAGES = {
  "/dashboard": { title: "نمای کلی", label: "کسب‌وکار من", icon: LayoutDashboard },
  "/dashboard/page": { title: "صفحه‌ساز", label: "مدیریت صفحه", icon: UserRound },
  "/dashboard/services": { title: "خدمات و تعرفه‌ها", label: "مدیریت کسب‌وکار", icon: Wrench },
  "/dashboard/appointments": { title: "نوبت‌ها و مشتریان", label: "مدیریت کسب‌وکار", icon: CalendarDays },
  "/dashboard/links": { title: "لینک‌های کوتاه", label: "مدیریت کسب‌وکار", icon: Link2 },
  "/dashboard/notifications": { title: "اعلان‌ها", label: "حساب کاربری", icon: Bell },
  "/dashboard/settings": { title: "تنظیمات حساب", label: "حساب کاربری", icon: Settings },
  "/dashboard/plan": { title: "پلن و امکانات", label: "حساب کاربری", icon: Sparkles },
};

export default function WorkspaceHeader({ user, pathname, onMenu, menuOpen, menuButtonRef, onLogout, loggingOut = false }) {
  const page = PAGES[pathname?.replace(/\/$/, "")] || PAGES["/dashboard"];
  const Icon = page.icon;
  return (
    <header className="workspace-header">
      <div className="workspace-header-inner">
        <button ref={menuButtonRef} type="button" onClick={onMenu} className="workspace-icon-button workspace-menu-toggle" aria-label="باز کردن منوی داشبورد" aria-expanded={Boolean(menuOpen)}><Menu size={20} /></button>
        <div className="workspace-context"><span className="workspace-context-icon" aria-hidden="true"><Icon size={20} strokeWidth={1.8} /></span><div><span className="workspace-context-label">{page.label}</span><p className="workspace-current-page">{page.title}</p></div></div>
        <div className="workspace-header-actions">
          <Link to="/dashboard/plan" className={`workspace-plan-pill ${["pro", "business"].includes(user?.plan) ? "is-pro" : ""}`} aria-label={`پلن ${PLAN_LABELS[user?.plan] || "رایگان"}، مشاهدهٔ امکانات`}><Sparkles size={14} aria-hidden="true" /><span>{PLAN_LABELS[user?.plan] || "رایگان"}</span></Link>
          <Link to="/dashboard/notifications" className="workspace-icon-button workspace-notifications" aria-label="اعلان‌ها"><Bell size={19} /></Link>
          <span className="workspace-header-divider" aria-hidden="true" />
          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild><button type="button" className="workspace-account-trigger" aria-label="منوی حساب کاربری"><AccountAvatar user={user} className="workspace-account-avatar" /><span className="workspace-account-name">{user?.name || "حساب من"}</span><ChevronDown size={14} className="workspace-account-chevron" aria-hidden="true" /></button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} collisionPadding={12} className="workspace-account-menu">
              <DropdownMenuLabel className="workspace-account-summary"><strong>{user?.name || "حساب من"}</strong><span dir="ltr">{user?.email}</span></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild><Link to="/dashboard/settings"><Settings size={17} /> تنظیمات حساب <ChevronLeft size={14} className="workspace-menu-arrow" /></Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/dashboard/plan"><Sparkles size={17} /> پلن و امکانات</Link></DropdownMenuItem>
              {user?.role === "admin" && <DropdownMenuItem asChild><Link to="/admin"><ShieldCheck size={17} /> پنل مدیریت</Link></DropdownMenuItem>}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={onLogout} disabled={loggingOut} className="workspace-logout"><LogOut size={17} />{loggingOut ? "در حال خروج" : "خروج از حساب"}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
