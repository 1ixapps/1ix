import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpLeft } from "lucide-react";
import Brand from "@/components/Brand";
import { toFarsiDigits } from "@/lib/jalali";

export default function FooterPremium() {
    return (
        <footer className="v3-footer">
            <div className="v3-container v3-footer-grid">
                <div>
                    <Brand />
                    <p>صفحه حرفه‌ای، لینک کوتاه و نوبت‌دهی آنلاین در یک محصول.</p>
                </div>
                <div>
                    <span>محصول</span>
                    <a href="/#product">امکانات</a>
                    <a href="/#use-cases">کاربردها</a>
                    <Link to="/pricing">قیمت‌گذاری</Link>
                </div>
                <div>
                    <span>حساب</span>
                    <Link to="/signup">ساخت صفحه</Link>
                    <Link to="/login">ورود</Link>
                    <Link to="/forgot-password">بازیابی رمز</Link>
                </div>
                <Link to="/signup" className="v3-footer-cta">
                    <span>شروع رایگان</span>
                    <ArrowUpLeft className="h-6 w-6" />
                </Link>
            </div>
            <div className="v3-footer-bottom">
                <div className="v3-container"><span dir="ltr">© {toFarsiDigits(new Date().getFullYear())} 1ix.ir</span><span>یک صفحه، کلی امکان.</span></div>
            </div>
        </footer>
    );
}
