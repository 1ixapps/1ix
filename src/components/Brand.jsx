import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function BrandMark({ inverse = false, className }) {
    return (
        <span className={cn("v3-brand-mark v3-brand-mark-character", inverse && "is-inverse", className)} aria-hidden="true">
            <svg viewBox="0 0 48 48" focusable="false">
                <rect x="3.5" y="3.5" width="41" height="41" rx="12" fill="#4F46F7" stroke="#17181B" strokeWidth="2.5" />
                <path d="M8 15.5h32" stroke="#FFD84D" strokeWidth="5" strokeLinecap="round" />
                <circle cx="12" cy="10" r="1.6" fill="#FF6B5E" />
                <circle cx="18" cy="10" r="1.6" fill="#FFFBF4" />
                <rect x="11" y="19" width="26" height="18" rx="6" fill="#FFFBF4" />
                <circle cx="18" cy="27" r="2" fill="#17181B" />
                <circle cx="30" cy="27" r="2" fill="#17181B" />
                <path d="M23 31c1.8 1.9 4.2 1.9 6 0" stroke="#17181B" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M32 34h8a7 7 0 0 1-7 7h-5v-3a4 4 0 0 1 4-4Z" fill="#FF6B5E" />
            </svg>
        </span>
    );
}

export default function Brand({ inverse = false, compact = false, className }) {
    return (
        <Link to="/" className={cn("v3-brand", inverse && "is-inverse", className)} aria-label="وانیکس، صفحه اصلی">
            <BrandMark inverse={inverse} />
            {!compact && <span>وانیکس</span>}
        </Link>
    );
}
