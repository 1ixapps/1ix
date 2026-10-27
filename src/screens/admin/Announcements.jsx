import React, { useEffect, useState } from "react";
import { Plus, Trash2, Megaphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/api";

export default function AdminAnnouncements() {
    const [items, setItems] = useState([]);
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ title: "", body: "" });
    const load = () => api.get("/admin/announcements").then((r) => setItems(r.data));
    useEffect(() => { load(); }, []);
    const submit = async (e) => {
        e.preventDefault();
        await api.post("/admin/announcements", form);
        toast.success("اعلان ساخته شد");
        setOpen(false); setForm({ title: "", body: "" }); load();
    };
    const del = async (a) => { if (!window.confirm("حذف؟")) return; await api.delete(`/admin/announcements/${a.id}`); load(); };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                    <span className="chip mb-2"><Megaphone className="w-3.5 h-3.5" /> اعلانات</span>
                    <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-900)]">اعلانات سراسری</h1>
                    <p className="text-sm text-[var(--ink-500)] mt-1">پیام‌هایی که برای همه کاربران ارسال می‌شود</p>
                </div>
                <Button onClick={() => setOpen(true)} className="rounded-xl h-10 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white shadow-[var(--shadow-glow)]">
                    <Plus className="w-4 h-4 ms-1.5" /> اعلان جدید
                </Button>
            </div>

            {items.length === 0 ? (
                <div className="surface-elev p-12 text-center">
                    <div className="mx-auto grid place-items-center w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 ring-4 ring-amber-100 mb-4">
                        <Megaphone className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-1 text-[var(--ink-900)]">اعلانی ثبت نشده است</h3>
                    <p className="text-sm text-[var(--ink-500)]">اولین اعلان سراسری خود را بسازید.</p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {items.map((a) => (
                        <li key={a.id} className="surface-elev p-5 flex justify-between items-start gap-3">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                <span className="grid place-items-center w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-[var(--shadow-1)] shrink-0">
                                    <Megaphone className="w-5 h-5" />
                                </span>
                                <div className="min-w-0">
                                    <div className="font-bold text-[var(--ink-900)]">{a.title}</div>
                                    <p className="text-sm text-[var(--ink-500)] mt-1 leading-7">{a.body}</p>
                                </div>
                            </div>
                            <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 shrink-0" onClick={() => del(a)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent dir="rtl" className="sm:max-w-md rounded-3xl border-0 surface-elev">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-extrabold tracking-tight">اعلان جدید</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Label className="text-[13px] font-semibold">عنوان</Label>
                            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="mt-1.5 h-11 rounded-xl border-[var(--line-strong)]" />
                        </div>
                        <div>
                            <Label className="text-[13px] font-semibold">متن</Label>
                            <Textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required className="mt-1.5 rounded-xl border-[var(--line-strong)]" />
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="rounded-xl h-11 bg-[var(--brand-600)] hover:bg-[var(--brand-700)] text-white shadow-[var(--shadow-glow)]">
                                <Sparkles className="w-4 h-4 ms-1.5" /> ذخیره و انتشار
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
