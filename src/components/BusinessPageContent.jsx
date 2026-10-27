import React, { useId, useState } from "react";
import {
  Phone, MessageCircle, Send, Instagram, MapPin, Mail, Globe, CalendarDays,
  Clock3, ArrowUpLeft, ArrowLeft, Share2, ImagePlus, Star, ChevronDown, Sparkles,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { fullUploadUrl } from "@/lib/api";
import BusinessHours from "@/components/BusinessHours";
import { toFarsiDigits } from "@/lib/jalali";
import {
  normalizeBrandColor, contrastText, servicePrice, priceListText,
  safeBusinessUrl, businessActionHref,
} from "@/lib/businessPage";
import "@/styles/business-page.css";

const ACTIONS = {
  call: { icon: Phone, label: "تماس تلفنی" }, whatsapp: { icon: MessageCircle, label: "واتساپ" },
  telegram: { icon: Send, label: "تلگرام" }, instagram: { icon: Instagram, label: "اینستاگرام" },
  location: { icon: MapPin, label: "مسیریابی" }, email: { icon: Mail, label: "ایمیل" },
  website: { icon: Globe, label: "وب‌سایت" }, custom: { icon: ArrowUpLeft, label: "مشاهده لینک" },
};

function SectionHeading({ title, eyebrow, count }) {
  return <div className="bp-section-heading"><div>{eyebrow && <span className="bp-eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>{count != null && <span className="bp-count">{toFarsiDigits(count)} مورد</span>}</div>;
}

function PreviewLink({ readOnly, children, ...props }) {
  return readOnly ? <div className={props.className}>{children}</div> : <a {...props}>{children}</a>;
}

function BookButton({ readOnly, onClick, children = "رزرو نوبت", className = "", testId }) {
  return readOnly
    ? <div className={`bp-button bp-button-primary ${className}`}><CalendarDays size={18} /><span>{children}</span><ArrowLeft size={17} /></div>
    : <button type="button" className={`bp-button bp-button-primary ${className}`} onClick={onClick} data-testid={testId}><CalendarDays size={18} /><span>{children}</span><ArrowLeft size={17} /></button>;
}

/** The exact same presentation is used by the public route and editor preview. */
export default function BusinessPageContent({ page, services = [], readOnly = false, onBook, onShare }) {
  const prefix = useId().replace(/:/g, "");
  const MainContent = readOnly ? "div" : "main";
  const [image, setImage] = useState(null);
  if (!page) return null;
  const primary = normalizeBrandColor(page.theme?.primary_color);
  const accent = normalizeBrandColor(page.theme?.accent_color, "#ff6b5e");
  const theme = {
    "--bp-primary": primary, "--bp-accent": accent, "--bp-on-primary": contrastText(primary),
    "--bp-tint": primary + "0c", "--bp-button-radius": page.theme?.button_style === "pill" ? "999px" : page.theme?.button_style === "square" ? "6px" : "14px",
  };
  const serviceList = (Array.isArray(services) ? services : []).filter((s) => s.active !== false);
  const actions = (page.actions || []).filter((a) => readOnly || businessActionHref(a));
  const canBook = page.booking?.enabled !== false;
  const hours = page.working_hours || [];
  const gallery = page.gallery || [];
  const testimonials = page.testimonials || [];
  const faqs = page.faqs || [];
  const prices = page.price_list || [];
  const mapUrl = safeBusinessUrl(page.map_url);
  const cover = page.cover_image || page.theme?.banner_url;
  const sections = [
    ...(serviceList.length ? [{ key: "services", label: "خدمات" }] : []),
    ...(page.about ? [{ key: "about", label: "درباره ما" }] : []),
    ...(gallery.length ? [{ key: "gallery", label: "نمونه‌کارها" }] : []),
    ...(testimonials.length ? [{ key: "reviews", label: "نظر مشتری‌ها" }] : []),
    ...(faqs.length ? [{ key: "faq", label: "سؤالات متداول" }] : []),
  ];
  return (
    <div className={`bp-surface ${readOnly ? "bp-readonly" : "bp-public"} ${canBook ? "bp-has-booking" : ""}`} style={theme} dir="rtl" data-testid="business-page-content">
      {!readOnly && <a className="bp-skip-link" href={`#${prefix}-main`}>رفتن به محتوای صفحه</a>}
      <div className="bp-topbar bp-wrap">
        <PreviewLink readOnly={readOnly} href="/" className="bp-platform"><Sparkles size={17} /><span>وانیکس</span></PreviewLink>
        <div className="bp-topbar-tools">
          {page.username && <span className="bp-page-address" dir="ltr">1ix.ir/u/{page.username}</span>}
          {!readOnly && onShare && <button type="button" className="bp-icon-button" onClick={onShare} aria-label="اشتراک‌گذاری صفحه"><Share2 size={18} /></button>}
        </div>
      </div>

      <header className="bp-hero bp-wrap">
        <div className={`bp-cover ${cover ? "has-image" : ""}`}>
          {cover ? <img src={fullUploadUrl(cover)} alt="" fetchPriority="high" /> : <div className="bp-cover-art" aria-hidden="true"><span /><span /><span /><i /><b /></div>}
          {page.category && <span className="bp-category"><Sparkles size={14} />{page.category}</span>}
        </div>
        <div className="bp-profile">
          <div className="bp-avatar">{page.profile_image ? <img src={fullUploadUrl(page.profile_image)} alt={`لوگوی ${page.business_name || "کسب‌وکار"}`} /> : <span>{page.business_name?.trim()?.[0] || "و"}</span>}</div>
          <div className="bp-identity">
            <span className="bp-eyebrow">{page.category || "صفحه رسمی کسب‌وکار"}</span>
            <h1 data-testid="public-page-name">{page.business_name || "نام کسب‌وکار شما"}</h1>
            {page.bio && <p className="bp-bio">{page.bio}</p>}
            {(page.location || page.address) && <p className="bp-location"><MapPin size={15} /><span>{page.location || page.address}</span></p>}
          </div>
          {canBook && <div className="bp-hero-cta"><BookButton readOnly={readOnly} onClick={() => onBook?.()} testId="public-book-cta" /><small>زمان‌های قابل رزرو را ببینید.</small></div>}
        </div>
        {sections.length > 1 && <nav className="bp-section-nav" aria-label="بخش‌های صفحه">{sections.map((s) => <PreviewLink readOnly={readOnly} key={s.key} href={`#${prefix}-${s.key}`}>{s.label}</PreviewLink>)}</nav>}
      </header>

      <div className={`bp-layout bp-wrap ${!canBook && !hours.length && !page.address && !mapUrl ? "bp-layout-single" : ""}`}>
        <MainContent className="bp-main" id={`${prefix}-main`}>
          {actions.length > 0 && <section className="bp-contact-section" aria-label="راه‌های ارتباط"><div className="bp-contact-grid">{actions.map((action, index) => {
            const meta = ACTIONS[action.type] || ACTIONS.custom; const Icon = meta.icon;
            return <PreviewLink readOnly={readOnly} key={index} href={businessActionHref(action)} target={["call", "email"].includes(action.type) ? undefined : "_blank"} rel="noreferrer" className="bp-contact" data-testid={`public-action-${action.type}-${index}`}><span className="bp-contact-icon"><Icon size={19} /></span><span>{action.label || meta.label}</span><ArrowUpLeft size={15} /></PreviewLink>;
          })}</div></section>}

          {serviceList.length > 0 && <section className="bp-section" id={`${prefix}-services`}><SectionHeading title="خدمات، به انتخاب شما" eyebrow="خدمات و نوبت‌ها" count={serviceList.length} /><div className="bp-services">{serviceList.map((service, index) => <article className="bp-service" key={service.id || index}>
            <div className="bp-service-head"><span className="bp-service-number">{toFarsiDigits(String(index + 1).padStart(2, "0"))}</span><h3>{service.title}</h3><span className="bp-duration"><Clock3 size={13} />{toFarsiDigits(service.duration_minutes)} دقیقه</span></div>
            {service.description && <p>{service.description}</p>}
            <div className="bp-service-bottom"><strong>{servicePrice(service.price)}</strong>{canBook && (readOnly ? <span className="bp-service-book">انتخاب و رزرو <ArrowLeft size={15} /></span> : <button type="button" className="bp-service-book" onClick={() => onBook?.(service.id)} aria-label={`رزرو ${service.title}`}>انتخاب و رزرو <ArrowLeft size={15} /></button>)}</div>
          </article>)}</div></section>}

          {page.about && <section className="bp-section" id={`${prefix}-about`}><SectionHeading title="کمی بیشتر درباره ما" eyebrow="آشنایی با مجموعه" /><p className="bp-prose">{page.about}</p></section>}

          {gallery.length > 0 && <section className="bp-section" id={`${prefix}-gallery`}><SectionHeading title="کار ما، از نزدیک" eyebrow="گالری و نمونه‌کارها" count={gallery.length} /><div className="bp-gallery">{gallery.map((item, index) => {
            const content = <><img src={fullUploadUrl(item.url)} alt={item.caption || `نمونه‌کار ${toFarsiDigits(index + 1)}`} loading="lazy" />{item.caption && <span className="bp-gallery-caption">{item.caption}</span>}{!readOnly && <span className="bp-gallery-open"><ImagePlus size={17} /></span>}</>;
            return readOnly ? <div className="bp-gallery-item" key={item.id || index}>{content}</div> : <button type="button" className="bp-gallery-item" key={item.id || index} onClick={() => setImage(item)} aria-label={`مشاهده تصویر: ${item.caption || "نمونه‌کار " + toFarsiDigits(index + 1)}`}>{content}</button>;
          })}</div></section>}

          {prices.length > 0 && <section className="bp-section"><SectionHeading title="تعرفه‌ی خدمات" eyebrow="شفاف، قبل از انتخاب" /><ul className="bp-prices">{prices.map((item, index) => <li key={item.id || index}><div><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}</div><strong>{priceListText(item.price)}</strong></li>)}</ul></section>}

          {testimonials.length > 0 && <section className="bp-section" id={`${prefix}-reviews`}><SectionHeading title="از نگاه مشتری‌ها" eyebrow="تجربه‌ی همراهی با ما" /><div className="bp-reviews">{testimonials.map((item, index) => <figure className="bp-review" key={item.id || index}><div className="bp-rating" aria-label={`امتیاز ${toFarsiDigits(Math.max(0, Math.min(5, Number(item.rating) || 0)))} از ۵`}>{Array.from({ length: Math.max(0, Math.min(5, Number(item.rating) || 0)) }).map((_, i) => <Star key={i} size={14} fill="currentColor" aria-hidden="true" />)}</div><blockquote>«{item.text}»</blockquote><figcaption><span>{item.author?.[0] || "م"}</span>{item.author}</figcaption></figure>)}</div></section>}

          {faqs.length > 0 && <section className="bp-section" id={`${prefix}-faq`}><SectionHeading title="پاسخِ سؤال‌های شما" eyebrow="قبل از مراجعه" /><div className="bp-faqs">{faqs.map((item, index) => <details key={item.id || index}><summary><span>{item.question}</span><ChevronDown size={17} /></summary><p>{item.answer}</p></details>)}</div></section>}
          {!serviceList.length && !page.about && !gallery.length && !actions.length && !prices.length && !testimonials.length && !faqs.length && readOnly && <div className="bp-empty"><Sparkles size={25} /><h2>صفحه‌ات از اینجا شروع می‌شود.</h2><p>معرفی، خدمات یا راه‌های ارتباطی را اضافه کن تا اینجا ببینی.</p></div>}
        </MainContent>

        {(canBook || hours.length > 0 || page.address || mapUrl) && <aside className="bp-sidebar" aria-label="اطلاعات مراجعه">
          {canBook && <section className="bp-booking-card"><span className="bp-booking-icon"><CalendarDays size={23} /></span><span className="bp-eyebrow">وقتِ رسیدگی به شما</span><h2>یک زمان، مخصوص شما.</h2><p>خدمت موردنظر و زمان خالی را انتخاب کنید؛ درخواستتان برای مجموعه ارسال می‌شود.</p><BookButton readOnly={readOnly} onClick={() => onBook?.()} /><span className="bp-booking-note"><Clock3 size={13} /> فقط زمان‌های واقعیِ قابل رزرو</span></section>}
          <BusinessHours hours={hours} />
          {(page.address || mapUrl) && <section className="bp-side-card"><h2><MapPin size={18} />راهِ رسیدن به ما</h2>{page.address && <p className="bp-prose">{page.address}</p>}{mapUrl && <PreviewLink readOnly={readOnly} href={mapUrl} target="_blank" rel="noreferrer" className="bp-map-link">مسیریابی روی نقشه <ArrowUpLeft size={16} /></PreviewLink>}</section>}
          {page.username && <div className="bp-share-card"><span>یک لینک برای همیشه در دسترس بودن.</span><bdi>1ix.ir/u/{page.username}</bdi>{!readOnly && onShare && <button type="button" onClick={onShare}><Share2 size={15} /> اشتراک‌گذاری صفحه</button>}</div>}
        </aside>}
      </div>
      <footer className="bp-footer bp-wrap"><span>{page.business_name}</span><PreviewLink readOnly={readOnly} href="/">ساخته‌شده با <b>وانیکس</b><ArrowUpLeft size={13} /></PreviewLink></footer>
      {!readOnly && canBook && <div className="bp-mobile-booking"><BookButton onClick={() => onBook?.()} /></div>}
      {!readOnly && <Dialog open={!!image} onOpenChange={(open) => !open && setImage(null)}><DialogContent className="bp-image-dialog" dir="rtl"><DialogTitle>{image?.caption || "نمایش نمونه‌کار"}</DialogTitle><DialogDescription className="sr-only">تصویر گالری {page.business_name}</DialogDescription>{image && <img src={fullUploadUrl(image.url)} alt={image.caption || "نمونه‌کار"} />}</DialogContent></Dialog>}
    </div>
  );
}
