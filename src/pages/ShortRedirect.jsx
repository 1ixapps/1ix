import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "@/lib/api";

export default function ShortRedirect() {
    const { slug } = useParams();
    const [err, setErr] = useState(null);

    useEffect(() => {
        let cancelled = false;
        api.get(`/links/resolve/${slug}`)
            .then((r) => {
                if (cancelled) return;
                window.location.replace(r.data.destination);
            })
            .catch((e) => {
                if (cancelled) return;
                setErr(e?.response?.data?.detail || "لینک پیدا نشد");
            });
        return () => {
            cancelled = true;
        };
    }, [slug]);

    return (
        <div className="min-h-screen grid place-items-center bg-background px-4">
            {err ? (
                <div className="text-center">
                    <div className="text-5xl mb-3">🔗</div>
                    <h1 className="text-2xl font-extrabold mb-2">لینک نامعتبر</h1>
                    <p className="text-gray-600">{err}</p>
                </div>
            ) : (
                <div className="text-center">
                    <div className="text-2xl font-bold mb-2">در حال انتقال…</div>
                    <div className="text-sm text-gray-500">لطفاً صبر کنید</div>
                </div>
            )}
        </div>
    );
}
