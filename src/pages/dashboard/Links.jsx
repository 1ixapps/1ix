import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Copy, ExternalLink, Trash2, Edit3, Link2, Search, Download, SlidersHorizontal, ArrowLeft, Megaphone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ShareDialog from "@/components/ShareDialog";
import BuilderCharacter from "@/components/BuilderCharacter";
import { campaignDestination, downloadText, linksCsv } from "@/lib/campaignLinks";
import api from "@/lib/api";
import { toast } from "sonner";

const emptyForm = { slug: "", destination: "", title: "" };
const emptyCampaign = { source: "", medium: "", campaign: "" };
const errorText = (error, fallback) => typeof error?.response?.data?.detail === "string" ? error.response.data.detail : fallback;
const number = (value) => Number(value || 0).toLocaleString("fa-IR");

export default function Links() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [campaign, setCampaign] = useState(emptyCampaign);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const origin = window.location.origin;
  const baseUrl = origin + "/r";

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try { const { data } = await api.get("/links"); setLinks(data); }
    catch (err) { setError(errorText(err, "دریافت لینک‌ها انجام نشد. دوباره تلاش کن.")); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const startCreate = () => { setEditing(null); setForm(emptyForm); setCampaign(emptyCampaign); setOpen(true); };
  const startEdit = (link) => { setEditing(link); setForm({ slug: link.slug, destination: link.destination, title: link.title || "" }); setCampaign(emptyCampaign); setOpen(true); };
  const destination = useMemo(() => {
    if (!form.destination.trim()) return { value: "", error: "" };
    try { return { value: campaignDestination(form.destination.trim(), campaign), error: "" }; }
    catch { return { value: "", error: "یک آدرس معتبر با https:// یا http:// وارد کن." }; }
  }, [form.destination, campaign]);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!destination.value) { toast.error(destination.error || "آدرس مقصد را وارد کن."); return; }
    setSubmitting(true);
    try {
      const payload = { title: form.title.trim(), destination: destination.value, slug: form.slug.trim() || null };
      if (editing) await api.patch("/links/" + editing.id, payload);
      else await api.post("/links", payload);
      toast.success(editing ? "لینک به‌روز شد." : "لینک جدیدت آماده است.");
      setOpen(false);
      await load(true);
    } catch (err) { toast.error(errorText(err, "ذخیره‌ی لینک انجام نشد. اطلاعاتت در فرم باقی مانده‌اند.")); }
    finally { setSubmitting(false); }
  };

  const remove = async () => {
    if (!deleteTarget || busyId) return;
    setBusyId(deleteTarget.id);
    try {
      await api.delete("/links/" + deleteTarget.id);
      toast.success("لینک حذف شد.");
      setDeleteTarget(null);
      await load(true);
    } catch (err) { toast.error(errorText(err, "حذف انجام نشد.")); }
    finally { setBusyId(null); }
  };
  const toggle = async (link) => {
    if (busyId) return;
    setBusyId(link.id);
    try { await api.patch("/links/" + link.id, { active: !link.active }); await load(true); }
    catch (err) { toast.error(errorText(err, "تغییر وضعیت انجام نشد.")); }
    finally { setBusyId(null); }
  };
  const copy = async (link) => {
    try { await navigator.clipboard.writeText(baseUrl + "/" + link.slug); toast.success("لینک کپی شد."); }
    catch { toast.error("کپی انجام نشد. از بخش اشتراک‌گذاری آدرس را دستی کپی کن."); }
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLocaleLowerCase("fa");
    return links.filter((link) => {
      const matchesStatus = status === "all" || (status === "active" ? link.active : !link.active);
      return matchesStatus && (!term || [link.title, link.slug, link.destination].some((value) => String(value || "").toLocaleLowerCase("fa").includes(term)));
    }).sort((a, b) => sort === "clicks" ? (b.clicks || 0) - (a.clicks || 0) : sort === "title" ? (a.title || a.slug).localeCompare(b.title || b.slug, "fa") : (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0));
  }, [links, q, status, sort]);
  const clicks = links.reduce((total, link) => total + Number(link.clicks || 0), 0);

  return (
    <div className="pro-links space-y-6">
      <header className="pro-links-header">
        <div><span className="pro-eyebrow"><Link2 size={14} /> استودیوی لینک</span><h1>کوتاه. قابل‌ردیابی. مال تو.</h1><p>لینک‌های برندت را بساز، مرتب کن و به اشتراک بگذار.</p></div>
        <div className="pro-header-actions">
          <Button variant="outline" disabled={loading || !filtered.length} onClick={() => downloadText(linksCsv(filtered, origin), "vanix-links.csv")}><Download size={16} /> خروجی CSV</Button>
          <Button onClick={startCreate} className="pro-primary" data-testid="link-create-btn"><Plus size={17} /> لینک جدید</Button>
        </div>
      </header>
      <div className="pro-link-summary" aria-label="آمار واقعی لینک‌ها">
        <div><span>لینک‌ها</span><b>{loading ? "—" : number(links.length)}</b></div>
        <div><span>لینک فعال</span><b>{loading ? "—" : number(links.filter((link) => link.active).length)}</b></div>
        <div><span>مجموع کلیک‌ها</span><b>{loading ? "—" : number(clicks)}</b></div>
        <span className="pro-summary-note"><Megaphone size={17} /> لینک کمپینت را با UTM بساز.</span>
      </div>
      <div className="pro-link-filters">
        <label className="pro-link-search"><Search size={17} /><span className="sr-only">جست‌وجوی لینک</span><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="عنوان، آدرس یا مقصد…" /></label>
        <div className="pro-filter-tabs" role="group" aria-label="وضعیت لینک">
          {[["all", "همه"], ["active", "فعال"], ["paused", "متوقف"]].map(([value, label]) => <button type="button" key={value} aria-pressed={status === value} onClick={() => setStatus(value)}>{label}</button>)}
        </div>
        <label className="pro-link-sort"><SlidersHorizontal size={15} /><span className="sr-only">مرتب‌سازی لینک‌ها</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">جدیدترین</option><option value="clicks">بیشترین کلیک</option><option value="title">عنوان</option></select></label>
      </div>
      {error && <div className="pro-inline-error" role="alert"><span>{error}</span><button type="button" onClick={() => load()}>تلاش دوباره</button></div>}
      {loading ? <div className="pro-links-loading" role="status" aria-label="در حال بارگذاری لینک‌ها">{[1, 2, 3].map((id) => <div key={id} />)}</div> : !links.length && !error ? (
        <div className="pro-link-empty"><BuilderCharacter /><h2>لینک بلندت را بده؛ کوتاهش کنیم.</h2><p>آدرس دلخواه، QR قابل چاپ و تنظیمات کمپین، همین‌جا.</p><Button className="pro-primary" onClick={startCreate}><Plus size={16} /> ساخت اولین لینک</Button></div>
      ) : filtered.length ? (
        <div className="pro-link-list">
          <div className="pro-link-list-heading"><span>{number(filtered.length)} لینک</span><small>خروجی CSV شامل همین نتایج فیلترشده است.</small></div>
          {filtered.map((link) => (
            <article className="pro-link-row" key={link.id}>
              <div className="pro-link-glyph"><Link2 size={20} /></div>
              <div className="pro-link-detail"><h2>{link.title || "بدون عنوان"}</h2>
                <a href={baseUrl + "/" + link.slug} target="_blank" rel="noreferrer" dir="ltr">{baseUrl + "/" + link.slug}<ExternalLink size={12} /></a>
                <p dir="ltr" title={link.destination}>{link.destination}</p>
              </div>
              <div className="pro-link-clicks"><b>{number(link.clicks)}</b><span>کلیک</span></div>
              <label className="pro-link-active"><Switch checked={link.active} onCheckedChange={() => toggle(link)} disabled={Boolean(busyId)} aria-label={"وضعیت " + (link.title || link.slug)} /><span>{link.active ? "فعال" : "متوقف"}</span></label>
              <div className="pro-link-row-actions">
                <button type="button" title="کپی لینک" aria-label={"کپی " + link.slug} onClick={() => copy(link)}><Copy size={16} /></button>
                <ShareDialog url={baseUrl + "/" + link.slug} title={link.title || link.slug} label="QR و اشتراک" />
                <button type="button" title="ویرایش" aria-label={"ویرایش " + link.slug} onClick={() => startEdit(link)}><Edit3 size={16} /></button>
                <button type="button" className="is-danger" title="حذف" aria-label={"حذف " + link.slug} onClick={() => setDeleteTarget(link)} disabled={Boolean(busyId)}><Trash2 size={16} /></button>
              </div>
            </article>
          ))}
        </div>
      ) : !error && <div className="pro-link-empty is-search"><Search size={28} /><h2>با این فیلترها لینکی پیدا نشد.</h2><button type="button" className="pro-text-button" onClick={() => { setQ(""); setStatus("all"); }}>نمایش همه‌ی لینک‌ها <ArrowLeft size={15} /></button></div>}

      <Dialog open={open} onOpenChange={(value) => { if (!submitting) setOpen(value); }}>
        <DialogContent dir="rtl" className="pro-link-dialog">
          <DialogHeader><DialogTitle>{editing ? "ویرایش لینک" : "یک لینک تازه بساز."}</DialogTitle><DialogDescription>مقصد را وارد کن؛ آدرس کوتاه و تنظیمات کمپین اختیاری‌اند.</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="pro-link-form">
            <div><Label htmlFor="link-title">نام لینک</Label><Input id="link-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="مثلاً رزرو از اینستاگرام" /></div>
            <div><Label htmlFor="link-destination">آدرس مقصد</Label><Input id="link-destination" value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} placeholder="https://example.com/booking" dir="ltr" type="url" required aria-invalid={Boolean(destination.error)} />
              {destination.error && <p className="pro-field-error">{destination.error}</p>}</div>
            <div><Label htmlFor="link-slug">آدرس کوتاه اختصاصی {editing ? "" : "(اختیاری)"}</Label><div className="pro-slug-field" dir="ltr"><span>{baseUrl}/</span><input id="link-slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.replace(/[^a-zA-Z0-9_-]/g, "") })} placeholder="your-link" maxLength={60} required={Boolean(editing)} pattern="[a-zA-Z0-9_-]+" /></div><p className="pro-field-hint">حروف انگلیسی، عدد، خط تیره و زیرخط. اگر خالی باشد آدرس خودکار ساخته می‌شود.</p></div>
            <details className="pro-campaign-settings"><summary><Megaphone size={16} /><span>رهگیری کمپین با UTM</span><span>اختیاری</span></summary>
              <p>برای گزارش ابزار تحلیلِ مقصد؛ آمار 1ix.ir تعداد کل کلیک‌های لینک است.</p>
              {[["source", "منبع ورودی", "instagram"], ["medium", "نوع رسانه", "social"], ["campaign", "نام کمپین", "spring-offer"]].map(([key, label, placeholder]) => <div key={key}><Label htmlFor={"utm-" + key}>{label}</Label><Input id={"utm-" + key} value={campaign[key]} onChange={(event) => setCampaign({ ...campaign, [key]: event.target.value })} dir="ltr" placeholder={placeholder} /></div>)}
            </details>
            {destination.value && <div className="pro-destination-preview"><span><Check size={13} /> مقصد نهایی</span><p dir="ltr">{destination.value}</p></div>}
            <DialogFooter><Button type="button" variant="outline" disabled={submitting} onClick={() => setOpen(false)}>انصراف</Button><Button type="submit" disabled={submitting} className="pro-primary">{submitting ? "در حال ذخیره…" : editing ? "ذخیره‌ی تغییرات" : "ساخت لینک"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(value) => { if (!value && !busyId) setDeleteTarget(null); }}>
        <DialogContent dir="rtl"><DialogHeader><DialogTitle>این لینک حذف شود؟</DialogTitle><DialogDescription>لینک {deleteTarget?.title || deleteTarget?.slug} و QR آن دیگر کار نخواهند کرد. این کار قابل بازگشت نیست.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" disabled={Boolean(busyId)} onClick={() => setDeleteTarget(null)}>نگهش دار</Button><Button variant="destructive" onClick={remove} disabled={Boolean(busyId)}>{busyId ? "در حال حذف…" : "حذف لینک"}</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
