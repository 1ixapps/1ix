import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { planAction } from "@/lib/plans";
import "@/styles/pricing-cards.css";

export default function PricingPlanCard({ plan, yearly = false, compact = false }) {
  const { user, loading } = useAuth() || {};
  const action = planAction(user, plan);
  const rawPrice = yearly ? plan.price_yearly : plan.price_monthly;
  const price = rawPrice == null ? NaN : Number(rawPrice);
  const features = Array.isArray(plan.features) ? plan.features : [];
  const visibleFeatures = compact ? features.slice(0, 4) : features;
  const headingId = `plan-${compact ? "summary" : "full"}-${plan.id}`;

  return (
    <article
      className={`oneix-plan-card${plan.popular ? " is-popular" : ""}${compact ? " is-compact" : ""}`}
      aria-labelledby={headingId}
      data-testid={`pricing-card-${plan.id}`}
    >
      <div className="oneix-plan-heading">
        <h3 id={headingId}>{plan.name}</h3>
        {plan.popular && <span className="oneix-plan-badge"><Sparkles size={13} aria-hidden="true" /> محبوب‌ترین</span>}
      </div>
      {!compact && <p className="oneix-plan-description">{plan.id === "free" ? "برای شروع حضور آنلاین" : plan.popular ? "برای رشد کسب‌وکار شما" : "برای تیم‌ها و کلینیک‌ها"}</p>}
      <div className="oneix-plan-price">
        <strong data-testid="plan-price">{price === 0 ? "رایگان" : Number.isFinite(price) ? price.toLocaleString("fa-IR") : "قیمت اعلام نشده"}</strong>
        <span>{price === 0 ? "برای همیشه" : yearly ? "سالانه" : "ماهانه"}</span>
        {yearly && price > 0 && <small>صرفه‌جویی معادل ۲ ماه</small>}
      </div>
      <ul className="oneix-plan-features">
        {visibleFeatures.map((feature, index) => <li key={`${feature}-${index}`}><Check size={15} aria-hidden="true" /><span>{feature}</span></li>)}
      </ul>
      {loading ? <Button disabled className="oneix-plan-cta" aria-busy="true">در حال بررسی حساب</Button> : (
        <Button asChild variant={plan.popular ? "default" : "outline"} className="oneix-plan-cta" data-testid={`pricing-cta-${plan.id}`}>
          <Link to={action.to}><span>{action.label}</span><ArrowLeft size={16} aria-hidden="true" /></Link>
        </Button>
      )}
    </article>
  );
}
