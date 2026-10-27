import React, { useState } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronUp, Sparkles, Eye } from "lucide-react";
import BuilderCharacter from "@/components/BuilderCharacter";
import { pageReadiness } from "@/lib/pageReadiness";

export default function WaniGuide({ page, services, onAction, onPreview, busy = false }) {
  const [expanded, setExpanded] = useState(false);
  const checks = pageReadiness(page, services);
  const completed = checks.filter((item) => item.done).length;
  const next = checks.find((item) => !item.done);
  const percent = checks.length ? Math.round(completed / checks.length * 100) : 0;

  return (
    <section className="pro-wani" aria-label="راهنمای وانی">
      <div className="pro-wani-main">
        <BuilderCharacter />
        <div className="pro-wani-copy">
          <span className="pro-eyebrow"><Sparkles size={13} /> وانی · راهنمای ساخت صفحه</span>
          <h2>{next ? next.title + "، قدم بعدی توست." : "صفحه‌ات آماده‌ی دیده‌شدن است."}</h2>
          <p>{next ? next.detail : "همه‌ی پیشنهادهای پایه تکمیل شده‌اند. یک بار پیش‌نمایش را ببین و بعد منتشر کن."}</p>
          <div className="pro-wani-actions">
            <button type="button" className="pro-small-primary" disabled={busy} onClick={() => next ? onAction(next) : onPreview()}>
              {next ? "بریم تکمیلش کنیم" : "دیدن پیش‌نمایش"} <ArrowLeft size={15} />
            </button>
            <button type="button" className="pro-text-button" aria-expanded={expanded} aria-controls="wani-checklist" onClick={() => setExpanded(!expanded)}>
              چک‌لیست صفحه {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>
        <div className="pro-wani-progress">
          <div className="pro-progress-number">{percent.toLocaleString("fa-IR")}<small>٪</small></div>
          <div className="pro-progress-track" role="progressbar" aria-label="تکمیل پیشنهادهای صفحه" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{ width: percent + "%" }} /></div>
          <span>{completed.toLocaleString("fa-IR")} از {checks.length.toLocaleString("fa-IR")} پیشنهاد</span>
        </div>
      </div>
      {expanded && (
        <div className="pro-wani-checklist" id="wani-checklist">
          <p>این چک‌لیست با اطلاعات فعلی صفحه به‌روز می‌شود.</p>
          <div>
            {checks.map((item) => (
              <button type="button" key={item.id} disabled={busy} className={item.done ? "is-complete" : ""} onClick={() => onAction(item)}>
                <span className="pro-check-dot">{item.done ? <Check size={13} /> : <span />}</span>
                <span>{item.title}</span><ArrowLeft size={14} />
              </button>
            ))}
          </div>
          <button type="button" className="pro-text-button" onClick={onPreview}><Eye size={15} /> پیش‌نمایش با تغییرات فعلی</button>
        </div>
      )}
    </section>
  );
}
