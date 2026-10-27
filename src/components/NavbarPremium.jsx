import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Menu, X } from "lucide-react";
import Brand from "@/components/Brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
    { label: "محصول", href: "/#product" },
    { label: "کاربردها", href: "/#use-cases" },
    { label: "قیمت", to: "/pricing" },
    { label: "راهنما", href: "/#faq" },
];

export default function NavbarPremium() {
    const [open, setOpen] = useState(false);
    const toggleRef = useRef(null);
    const { user } = useAuth() || {};
    const close = () => setOpen(false);

    return (
        <header className="v3-nav">
            <div className="v3-nav-inner">
                <Brand />
                <nav className="v3-nav-links" aria-label="ناوبری اصلی">
                    {navItems.map((item) => item.to ? (
                        <Link key={item.label} to={item.to}>{item.label}</Link>
                    ) : (
                        <a key={item.label} href={item.href}>{item.label}</a>
                    ))}
                </nav>
                <div className="v3-nav-actions">
                    <Link to={user ? "/dashboard/plan" : "/login"}>{user ? "پلن و امکانات" : "ورود"}</Link>
                    <Button asChild className="v3-nav-cta">
                        <Link to={user ? "/dashboard" : "/signup"}>{user ? "ورود به پنل" : "ساخت صفحه"} <ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                </div>
                <button
                    type="button"
                    ref={toggleRef}
                    onClick={() => setOpen((value) => !value)}
                    className="v3-menu-button"
                    aria-label={open ? "بستن منو" : "باز کردن منو"}
                    aria-expanded={open}
                    aria-controls="vanix-site-menu"
                >
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>
            <div id="vanix-site-menu" className={cn("v3-mobile-menu", open && "is-open")} inert={!open} onKeyDown={(event) => { if (event.key === "Escape") { close(); toggleRef.current?.focus(); } }}>
                <nav aria-label="ناوبری موبایل">
                    {navItems.map((item) => item.to ? (
                        <Link key={item.label} to={item.to} onClick={close}>{item.label}</Link>
                    ) : (
                        <a key={item.label} href={item.href} onClick={close}>{item.label}</a>
                    ))}
                </nav>
                <div>
                    <Button asChild variant="outline"><Link to={user ? "/dashboard/plan" : "/login"} onClick={close}>{user ? "پلن و امکانات" : "ورود"}</Link></Button>
                    <Button asChild className="v3-btn-primary"><Link to={user ? "/dashboard" : "/signup"} onClick={close}>{user ? "ورود به پنل" : "ساخت صفحه"}</Link></Button>
                </div>
            </div>
        </header>
    );
}
