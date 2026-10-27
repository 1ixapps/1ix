import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/api";
import JalaliDatePicker from "@/components/JalaliDatePicker";
import SlotPicker from "@/components/SlotPicker";
import SeoHead from "@/components/SeoHead";
import { absoluteUrl, pageSeo } from "../../shared/seo.mjs";
import BusinessPageContent from "@/components/BusinessPageContent";
import { normalizeBrandColor, contrastText } from "@/lib/businessPage";
import { formatJalaliDate, toFarsiDigits } from "@/lib/jalali";
import "@/styles/business-booking.css";

function localIsoDaysFromNow(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export default function PublicPage({ initialData } = {}) {
    const { username } = useParams();
    const [data, setData] = useState(initialData || null);
    const [err, setErr] = useState(null);
    const [bookOpen, setBookOpen] = useState(false);
    const [form, setForm] = useState({
        service_id: "",
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        date: "",
        time: "",
        notes: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [bookingResult, setBookingResult] = useState(null);

    useEffect(() => {
        let current = true;
        if (initialData?.page?.username !== username?.toLowerCase()) setData(null);
        setErr(null);
        api.get(`/public/page/${username}`)
            .then((response) => {
                if (!current) return;
                setData(response.data);
            })
            .catch((error) => {
                if (current) setErr(typeof error?.response?.data?.detail === "string" ? error.response.data.detail : "صفحه یافت نشد");
            });
        return () => { current = false; };
    }, [username, initialData]);

    const openBookingForService = (serviceId = "") => {
        setForm((current) => ({
            ...current,
            service_id: serviceId,
            date: current.date || localIsoDaysFromNow(1),
            time: "",
        }));
        setBookOpen(true);
    };

    const submitBooking = async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            const payload = { ...form };
            if (!payload.service_id) delete payload.service_id;
            const { data: result } = await api.post(`/public/page/${username}/book`, payload);
            const selectedService = data?.services?.find((service) => service.id === form.service_id);
            setBookingResult({
                message: result.message || "نوبت شما با موفقیت ثبت شد.",
                date: form.date,
                time: form.time,
                service: selectedService ? selectedService.title : null,
                customer_name: form.customer_name,
            });
            setBookOpen(false);
            setForm({ service_id: "", customer_name: "", customer_phone: "", customer_email: "", date: "", time: "", notes: "" });
        } catch (error) {
            toast.error(error?.response?.data?.detail || "خطا در ثبت نوبت");
        } finally {
            setSubmitting(false);
        }
    };

    const sharePage = async () => {
        try {
            if (navigator.share) {
                await navigator.share({ url: window.location.href, title: data?.page?.business_name });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("لینک کپی شد");
            }
        } catch (error) {
            if (error?.name !== "AbortError") toast.error("اشتراک‌گذاری انجام نشد. دوباره تلاش کنید.");
        }
    };

    if (err) {
        return (
            <div className="min-h-screen mesh-aurora grid place-items-center px-4">
                <div className="text-center surface-elev p-10 max-w-sm">
                    <div className="text-7xl font-black text-gradient mb-3">۴۰۴</div>
                    <SeoHead title="صفحه در دسترس نیست | وانیکس" description={err} canonical={absoluteUrl("/u/" + username)} noIndex />
                    <h1 className="text-2xl font-extrabold text-[var(--ink-900)] mb-2">{err}</h1>
                    <a href="/" className="text-[var(--brand-700)] hover:underline mt-3 inline-block font-semibold">بازگشت به 1ix.ir</a>
                </div>
            </div>
        );
    }

    if (!data) {
        return <div className="min-h-screen grid place-items-center text-[var(--ink-500)]">در حال بارگذاری...</div>;
    }

    const { page, services } = data;
    const seo = pageSeo("/u/" + username, page);
    const primary = normalizeBrandColor(page.theme?.primary_color);
    const serviceList = (services || []).filter((service) => service.active !== false);
    const selectedService = serviceList.find((service) => service.id === form.service_id);
    const bookingReady = Boolean(form.date && form.time && form.customer_name.trim() && form.customer_phone.trim());
    const bookingSteps = [
        { label: "خدمت", done: serviceList.length === 0 || Boolean(form.service_id) },
        { label: "زمان", done: Boolean(form.date && form.time) },
        { label: "اطلاعات", done: Boolean(form.customer_name.trim() && form.customer_phone.trim()) },
    ];

    return (
        <div className="bp-public-route">
            <SeoHead title={seo.title} description={seo.description} keywords={seo.keywords} canonical={absoluteUrl(seo.path)} />
            <BusinessPageContent page={page} services={serviceList} onBook={openBookingForService} onShare={sharePage} />

            <Dialog open={bookOpen} onOpenChange={setBookOpen}>
                <DialogContent dir="rtl" className="bp-booking-dialog" style={{ "--booking-primary": primary, "--booking-on-primary": contrastText(primary) }}>
                    <form onSubmit={submitBooking} className="flex max-h-[92vh] flex-col" data-testid="public-booking-form">
                        <div
                            className="bp-booking-header relative overflow-hidden px-5 py-5 sm:px-7 sm:py-6"
                            style={{ background: primary, color: contrastText(primary) }}
                        >
                            <div className="absolute inset-0 grid-overlay opacity-20" />
                            <DialogHeader className="relative text-start space-y-2">
                                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/14 px-3 py-1.5 text-[11px] font-black border border-white/20">
                                    <Calendar className="w-3.5 h-3.5" /> رزرو آنلاین
                                </span>
                                <DialogTitle className="text-2xl font-black leading-8">
                                    رزرو نوبت در {page.business_name}
                                </DialogTitle>
                                <DialogDescription className="bp-booking-description">خدمت، زمان آزاد و اطلاعات تماس را وارد کنید؛ ثبت رزرو با بررسی ظرفیت انجام می‌شود.</DialogDescription>
                            </DialogHeader>
                            <div className="relative mt-5 grid grid-cols-3 gap-2">
                                {bookingSteps.map((step, index) => (
                                    <div
                                        key={step.label}
                                        className={`bp-booking-step rounded-xl border px-3 py-2 text-xs font-black ${step.done ? "is-done" : ""}`}
                                    >
                                        <span className="ms-1 inline-grid h-5 w-5 place-items-center rounded-full bg-black/10 text-[10px]">
                                            {step.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : toFarsiDigits(index + 1)}
                                        </span>
                                        {step.label}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_18rem]">
                            <div className="px-5 py-5 sm:px-7 sm:py-6 space-y-5">
                                {serviceList.length > 0 && (
                                    <section>
                                        <Label className="text-[13px] font-black text-[var(--ink-900)]">انتخاب خدمت</Label>
                                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                            {serviceList.map((service) => {
                                                const selected = form.service_id === service.id;
                                                return (
                                                    <button
                                                        key={service.id}
                                                        type="button"
                                                        onClick={() => setForm({ ...form, service_id: service.id, time: "" })}
                                                        aria-pressed={selected}
                                                        className={`text-start rounded-xl border p-3 transition-all ${
                                                            selected
                                                                ? "border-[var(--brand-600)] bg-[var(--brand-50)] shadow-[var(--shadow-2)]"
                                                                : "border-[var(--line)] bg-white hover:border-[var(--brand-300)] hover:bg-gray-50"
                                                        }`}
                                                        data-testid={`public-book-service-${service.id}`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0">
                                                                <div className="font-black text-sm text-[var(--ink-900)] break-words">{service.title}</div>
                                                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-[var(--ink-500)]">
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" /> {toFarsiDigits(service.duration_minutes)} دقیقه
                                                                    </span>
                                                                    <span>{service.price ? `${service.price.toLocaleString("fa-IR")} تومان` : "رایگان"}</span>
                                                                </div>
                                                            </div>
                                                            <span
                                                                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                                                                    selected ? "border-[var(--brand-600)] bg-[var(--brand-600)] text-white" : "border-[var(--line-strong)] text-transparent"
                                                                }`}
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </section>
                                )}

                                <section className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label className="text-[13px] font-black text-[var(--ink-900)]">تاریخ مراجعه</Label>
                                        <div className="mt-2 rounded-xl border border-[var(--line)] bg-gray-50/60 p-2">
                                            <JalaliDatePicker
                                                value={form.date}
                                                onChange={(iso) => setForm({ ...form, date: iso, time: "" })}
                                                inputClass="border-0 bg-white shadow-sm"
                                                portal={false}
                                                testId="public-book-date"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-[13px] font-black text-[var(--ink-900)]">ساعت آزاد</Label>
                                        <div className="mt-2 rounded-xl border border-[var(--line)] bg-gray-50/60 p-2">
                                            <SlotPicker
                                                username={username}
                                                date={form.date}
                                                serviceId={form.service_id}
                                                value={form.time}
                                                onChange={(time) => setForm({ ...form, time })}
                                                testId="public-slot-picker"
                                            />
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <Label className="text-[13px] font-black text-[var(--ink-900)]">اطلاعات تماس</Label>
                                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                        <div>
                                            <Label htmlFor="booking-customer-name" className="mb-1.5 block">نام و نام خانوادگی</Label>
                                            <Input
                                                id="booking-customer-name"
                                                autoComplete="name"
                                                aria-label="نام و نام خانوادگی"
                                                value={form.customer_name}
                                                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                                                required
                                                placeholder="نام و نام خانوادگی"
                                                className="h-12 rounded-xl border-[var(--line-strong)] bg-white"
                                                data-testid="public-book-name"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="booking-customer-phone" className="mb-1.5 block">شماره تماس</Label>
                                            <Input
                                                id="booking-customer-phone"
                                                type="tel"
                                                autoComplete="tel"
                                                aria-label="شماره تماس"
                                                value={form.customer_phone}
                                                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                                                dir="ltr"
                                                required
                                                placeholder="۰۹۱۲۱۲۳۴۵۶۷"
                                                className="h-12 rounded-xl border-[var(--line-strong)] bg-white text-start"
                                                data-testid="public-book-phone"
                                            />
                                        </div>
                                    </div>
                                    <Textarea
                                        rows={3}
                                        aria-label="توضیحات رزرو"
                                        value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        placeholder="توضیح کوتاه برای پذیرش یا صاحب کسب‌وکار"
                                        className="mt-3 rounded-xl border-[var(--line-strong)] bg-white"
                                    />
                                </section>
                            </div>

                            <aside className="border-t border-[var(--line)] bg-gray-50/70 p-5 lg:border-t-0 lg:border-s">
                                <div className="bp-booking-summary sticky top-0 space-y-4">
                                    <div>
                                        <div className="text-xs font-black text-[var(--ink-500)]">خلاصه رزرو</div>
                                        <div className="mt-2 rounded-xl bg-white p-4 shadow-[var(--shadow-1)] border border-[var(--line)] space-y-3 text-sm">
                                            <div className="flex justify-between gap-3">
                                                <span className="text-[var(--ink-500)]">خدمت</span>
                                                <span className="font-black text-[var(--ink-900)] text-end">{selectedService?.title || (serviceList.length ? "انتخاب نشده" : "عمومی")}</span>
                                            </div>
                                            <div className="flex justify-between gap-3">
                                                <span className="text-[var(--ink-500)]">تاریخ</span>
                                                <span className="font-black text-[var(--ink-900)]">{form.date ? formatJalaliDate(form.date) : "انتخاب نشده"}</span>
                                            </div>
                                            <div className="flex justify-between gap-3">
                                                <span className="text-[var(--ink-500)]">ساعت</span>
                                                <span className="font-black text-[var(--ink-900)] persian-nums" dir="ltr">{form.time ? toFarsiDigits(form.time) : "انتخاب نشده"}</span>
                                            </div>
                                            <div className="flex justify-between gap-3">
                                                <span className="text-[var(--ink-500)]">مدت</span>
                                                <span className="font-black text-[var(--ink-900)]">
                                                    {selectedService?.duration_minutes ? `${toFarsiDigits(selectedService.duration_minutes)} دقیقه` : "بر اساس برنامه"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs leading-6 text-emerald-800">
                                        بعد از ثبت، درخواست برای کسب‌وکار ارسال می‌شود و وضعیت نوبت از پنل قابل پیگیری است.
                                    </div>
                                </div>
                            </aside>
                        </div>

                        <DialogFooter className="border-t border-[var(--line)] bg-white px-5 py-4 sm:px-7">
                            <Button
                                type="submit"
                                disabled={submitting || !bookingReady}
                                className="w-full h-12 rounded-xl text-white font-black shadow-[var(--shadow-glow)] disabled:shadow-none"
                                style={{ background: primary, color: contrastText(primary) }}
                                data-testid="public-book-submit"
                            >
                                {submitting ? "در حال ارسال..." : "ثبت و ارسال درخواست رزرو"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!bookingResult} onOpenChange={(open) => !open && setBookingResult(null)}>
                <DialogContent dir="rtl" className="sm:max-w-sm rounded-2xl border-0 surface-elev text-center">
                    <div className="mx-auto grid place-items-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 ring-4 ring-emerald-100 mb-3">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <DialogTitle className="text-xl font-black">نوبت شما ثبت شد</DialogTitle>
                    <DialogDescription className="text-sm text-[var(--ink-500)] leading-7">
                        {bookingResult?.message}
                    </DialogDescription>
                    {bookingResult && (
                        <div className="surface p-4 text-start mt-2 space-y-2 text-sm">
                            <div className="flex justify-between gap-3"><span className="text-[var(--ink-500)]">نام</span><span className="font-semibold">{bookingResult.customer_name}</span></div>
                            {bookingResult.service && (
                                <div className="flex justify-between gap-3"><span className="text-[var(--ink-500)]">خدمت</span><span className="font-semibold">{bookingResult.service}</span></div>
                            )}
                            <div className="flex justify-between gap-3"><span className="text-[var(--ink-500)]">تاریخ</span><span className="font-semibold">{formatJalaliDate(bookingResult.date)}</span></div>
                            <div className="flex justify-between gap-3"><span className="text-[var(--ink-500)]">ساعت</span><span className="font-semibold persian-nums" dir="ltr">{toFarsiDigits(bookingResult.time)}</span></div>
                        </div>
                    )}
                    <Button
                        onClick={() => setBookingResult(null)}
                        className="rounded-xl h-11 mt-2 bg-[var(--ink-900)] hover:bg-[var(--ink-700)] text-white"
                    >
                        بستن
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
