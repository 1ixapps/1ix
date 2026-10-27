import React, { useEffect, useState } from "react";
import { Plus, Trash2, Edit3, Wrench, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/api";
import { toFarsiDigits } from "@/lib/jalali";

export default function Services() {
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ title: "", description: "", duration_minutes: 30, price: 0 });

    const load = () => api.get("/services").then((r) => setItems(r.data));
    useEffect(() => { load(); }, []);

    const start = (s = null) => {
        setEditing(s);
        setForm(s
            ? { title: s.title, description: s.description || "", duration_minutes: s.duration_minutes, price: s.price }
            : { title: "", description: "", duration_minutes: 30, price: 0 }
        );
        setOpen(true);
    };

    const submit = async (e) => {
        e.preventDefault();
        try {
            if (editing) await api.patch(`/services/${editing.id}`, form);
            else await api.post("/services", form);
            toast.success("ذخیره شد");
            setOpen(false);
            load();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "خطا");
        }
    };

    const del = async (s) => {
        if (!window.confirm(`حذف خدمت ${s.title}؟`)) return;
        await api.delete(`/services/${s.id}`);
        toast.success("حذف شد");
        load();
    };

    const toggleActive = async (s) => {
        await api.patch(`/services/${s.id}`, { active: !s.active });
        load();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                    <span className="chip mb-2"><Wrench className="w-3.5 h-3.5" /> خدمات</span>
                    <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-900)]">خدمات / سرویس‌ها</h1>
                    <p className="text-sm text-[var(--ink-500)] mt-1">خدماتی که ارائه می‌دهید و قابل رزرو هستند</p>
                </div>
                <Button onClick={() => start()} className="rounded-xl h-10 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white shadow-[var(--shadow-glow)]" data-testid="service-create-btn">
                    <Plus className="w-4 h-4 ms-1.5" /> خدمت جدید
                </Button>
            </div>

            {items.length === 0 ? (
                <div className="surface-elev p-12 text-center">
                    <div className="mx-auto grid place-items-center w-14 h-14 rounded-2xl bg-[var(--brand-50)] text-[var(--brand-600)] ring-4 ring-[var(--brand-100)] mb-4">
                        <Wrench className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-1 text-[var(--ink-900)]">هنوز خدمتی تعریف نکرده‌اید</h3>
                    <p className="text-sm text-[var(--ink-500)] mb-5">با تعریف خدمات، مشتریان می‌توانند برای آن‌ها نوبت بگیرند.</p>
                    <Button onClick={() => start()} className="rounded-xl h-10 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white shadow-[var(--shadow-glow)]">
                        <Plus className="w-4 h-4 ms-1.5" /> شروع کنید
                    </Button>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((s) => (
                        <div key={s.id} className={`relative surface-elev p-5 hover-lift overflow-hidden ${!s.active ? "opacity-60" : ""}`} data-testid={`service-card-${s.id}`}>
                            <div className="absolute -top-12 -end-12 w-32 h-32 rounded-full blob" style={{ background: "rgba(99,102,241,0.10)" }} aria-hidden />
                            <div className="relative flex justify-between items-start mb-3 gap-2">
                                <div className="min-w-0">
                                    <h3 className="font-bold text-[var(--ink-900)] truncate">{s.title}</h3>
                                    {!s.active && (
                                        <span className="chip text-[10px] bg-gray-100 text-gray-600 border-gray-200 mt-1">غیرفعال</span>
                                    )}
                                </div>
                                <Switch checked={s.active} onCheckedChange={() => toggleActive(s)} />
                            </div>
                            <p className="relative text-sm text-[var(--ink-500)] mb-4 line-clamp-2 min-h-[2.6em] leading-7">{s.description || "—"}</p>
                            <div className="relative flex justify-between items-end mb-4">
                                <div className="text-xs text-[var(--ink-500)] flex items-center gap-1 font-semibold">
                                    <Clock className="w-3.5 h-3.5" /> {toFarsiDigits(s.duration_minutes)} دقیقه
                                </div>
                                <div className="text-end">
                                    <div className="stat-num text-xl font-black text-[var(--brand-700)]">
                                        {s.price ? toFarsiDigits(s.price.toLocaleString("fa-IR")) : "رایگان"}
                                    </div>
                                    {s.price ? <div className="text-[10px] text-[var(--ink-500)] -mt-1">تومان</div> : null}
                                </div>
                            </div>
                            <div className="relative flex justify-end gap-1 pt-3 border-t border-[var(--line)]">
                                <Button size="sm" variant="ghost" onClick={() => start(s)} className="hover:bg-[var(--brand-50)]"><Edit3 className="w-4 h-4" /></Button>
                                <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => del(s)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent dir="rtl" className="sm:max-w-md rounded-3xl border-0 surface-elev">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-extrabold tracking-tight">{editing ? "ویرایش خدمت" : "خدمت جدید"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Label className="text-[13px] font-semibold">عنوان</Label>
                            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="mt-1.5 h-11 rounded-xl border-[var(--line-strong)]" data-testid="service-title-input" />
                        </div>
                        <div>
                            <Label className="text-[13px] font-semibold">توضیحات</Label>
                            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5 rounded-xl border-[var(--line-strong)]" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-[13px] font-semibold">مدت (دقیقه)</Label>
                                <Input type="number" min="5" step="5" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value || "0") })} dir="ltr" className="mt-1.5 h-11 rounded-xl border-[var(--line-strong)] text-start" data-testid="service-duration-input" />
                            </div>
                            <div>
                                <Label className="text-[13px] font-semibold">قیمت (تومان)</Label>
                                <Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value || "0") })} dir="ltr" className="mt-1.5 h-11 rounded-xl border-[var(--line-strong)] text-start" data-testid="service-price-input" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="rounded-xl h-11 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white" data-testid="service-submit-btn">
                                <Sparkles className="w-4 h-4 ms-1.5" />
                                {editing ? "ذخیره تغییرات" : "ساخت خدمت"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
