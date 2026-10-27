import React, { useEffect, useId, useState } from "react";
import { subscriptionProgress } from "@/lib/subscription";
import { toFarsiDigits } from "@/lib/jalali";
import "@/styles/subscription-progress.css";

export default function SubscriptionProgress({ user }) {
  const [now, setNow] = useState(Date.now);
  const labelId = useId();
  const noteId = useId();
  useEffect(() => {
    const update = () => setNow(Date.now());
    const onVisible = () => { if (!document.hidden) update(); };
    const interval = window.setInterval(update, 60000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  const progress = subscriptionProgress(user, now);
  if (progress.state === "free") return <p className="subscription-free-note">پلن رایگان فعال است؛ برای ارتقا با پشتیبانی هماهنگ کن.</p>;
  const unknown = progress.state === "unknown";
  const expired = progress.state === "expired";
  const label = unknown ? "تاریخ پایان ثبت نشده"
    : expired ? (progress.trial ? "دورهٔ آزمایشی تمام شده" : "دورهٔ اشتراک تمام شده")
    : progress.lessThanDay ? "کمتر از ۱ روز باقی مانده"
    : toFarsiDigits(progress.remainingDays) + " روز باقی مانده";
  const date = progress.end !== null ? new Intl.DateTimeFormat("fa-IR", { timeZone: "Asia/Tehran", day: "numeric", month: "long", year: "numeric" }).format(progress.end) : null;
  const value = expired ? 0 : progress.percent;
  return (
    <div className="subscription-progress" data-state={unknown ? "unknown" : expired ? "expired" : progress.remainingDays <= 2 ? "ending" : "active"}>
      <div className="subscription-progress-heading">
        <span id={labelId}>زمان باقی‌مانده</span>
        {progress.trial && <span className="subscription-trial-label">آزمایشی</span>}
      </div>
      <strong className="subscription-days">{label}</strong>
      <div className="subscription-progress-track" role="progressbar" aria-labelledby={labelId} aria-describedby={noteId} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value === null ? undefined : Math.round(value)} aria-valuetext={label}>
        <span className="subscription-progress-fill" style={{ transform: "scaleX(" + ((value ?? 0) / 100) + ")" }} />
      </div>
      <p id={noteId} className="subscription-progress-note">
        {unknown ? "برای تعیین مدت اشتراک با پشتیبانی هماهنگ کن."
          : expired ? "برای تمدید امکانات حرفه‌ای با پشتیبانی در ارتباط باش."
          : <>پایان: <time dateTime={new Date(progress.end).toISOString()}>{date}</time>{progress.totalDays && <span> · دورهٔ {toFarsiDigits(progress.totalDays)} روزه</span>}</>}
      </p>
    </div>
  );
}
