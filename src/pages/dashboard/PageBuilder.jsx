import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ImagePlus, Save, Plus,
    Phone, MessageCircle, Send, Instagram, MapPin, Mail, Globe, Sparkles, X, Check, WandSparkles, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import api, { uploadFile, fullUploadUrl } from "@/lib/api";
import StudioPreview from "@/components/StudioPreview";
import WaniGuide from "@/components/WaniGuide";
import { BRAND_PALETTES, reconcileSavedPage, suggestedSeo } from "@/lib/pageReadiness";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import EditorPageHeader from "@/components/EditorPageHeader";
import BuilderCharacter from "@/components/BuilderCharacter";
import JalaliDatePicker from "@/components/JalaliDatePicker";
import { formatJalaliDate, toFarsiDigits } from "@/lib/jalali";
import { TEMPLATES, getTemplate } from "@/lib/templates";
import BusinessCategorySelect, { templateCategory } from "@/components/BusinessCategorySelect";
import BuilderSettingsNav, { BuilderSectionHeading } from "@/components/BuilderSettingsNav";
import WorkingHoursEditor from "@/components/WorkingHoursEditor";
import "@/styles/builder-settings.css";

const ACTION_TYPES = [
    { value: "call", label: "تماس تلفنی", icon: Phone },
    { value: "whatsapp", label: "واتساپ", icon: MessageCircle },
    { value: "telegram", label: "تلگرام", icon: Send },
    { value: "instagram", label: "اینستاگرام", icon: Instagram },
    { value: "location", label: "نقشه/آدرس", icon: MapPin },
    { value: "email", label: "ایمیل", icon: Mail },
    { value: "website", label: "وب‌سایت", icon: Globe },
];

const DRAFT_STORAGE_PREFIX = "vanix:builder:draft:";

function draftKey(pageId) {
    return DRAFT_STORAGE_PREFIX + String(pageId);
}

function readDraft(pageId) {
    try {
        const raw = window.localStorage.getItem(draftKey(pageId));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function ImageUpload({ value, onChange, label = "تصویر", testId }) {
    const fileRef = useRef(null);
    const [busy, setBusy] = useState(false);

    const handle = async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setBusy(true);
        try {
            const { data } = await uploadFile(f);
            onChange(data.url);
            toast.success("تصویر آپلود شد");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "خطا در آپلود");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            <Label className="block mb-1.5">{label}</Label>
            <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-xl bg-gray-100 grid place-items-center overflow-hidden border border-gray-200">
                    {value ? (
                        <img src={fullUploadUrl(value)} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <ImagePlus className="w-5 h-5 text-gray-400" />
                    )}
                </div>
                <div className="flex gap-2">
                    <input ref={fileRef} type="file" accept="image/*" onChange={handle} className="hidden" data-testid={`${testId}-input`} />
                    <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={busy} data-testid={`${testId}-btn`}>
                        {busy ? "در حال آپلود…" : "انتخاب تصویر"}
                    </Button>
                    {value && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)} className="text-red-600">
                            حذف
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PageBuilder() {
    const [page, setPage] = useState(null);
    const [tab, setTab] = useState("basic");
    const [previewOpen, setPreviewOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [loadError, setLoadError] = useState("");
    const saveInFlight = useRef(false);
    const latestDraft = useRef(null);
    const navigate = useNavigate();
    const editorRef = useRef(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [originalPage, setOriginalPage] = useState(null);
    const [recoverableDraft, setRecoverableDraft] = useState(null);
    const [draftHydrated, setDraftHydrated] = useState(false);

    // create form
    const [createForm, setCreateForm] = useState({ username: "", business_name: "", category: "", bio: "" });
    const [templateId, setTemplateId] = useState("blank");
    const [usernameOk, setUsernameOk] = useState(null);
    const [usernameError, setUsernameError] = useState("");

    useEffect(() => {
        Promise.all([
            api.get("/pages/me").then((r) => {
                const snapshot = r.data ? JSON.stringify(r.data) : null;
                setPage(r.data);
                setOriginalPage(snapshot);
                if (r.data?.id) {
                    const saved = readDraft(r.data.id);
                    if (saved?.page && JSON.stringify(saved.page) !== snapshot) setRecoverableDraft(saved);
                }
                setDraftHydrated(true);
            }).catch((error) => { if (error?.response?.status === 404) { setPage(null); setDraftHydrated(true); } else setLoadError("صفحه بارگذاری نشد. اتصال را بررسی و دوباره تلاش کن."); }),
            api.get("/services").then((r) => setServices(r.data)).catch(() => setLoadError("خدمات بارگذاری نشد. برای دیدن اطلاعات کامل دوباره تلاش کن.")),
        ]).finally(() => setLoading(false));
    }, []);

    useEffect(() => { latestDraft.current = page; }, [page]);

    // Track dirty state
    useEffect(() => {
        if (!page || !originalPage) return;
        setDirty(JSON.stringify(page) !== originalPage);
    }, [page, originalPage]);

    useEffect(() => {
        let cancelled = false;
        setUsernameOk(null);
        setUsernameError("");
        if (createForm.username.length < 3) return;
        const timer = setTimeout(async () => {
            try {
                const { data } = await api.get(`/pages/check-username/${createForm.username}`);
                if (!cancelled) setUsernameOk(data.available);
            } catch {
                if (!cancelled) setUsernameError("بررسی آدرس فعلاً ممکن نیست؛ هنگام ساخت دوباره بررسی می‌شود.");
            }
        }, 400);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [createForm.username]);

    const createPage = async (e) => {
        e.preventDefault();
        if (creating) return;
        setCreating(true);
        try {
            const tmpl = getTemplate(templateId) || getTemplate("blank");
            const payload = {
                username: createForm.username,
                business_name: createForm.business_name,
                category: createForm.category || tmpl.category || null,
                bio: createForm.bio || tmpl.bio || null,
            };
            const { data: created } = await api.post("/pages", payload);
            setPage(created);
            setOriginalPage(JSON.stringify(created));
            // Apply template extras via PATCH if not blank
            if (templateId !== "blank") {
                const patchBody = {
                    actions: tmpl.actions,
                    working_hours: tmpl.working_hours,
                    booking: tmpl.booking,
                    theme: tmpl.theme,
                };
                const { data: patched } = await api.patch("/pages/me", patchBody);
                setPage(patched);
                setOriginalPage(JSON.stringify(patched));
                // Create suggested services
                if ((tmpl.services || []).length > 0) {
                    const created_services = [];
                    for (const s of tmpl.services) {
                        try {
                            const { data: sv } = await api.post("/services", s);
                            created_services.push(sv);
                        } catch (_) {}
                    }
                    if (created_services.length > 0) setServices((prev) => [...created_services, ...prev]);
                }
            } else {
                setPage(created);
                setOriginalPage(JSON.stringify(created));
            }
            toast.success(`صفحه ${tmpl.id === "blank" ? "خالی" : "با قالب «" + tmpl.title + "»"} ساخته شد!`);
        } catch (err) {
            toast.error(err?.response?.data?.detail || "ساخت صفحه انجام نشد.");
        } finally {
            setCreating(false);
        }
    };

    const save = useCallback(async (overrides = null) => {
        if (saveInFlight.current || !page) return false;
        saveInFlight.current = true;
        setSaving(true);
        const submittedDraft = page;
        try {
            const payload = { ...submittedDraft, ...(overrides || {}) };
            const { data } = await api.patch("/pages/me", payload);
            const changedWhileSaving = JSON.stringify(latestDraft.current) !== JSON.stringify(submittedDraft);
            setPage((current) => reconcileSavedPage(data, submittedDraft, current));
            setOriginalPage(JSON.stringify(data));
            toast.success(overrides?.published === true ? "صفحه منتشر شد" : "تغییرات ذخیره شد");
            if (changedWhileSaving) toast.info("ویرایش جدیدت هنوز ذخیره نشده است؛ آن را هم ذخیره کن.");
            if (!changedWhileSaving) {
                try { window.localStorage.removeItem(draftKey(submittedDraft.id)); } catch {}
                setRecoverableDraft(null);
            }
            return !changedWhileSaving;
        } catch (err) {
            toast.error(err?.response?.data?.detail || "ذخیره انجام نشد. تغییراتت در ویرایشگر باقی مانده‌اند.");
            return false;
        } finally {
            saveInFlight.current = false;
            setSaving(false);
        }
    }, [page]);

    useEffect(() => {
        const guard = (event) => {
            if (!dirty) return;
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", guard);
        return () => window.removeEventListener("beforeunload", guard);
    }, [dirty]);

    useEffect(() => {
        const shortcut = (event) => {
            if (page && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
                event.preventDefault();
                if (dirty) save();
            }
        };
        window.addEventListener("keydown", shortcut);
        return () => window.removeEventListener("keydown", shortcut);
    }, [page, dirty, save]);

    const guideAction = async (item) => {
        if (item.href) {
            if (dirty && !(await save())) return;
            navigate(item.href);
        } else {
            setTab(item.tab);
            requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
        }
    };

    const restoreDraft = () => {
        if (!recoverableDraft?.page) return;
        setPage(recoverableDraft.page);
        setRecoverableDraft(null);
        toast.success("پیش‌نویس محلی بازیابی شد");
    };
    const discardDraft = () => {
        if (!page?.id) return;
        try { window.localStorage.removeItem(draftKey(page.id)); } catch {}
        setRecoverableDraft(null);
    };

    const togglePublish = async () => {
        const next = !page.published;
        await save({ published: next });
    };

    // helper setters
    const set = (k, v) => setPage((p) => ({ ...p, [k]: v }));
    const addAction = () => set("actions", [...(page.actions || []), { type: "call", label: "", value: "" }]);
    const updateAction = (i, field, v) => {
        const arr = [...(page.actions || [])];
        arr[i] = { ...arr[i], [field]: v };
        set("actions", arr);
    };
    const removeAction = (i) => set("actions", (page.actions || []).filter((_, idx) => idx !== i));

    const addGallery = (url) => set("gallery", [...(page.gallery || []), { id: crypto.randomUUID(), url, caption: "" }]);
    const removeGallery = (id) => set("gallery", (page.gallery || []).filter((g) => g.id !== id));

    const addFAQ = () => set("faqs", [...(page.faqs || []), { id: crypto.randomUUID(), question: "", answer: "" }]);
    const updateFAQ = (i, k, v) => {
        const arr = [...(page.faqs || [])];
        arr[i] = { ...arr[i], [k]: v };
        set("faqs", arr);
    };
    const removeFAQ = (i) => set("faqs", (page.faqs || []).filter((_, idx) => idx !== i));

    const addTestimonial = () => set("testimonials", [...(page.testimonials || []), { id: crypto.randomUUID(), author: "", text: "", rating: 5 }]);
    const updateTestimonial = (i, k, v) => {
        const arr = [...(page.testimonials || [])];
        arr[i] = { ...arr[i], [k]: v };
        set("testimonials", arr);
    };
    const removeTestimonial = (i) => set("testimonials", (page.testimonials || []).filter((_, idx) => idx !== i));

    const addPrice = () => set("price_list", [...(page.price_list || []), { id: crypto.randomUUID(), title: "", price: "", description: "" }]);
    const updatePrice = (i, k, v) => {
        const arr = [...(page.price_list || [])];
        arr[i] = { ...arr[i], [k]: v };
        set("price_list", arr);
    };
    const removePrice = (i) => set("price_list", (page.price_list || []).filter((_, idx) => idx !== i));


    if (loadError) return <div className="pro-error-state" role="alert"><h1>اطلاعات کامل دریافت نشد.</h1><p>{loadError}</p><Button onClick={() => window.location.reload()}>تلاش دوباره</Button></div>;

    if (loading) return <div className="text-[var(--ink-500)] py-12 text-center">در حال بارگذاری…</div>;

    if (!page) {
        return (
            <div className="v4-builder-onboarding max-w-4xl mx-auto">
                <div className="v4-builder-welcome">
                    <div>
                        <span className="v4-studio-label">استودیوی صفحه‌سازی</span>
                        <h1>اینجا، صفحه‌ات شکل می‌گیرد.</h1>
                        <p>قالب دلخواهت را انتخاب کن؛ بعد با سلیقه‌ی خودت بسازش.</p>
                    </div>
                    <BuilderCharacter />
                </div>

                {/* Template grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8" data-testid="template-grid">
                    {TEMPLATES.map((t) => {
                        const selected = templateId === t.id;
                        const { icon: TemplateIcon, tone } = templateCategory(t.id);
                        return (
                            <button
                                type="button"
                                key={t.id}
                                aria-pressed={selected}
                                onClick={() => {
                                    setTemplateId(t.id);
                                    if (t.category && !createForm.category) {
                                        setCreateForm((s) => ({ ...s, category: t.category }));
                                    }
                                }}
                                data-testid={`template-${t.id}`}
                                className={`builder-template-card text-start p-4 rounded-2xl border-2 transition-all hover-lift ${
                                    selected
                                        ? "border-[var(--brand-600)] bg-[var(--brand-50)]/60 shadow-[var(--shadow-2)]"
                                        : "border-[var(--line)] bg-white hover:border-[var(--brand-300)]"
                                }`}
                            >
                                <span className={`builder-template-icon is-${tone} ${selected ? "is-selected" : ""}`}><TemplateIcon className="h-5 w-5" aria-hidden="true" /></span>
                                <div className="font-bold text-sm text-[var(--ink-900)]">{t.title}</div>
                                <div className="text-xs text-[var(--ink-500)] mt-1 line-clamp-2">{t.description}</div>
                                {selected && (
                                    <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-[var(--brand-700)] font-bold">
                                        <Sparkles className="w-3 h-3" /> انتخاب شده
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="surface-elev p-6 sm:p-8">
                    <form onSubmit={createPage} className="space-y-4" data-testid="create-page-form">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-[13px] font-semibold">نام کسب‌وکار</Label>
                                <Input
                                    value={createForm.business_name}
                                    onChange={(e) => setCreateForm({ ...createForm, business_name: e.target.value })}
                                    className="mt-1.5 h-11 rounded-xl border-[var(--line-strong)]"
                                    placeholder="مثلاً مطب دکتر احمدی"
                                    required
                                    data-testid="create-business-name"
                                />
                            </div>
                            <div>
                                <Label htmlFor="create-page-category" className="text-[13px] font-semibold">دسته‌بندی</Label>
                                <BusinessCategorySelect id="create-page-category" testId="create-category" value={createForm.category} onValueChange={(v) => setCreateForm({ ...createForm, category: v })} />
                            </div>
                        </div>
                        <div>
                            <Label className="text-[13px] font-semibold">آدرس اختصاصی</Label>
                            <div className="mt-1.5 flex items-stretch border border-[var(--line-strong)] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[var(--brand-500)]/30">
                                <span className="bg-[var(--brand-50)]/40 px-3 grid place-items-center text-sm text-[var(--ink-500)] font-mono border-e border-[var(--line)]" dir="ltr">1ix.ir/u/</span>
                                <Input
                                    value={createForm.username}
                                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value.replace(/[^a-zA-Z0-9_\-]/g, "").toLowerCase() })}
                                    className="border-0 focus-visible:ring-0 text-start h-11"
                                    dir="ltr"
                                    placeholder="dr-ahmadi"
                                    minLength={3} maxLength={40}
                                    required
                                    data-testid="create-username"
                                />
                            </div>
                            {createForm.username.length >= 3 && (
                                <p className={`text-xs mt-1.5 font-semibold ${usernameOk ? "text-emerald-600" : "text-rose-500"}`}>
                                    {usernameError || (usernameOk === null ? "در حال بررسی…" : usernameOk ? "✓ این آدرس در دسترس است" : "✕ این آدرس قبلاً استفاده شده")}
                                </p>
                            )}
                        </div>
                        <div>
                            <Label className="text-[13px] font-semibold">بیو کوتاه (اختیاری)</Label>
                            <Textarea
                                value={createForm.bio}
                                onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })}
                                className="mt-1.5 rounded-xl border-[var(--line-strong)]"
                                placeholder={templateId !== "blank" ? `پیش‌فرض قالب: ${getTemplate(templateId).bio.slice(0, 60)}...` : "چند خط درباره خدمات شما"}
                                rows={3}
                            />
                            {templateId !== "blank" && !createForm.bio && (
                                <p className="text-xs text-[var(--ink-500)] mt-1">اگر خالی بگذارید، متن پیش‌فرض قالب استفاده می‌شود.</p>
                            )}
                        </div>
                        <Button type="submit" disabled={creating || usernameOk === false} aria-busy={creating} className="w-full h-11 rounded-xl bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white font-semibold shadow-[var(--shadow-glow)]" data-testid="create-page-submit">
                            <Sparkles className="w-4 h-4 ms-1.5" />
                            {creating ? "در حال ساخت…" : templateId === "blank" ? "ساخت صفحه‌" : `ساخت صفحه با قالب «${getTemplate(templateId).title}»`}
                        </Button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="v3-builder-page luxury-builder-page dashboard-page editor-workbench space-y-6" data-dirty={dirty}>
            <EditorPageHeader page={page} dirty={dirty} saving={saving} onSave={() => save()} onPublish={togglePublish} onPreview={() => setPreviewOpen(true)} />

            {recoverableDraft?.page && (
                <div className="builder-draft-recovery" role="status">
                    <div><strong>یک پیش‌نویس ذخیره‌نشده پیدا شد.</strong><span> آخرین ویرایش مرورگر را قبل از ادامه بررسی کن.</span></div>
                    <div className="builder-draft-recovery-actions">
                        <Button type="button" size="sm" onClick={restoreDraft}>بازیابی پیش‌نویس</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={discardDraft}>نادیده گرفتن</Button>
                    </div>
                </div>
            )}
            <details className="editor-guide-disclosure"><summary><span><Sparkles size={16} aria-hidden="true" /> راهنمای وانی</span><span>کمک برای تکمیل صفحه <ChevronDown size={16} className="editor-guide-chevron" aria-hidden="true" /></span></summary><WaniGuide page={page} services={services} busy={saving} onAction={guideAction} onPreview={() => setPreviewOpen(true)} /></details>

            <div ref={editorRef} className="luxury-builder builder-workspace grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,.75fr)]">
                <div className="min-w-0">
            <Tabs value={tab} onValueChange={setTab} className="v3-builder-tabs w-full" dir="rtl">
                <BuilderSettingsNav />

                <TabsContent value="basic" className="editor-panel space-y-4">
                    <BuilderSectionHeading section="basic" />
                    <div className="surface-elev p-6 space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <ImageUpload value={page.profile_image} onChange={(v) => set("profile_image", v)} label="تصویر پروفایل / لوگو" testId="upload-profile" />
                            <ImageUpload value={page.cover_image} onChange={(v) => set("cover_image", v)} label="تصویر بنر / کاور" testId="upload-cover" />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="page-business-name">نام کسب‌وکار</Label>
                                <Input id="page-business-name" value={page.business_name || ""} onChange={(e) => set("business_name", e.target.value)} className="mt-1.5" data-testid="page-business-name" />
                            </div>
                            <div>
                                <Label htmlFor="page-category">دسته‌بندی</Label>
                                <BusinessCategorySelect id="page-category" testId="page-category" value={page.category} onValueChange={(v) => set("category", v)} />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="page-bio">معرفی کوتاه</Label>
                            <Textarea id="page-bio" value={page.bio || ""} onChange={(e) => set("bio", e.target.value)} rows={3} className="mt-1.5" />
                        </div>
                        <div>
                            <Label htmlFor="page-about">درباره کسب‌وکار</Label>
                            <Textarea id="page-about" value={page.about || ""} onChange={(e) => set("about", e.target.value)} rows={5} className="mt-1.5" />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="page-address">نشانی و شهر</Label>
                                <Input id="page-address" value={page.address || ""} onChange={(e) => set("address", e.target.value)} className="mt-1.5" />
                            </div>
                            <div>
                                <Label htmlFor="page-map">لینک نقشه</Label>
                                <Input id="page-map" value={page.map_url || ""} onChange={(e) => set("map_url", e.target.value)} className="mt-1.5" dir="ltr" placeholder="https://..." />
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="actions" className="editor-panel space-y-4">
                    <BuilderSectionHeading section="actions" />
                    <div className="surface-elev p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">دکمه‌های تماس</h3>
                            <Button onClick={addAction} size="sm" variant="outline" data-testid="add-action"><Plus className="w-4 h-4 ms-1" /> افزودن</Button>
                        </div>
                        {(page.actions || []).length === 0 && <p className="text-sm text-gray-500">هنوز دکمه‌ای اضافه نکرده‌اید.</p>}
                        <div className="space-y-3">
                            {(page.actions || []).map((a, i) => (
                                <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-3 rounded-xl border border-gray-100">
                                    <div className="sm:col-span-3">
                                        <Select value={a.type} onValueChange={(v) => updateAction(i, "type", v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {ACTION_TYPES.map(({ value, label, icon: ActionIcon }) => (<SelectItem key={value} value={value}><span className="builder-category-value"><ActionIcon size={17} aria-hidden="true" /><span>{label}</span></span></SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Input className="sm:col-span-4" placeholder="برچسب (اختیاری)" value={a.label || ""} onChange={(e) => updateAction(i, "label", e.target.value)} />
                                    <Input className="sm:col-span-4" placeholder="مقدار/لینک" dir="ltr" value={a.value || ""} onChange={(e) => updateAction(i, "value", e.target.value)} />
                                    <Button size="sm" variant="ghost" className="text-red-600 sm:col-span-1" aria-label={`حذف راه ارتباطی ${toFarsiDigits(i + 1)}`} onClick={() => removeAction(i)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="hours" className="editor-panel space-y-4">
                    <BuilderSectionHeading section="hours" />
                    <WorkingHoursEditor hours={page.working_hours || []} onChange={(next) => set("working_hours", next)} />
                </TabsContent>

                <TabsContent value="gallery" className="editor-panel space-y-4">
                    <BuilderSectionHeading section="gallery" />
                    <div className="surface-elev p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">گالری تصاویر</h3>
                            <ImageUpload value={null} onChange={addGallery} label="افزودن تصویر جدید" testId="upload-gallery" />
                        </div>
                        {(page.gallery || []).length === 0 ? (
                            <p className="text-sm text-gray-500">هنوز تصویری در گالری نیست.</p>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {(page.gallery || []).map((g) => (
                                    <div key={g.id} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                                        <img src={fullUploadUrl(g.url)} alt="" className="w-full h-full object-cover" />
                                        <button type="button" aria-label="حذف تصویر گالری" onClick={() => removeGallery(g.id)} className="builder-gallery-remove absolute top-1 end-1 rounded-full">
                                            <X className="w-3.5 h-3.5 text-red-600" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="content" className="editor-panel space-y-4">
                    <BuilderSectionHeading section="content" />
                    {/* FAQ */}
                    <div className="surface-elev p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">سوالات متداول</h3>
                            <Button size="sm" variant="outline" onClick={addFAQ}><Plus className="w-4 h-4 ms-1" /> افزودن</Button>
                        </div>
                        <div className="space-y-3">
                            {(page.faqs || []).map((f, i) => (
                                <div key={f.id} className="p-3 rounded-xl border border-gray-100 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">سوال #{toFarsiDigits(i + 1)}</span>
                                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => removeFAQ(i)}><X className="w-4 h-4" /></Button>
                                    </div>
                                    <Input placeholder="سوال" value={f.question} onChange={(e) => updateFAQ(i, "question", e.target.value)} />
                                    <Textarea placeholder="پاسخ" rows={2} value={f.answer} onChange={(e) => updateFAQ(i, "answer", e.target.value)} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Testimonials */}
                    <div className="surface-elev p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">نظرات مشتریان</h3>
                            <Button size="sm" variant="outline" onClick={addTestimonial}><Plus className="w-4 h-4 ms-1" /> افزودن</Button>
                        </div>
                        <div className="space-y-3">
                            {(page.testimonials || []).map((t, i) => (
                                <div key={t.id} className="p-3 rounded-xl border border-gray-100 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">نظر #{toFarsiDigits(i + 1)}</span>
                                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => removeTestimonial(i)}><X className="w-4 h-4" /></Button>
                                    </div>
                                    <Input placeholder="نام نویسنده" value={t.author} onChange={(e) => updateTestimonial(i, "author", e.target.value)} />
                                    <Textarea placeholder="متن نظر" rows={2} value={t.text} onChange={(e) => updateTestimonial(i, "text", e.target.value)} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Price list */}
                    <div className="surface-elev p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold">لیست قیمت</h3>
                            <Button size="sm" variant="outline" onClick={addPrice}><Plus className="w-4 h-4 ms-1" /> افزودن</Button>
                        </div>
                        <div className="space-y-3">
                            {(page.price_list || []).map((p, i) => (
                                <div key={p.id} className="grid grid-cols-12 gap-2 items-center p-3 rounded-xl border border-gray-100">
                                    <Input className="col-span-5" placeholder="عنوان" value={p.title} onChange={(e) => updatePrice(i, "title", e.target.value)} />
                                    <Input className="col-span-3" placeholder="قیمت" value={p.price} onChange={(e) => updatePrice(i, "price", e.target.value)} />
                                    <Input className="col-span-3" placeholder="توضیح" value={p.description || ""} onChange={(e) => updatePrice(i, "description", e.target.value)} />
                                    <Button size="sm" variant="ghost" className="text-red-600 col-span-1" onClick={() => removePrice(i)}><X className="w-4 h-4" /></Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="theme" className="editor-panel space-y-4">
                    <BuilderSectionHeading section="theme" />
                    <div className="surface-elev p-6 space-y-4">
                        <h3 className="font-bold">هویت بصری صفحه</h3>
                        <div className="pro-palette-grid" role="group" aria-label="پالت‌های آماده‌ی برند">
                            {BRAND_PALETTES.map((palette) => {
                                const selected = page.theme?.primary_color === palette.primary_color && page.theme?.accent_color === palette.accent_color;
                                return <button type="button" key={palette.id} className="pro-palette" aria-pressed={selected}
                                    onClick={() => set("theme", { ...(page.theme || {}), primary_color: palette.primary_color, accent_color: palette.accent_color })}>
                                    <span className="pro-palette-swatches"><i style={{ background: palette.primary_color }} /><i style={{ background: palette.accent_color }} /></span>
                                    <span>{palette.name}</span>{selected && <Check size={14} />}
                                </button>;
                            })}
                        </div>
                        <p className="pro-field-hint">یک ترکیب آماده انتخاب کن یا رنگ‌های دلخواهت را تنظیم کن. تا ذخیره نکنی، صفحه‌ی عمومی تغییر نمی‌کند.</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <Label>رنگ اصلی</Label>
                                <Input type="color" value={page.theme?.primary_color || "#4f46e5"} onChange={(e) => set("theme", { ...(page.theme || {}), primary_color: e.target.value })} className="mt-1.5 h-11 w-full" />
                            </div>
                            <div>
                                <Label>رنگ تأکیدی</Label>
                                <Input type="color" value={page.theme?.accent_color || "#f59e0b"} onChange={(e) => set("theme", { ...(page.theme || {}), accent_color: e.target.value })} className="mt-1.5 h-11 w-full" />
                            </div>
                        </div>
                        <div>
                            <Label>شکل دکمه‌ها</Label>
                            <Select value={page.theme?.button_style || "rounded"} onValueChange={(v) => set("theme", { ...(page.theme || {}), button_style: v })}>
                                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rounded">گرد</SelectItem>
                                    <SelectItem value="pill">قرص‌مانند</SelectItem>
                                    <SelectItem value="square">گوشه‌دار</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="booking" className="editor-panel space-y-4">
                    <BuilderSectionHeading section="booking" />
                    <div className="surface-elev p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-bold">تنظیمات نوبت‌دهی</h3>
                                <p className="text-xs text-gray-500 mt-1">رفتار رزرو آنلاین صفحه شما</p>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Label htmlFor="page-booking-enabled" className="text-gray-600">فعال</Label>
                                <Switch
                                    checked={page.booking?.enabled !== false}
                                    onCheckedChange={(v) => set("booking", { ...(page.booking || {}), enabled: v })}
                                    id="page-booking-enabled"
                                    data-testid="booking-enabled"
                                />
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <Label>فاصلهٔ شروع نوبت‌ها (دقیقه)</Label>
                                <Input
                                    type="number"
                                    min="5"
                                    step="5"
                                    dir="ltr"
                                    value={page.booking?.slot_minutes ?? 30}
                                    onChange={(e) => set("booking", { ...(page.booking || {}), slot_minutes: parseInt(e.target.value || "30") })}
                                    className="mt-1.5"
                                    data-testid="booking-slot-minutes"
                                />
                                <p className="text-xs text-gray-500 mt-1">فاصله بین زمان شروع نوبت‌ها</p>
                            </div>
                            <div>
                                <Label>فاصله بین نوبت‌ها (دقیقه)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="5"
                                    dir="ltr"
                                    value={page.booking?.buffer_minutes ?? 0}
                                    onChange={(e) => set("booking", { ...(page.booking || {}), buffer_minutes: parseInt(e.target.value || "0") })}
                                    className="mt-1.5"
                                    data-testid="booking-buffer-minutes"
                                />
                                <p className="text-xs text-gray-500 mt-1">زمان استراحت/آماده‌سازی بعد از هر نوبت</p>
                            </div>
                            <div>
                                <Label>رزرو از چند ساعت قبل؟</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    dir="ltr"
                                    value={page.booking?.lead_time_hours ?? 2}
                                    onChange={(e) => set("booking", { ...(page.booking || {}), lead_time_hours: parseInt(e.target.value || "0") })}
                                    className="mt-1.5"
                                />
                            </div>
                            <div>
                                <Label>رزرو تا چند روز آینده؟</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="365"
                                    dir="ltr"
                                    value={page.booking?.advance_days ?? 30}
                                    onChange={(e) => set("booking", { ...(page.booking || {}), advance_days: parseInt(e.target.value || "30") })}
                                    className="mt-1.5"
                                />
                            </div>
                        </div>

                        <div>
                            <Label>پیام تأیید پس از رزرو</Label>
                            <Textarea
                                rows={2}
                                placeholder="مثلاً: نوبت شما ثبت شد. در صورت نیاز با شما تماس می‌گیریم."
                                value={page.booking?.confirmation_message || ""}
                                onChange={(e) => set("booking", { ...(page.booking || {}), confirmation_message: e.target.value })}
                                className="mt-1.5"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label>روزهای تعطیل</Label>
                                <div className="flex items-center gap-2">
                                    <JalaliDatePicker
                                        value=""
                                        onChange={(iso) => {
                                            if (!iso) return;
                                            const arr = page.booking?.holidays || [];
                                            if (!arr.includes(iso)) set("booking", { ...(page.booking || {}), holidays: [...arr, iso] });
                                        }}
                                        placeholder="افزودن تعطیلی"
                                        testId="booking-add-holiday"
                                    />
                                </div>
                            </div>
                            {(page.booking?.holidays || []).length === 0 ? (
                                <p className="text-xs text-gray-500">هنوز روز تعطیلی اضافه نشده است.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {(page.booking?.holidays || []).map((h) => (
                                        <span key={h} className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-3 py-1 text-xs">
                                            {formatJalaliDate(h, { monthName: true })}
                                            <button
                                                type="button"
                                                onClick={() => set("booking", { ...(page.booking || {}), holidays: (page.booking?.holidays || []).filter((x) => x !== h) })}
                                                className="hover:text-amber-900"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="seo" className="editor-panel space-y-4">
                    <BuilderSectionHeading section="seo" />
                    <div className="surface-elev p-6 space-y-4">
                        <div className="pro-card-heading"><h3 className="font-bold">سئو و اشتراک‌گذاری</h3>
                        <Button type="button" variant="outline" size="sm" disabled={!page.business_name || (Boolean(page.seo?.title) && Boolean(page.seo?.description))}
                            onClick={() => {
                                const suggestion = suggestedSeo(page);
                                set("seo", { ...(page.seo || {}), title: page.seo?.title || suggestion.title, description: page.seo?.description || suggestion.description });
                                toast.success("فیلدهای خالی از نام و معرفی صفحه تکمیل شدند.");
                            }}><WandSparkles size={15} className="ms-1" /> تکمیل از اطلاعات صفحه</Button></div>
                        <div className="pro-search-preview">
                            <span dir="ltr">1ix.ir/u/{page.username}</span>
                            <strong>{page.seo?.title || page.business_name}</strong>
                            <p>{page.seo?.description || page.bio || "توضیح صفحه در اینجا نمایش داده می‌شود."}</p>
                            <small>پیش‌نمایش تقریبی نتیجه‌ی جست‌وجو؛ نمایش نهایی را موتور جست‌وجو تعیین می‌کند.</small>
                        </div>
                        <p className="text-xs text-gray-500">این اطلاعات هنگام به اشتراک‌گذاری لینک صفحه (در گوگل و شبکه‌های اجتماعی) دیده می‌شوند.</p>
                        <div>
                            <Label>عنوان سئو</Label>
                            <Input
                                value={page.seo?.title || ""}
                                onChange={(e) => set("seo", { ...(page.seo || {}), title: e.target.value })}
                                placeholder="مثلاً: دکتر مریم احمدی – روانشناس بالینی در تهران"
                                className="mt-1.5"
                            />
                        </div>
                        <div>
                            <Label>توضیح متا</Label>
                            <Textarea
                                rows={3}
                                value={page.seo?.description || ""}
                                onChange={(e) => set("seo", { ...(page.seo || {}), description: e.target.value })}
                                placeholder="یک توضیح کوتاه (۱۲۰ تا ۱۶۰ کاراکتر)"
                                className="mt-1.5"
                            />
                        </div>
                        <div>
                            <Label>کلمات کلیدی</Label>
                            <Input
                                value={page.seo?.keywords || ""}
                                onChange={(e) => set("seo", { ...(page.seo || {}), keywords: e.target.value })}
                                placeholder="کلمات کلیدی با کاما جدا کنید"
                                className="mt-1.5"
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
                </div>
                <div className="luxury-builder-preview builder-preview hidden lg:block">
                    <StudioPreview page={page} services={services} dirty={dirty} compact onExpand={() => setPreviewOpen(true)} />
                </div>
            </div>

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="pro-preview-dialog" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>صفحه‌ات از نگاه مشتری</DialogTitle>
                        <DialogDescription>با محتوای فعلی؛ بدون نیاز به ذخیره یا انتشار.</DialogDescription>
                    </DialogHeader>
                    <StudioPreview page={page} services={services} dirty={dirty} />
                </DialogContent>
            </Dialog>

            {/* Sticky bottom save bar when there are unsaved changes */}
            {dirty && (
                <div className="editor-save-dock" data-testid="sticky-save-bar">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="editor-unsaved-dot" aria-hidden="true" />
                            <span className="font-semibold text-[var(--ink-900)]">تغییرات ذخیره‌نشده</span>
                            <span className="hidden sm:inline text-[var(--ink-500)]">قبل از خروج، تغییرات را ذخیره کنید.</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-[var(--line-strong)] bg-white h-9"
                                onClick={() => {
                                    setPage(JSON.parse(originalPage));
                                    setDirty(false);
                                }}
                                disabled={saving}
                                data-testid="discard-changes-btn"
                            >
                                لغو تغییرات
                            </Button>
                            <Button
                                onClick={() => save()}
                                disabled={saving}
                                size="sm"
                                className="rounded-xl h-9 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white shadow-[var(--shadow-glow)]"
                                data-testid="sticky-save-btn"
                            >
                                <Save className="w-4 h-4 ms-1.5" /> {saving ? "ذخیره…" : "ذخیره"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
