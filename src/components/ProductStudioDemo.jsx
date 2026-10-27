import React, { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Monitor, RotateCcw, Settings2, Smartphone } from "lucide-react";
import PagePreview from "@/components/PagePreview";
import BuilderCharacter from "@/components/BuilderCharacter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BRAND_PALETTES } from "@/lib/pageReadiness";
import { toFarsiDigits } from "@/lib/jalali";
import "@/styles/product-studio-demo.css";

const initialPage = () => ({ business_name: "استودیو زیبایی لیما", category: "زیبایی و مراقبت", bio: "مراقبت از زیبایی تو، با سلیقه و توجه به جزئیات.", booking: { enabled: true }, theme: { primary_color: "#4f46f7", accent_color: "#ff6b5e", button_style: "rounded" } });
const initialServices = () => [{ id: "skin", title: "پاکسازی پوست", duration_minutes: 45, price: 350000 }, { id: "consult", title: "مشاوره‌ی زیبایی", duration_minutes: 30, price: 200000 }];

export default function ProductStudioDemo() {
  const id = useId();
  const [page, setPage] = useState(initialPage);
  const [services, setServices] = useState(initialServices);
  const [device, setDevice] = useState("mobile");
  const [mobilePane, setMobilePane] = useState("editor");
  const [advanced, setAdvanced] = useState(false);
  const update = (key, value) => setPage((current) => ({ ...current, [key]: value }));
  const theme = (values) => setPage((current) => ({ ...current, theme: { ...current.theme, ...values } }));
  const service = (serviceId, key, value) => setServices((current) => current.map((item) => item.id === serviceId ? { ...item, [key]: value } : item));
  const reset = () => { setPage(initialPage()); setServices(initialServices()); setDevice("mobile"); setMobilePane("editor"); setAdvanced(false); };

  return (
    <section className="studio-showcase" aria-labelledby={id + "-title"}>
      <div className="studio-showcase-heading"><div><span>یک تجربه‌ی کوتاه از 1ix.ir</span><h2 id={id + "-title"}>بساز و همان لحظه ببین.</h2></div><p>نام و رنگت را انتخاب کن؛ نتیجه همین‌جاست.</p></div>
      <div className="studio-demo" data-mobile-pane={mobilePane}>
        <div className="studio-demo-mobile-switch" role="group" aria-label="نمایش دمو در موبایل"><button type="button" aria-pressed={mobilePane === "editor"} onClick={() => setMobilePane("editor")}>ویرایش</button><button type="button" aria-pressed={mobilePane === "preview"} onClick={() => setMobilePane("preview")}>دیدن نتیجه</button></div>
        <div className="studio-demo-workspace">
          <div className="studio-demo-editor">
            <span className="studio-demo-tag"><i /> دموی تعاملی</span>
            <h3>کمی بیشتر شبیه تو.</h3>
            <div className="studio-demo-fields"><label htmlFor={id + "-name"}>نام کسب‌وکار تو</label><Input id={id + "-name"} value={page.business_name} maxLength={50} onChange={(event) => update("business_name", event.target.value)} autoComplete="off" /></div>
            <div className="studio-demo-color-row"><span>رنگ برند</span><div className="studio-demo-palettes" role="group" aria-label="پالت‌های دموی صفحه">{BRAND_PALETTES.map((palette) => <button type="button" key={palette.id} title={palette.name} aria-label={palette.name} aria-pressed={page.theme.primary_color === palette.primary_color} onClick={() => theme({ primary_color: palette.primary_color, accent_color: palette.accent_color })} style={{ "--swatch": palette.primary_color }}>{page.theme.primary_color === palette.primary_color && <Check size={15} />}<span className="sr-only">{palette.name}</span></button>)}</div></div>
            <div className="studio-demo-tools"><Button type="button" variant="outline" size="sm" onClick={() => setAdvanced(true)}><Settings2 size={15} /> تنظیمات بیشتر</Button><button type="button" className="studio-demo-reset" onClick={reset} title="بازگرداندن نمونه‌ی اولیه" aria-label="بازگرداندن نمونه‌ی اولیه"><RotateCcw size={16} /></button></div>
            <div className="studio-demo-wani"><BuilderCharacter /><p>همین‌قدر ساده.<br /><strong>بقیه‌اش با سلیقه‌ی تو.</strong></p></div>
            <Link to="/signup" className="studio-demo-start">ساخت صفحه‌ی خودم <ArrowLeft size={16} /></Link>
          </div>
          <div className="studio-demo-canvas">
            <div className="studio-demo-canvas-toolbar"><span><i /> نتیجه‌ی زنده</span><div role="group" className="studio-demo-device" aria-label="دستگاه پیش‌نمایش دمو"><button type="button" aria-label="نمای موبایل دمو" aria-pressed={device === "mobile"} onClick={() => setDevice("mobile")}><Smartphone size={16} /></button><button type="button" aria-label="نمای دسکتاپ دمو" aria-pressed={device === "desktop"} onClick={() => setDevice("desktop")}><Monitor size={17} /></button></div></div>
            <div className="studio-demo-preview"><PagePreview page={page} services={services} device={device} compact /></div>
          </div>
        </div>
        <p className="studio-demo-footnote">نمونه‌ی آزمایشی · تغییرات این بخش منتشر نمی‌شوند.</p>
      </div>
      <Dialog open={advanced} onOpenChange={setAdvanced}>
        <DialogContent className="studio-demo-settings" dir="rtl">
          <DialogHeader><DialogTitle>جزئیاتِ دلخواه تو</DialogTitle><DialogDescription>این تنظیمات فقط پیش‌نمایش نمونه را تغییر می‌دهند.</DialogDescription></DialogHeader>
          <div className="studio-demo-settings-body">
            <label htmlFor={id + "-bio"}>معرفی کوتاه<textarea id={id + "-bio"} rows={2} maxLength={120} value={page.bio} onChange={(event) => update("bio", event.target.value)} /></label>
            <label htmlFor={id + "-category"}>حوزه‌ی فعالیت<select id={id + "-category"} value={page.category} onChange={(event) => update("category", event.target.value)}><option>زیبایی و مراقبت</option><option>کلینیک و مطب</option><option>خدمات تخصصی</option></select></label>
            <div><span className="studio-demo-label">فرم دکمه‌ها</span><div className="studio-demo-shapes" role="group" aria-label="فرم دکمه‌های دمو">{[["rounded", "نرم"], ["pill", "کپسولی"], ["square", "گوشه‌دار"]].map(([value, label]) => <button type="button" key={value} aria-pressed={page.theme.button_style === value} onClick={() => theme({ button_style: value })}>{label}</button>)}</div></div>
            <div className="studio-demo-custom-colors"><label>رنگ اصلی<input type="color" value={page.theme.primary_color} onChange={(event) => theme({ primary_color: event.target.value })} /></label><label>رنگ مکمل<input type="color" value={page.theme.accent_color} onChange={(event) => theme({ accent_color: event.target.value })} /></label></div>
            <details><summary>خدمات و نوبت‌دهی</summary>{services.map((item, index) => <fieldset key={item.id}><legend>خدمت {toFarsiDigits(index + 1)}</legend><label htmlFor={id + item.id}>عنوان<Input id={id + item.id} value={item.title} onChange={(event) => service(item.id, "title", event.target.value)} /></label><div className="studio-demo-service-numbers"><label htmlFor={id + item.id + "-price"}>قیمت · تومان<Input id={id + item.id + "-price"} type="number" min={0} step={1000} value={item.price} onChange={(event) => service(item.id, "price", Number(event.target.value) || 0)} /></label><label htmlFor={id + item.id + "-time"}>زمان · دقیقه<Input id={id + item.id + "-time"} type="number" min={5} max={480} value={item.duration_minutes} onChange={(event) => service(item.id, "duration_minutes", Number(event.target.value) || 5)} /></label></div></fieldset>)}<label className="studio-demo-booking-switch"><span>نمایش نوبت‌دهی</span><Switch checked={page.booking.enabled} onCheckedChange={(enabled) => update("booking", { enabled })} aria-label="نمایش نوبت‌دهی در دموی صفحه" /></label></details>
            <Button type="button" onClick={() => { setAdvanced(false); setMobilePane("preview"); }}>دیدن نتیجه <ArrowLeft size={16} /></Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
