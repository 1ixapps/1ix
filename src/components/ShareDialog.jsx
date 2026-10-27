import React, { useEffect, useId, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Send, MessageCircle, Mail, Share2, Download, ArrowUpLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { downloadText } from "@/lib/campaignLinks";
import { toast } from "sonner";

export default function ShareDialog({ url, title, label = "اشتراک‌گذاری", testId }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);
  const inputId = useId();
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const encoded = encodeURIComponent(title ? title + " | " + url : url);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2200);
      toast.success("لینک کپی شد.");
    } catch { toast.error("کپی انجام نشد. آدرس را انتخاب و دستی کپی کن."); }
  };
  const downloadQr = () => {
    if (!qrRef.current) return;
    const svg = new XMLSerializer().serializeToString(qrRef.current);
    downloadText(svg, "vanix-" + (title || "page").replace(/[^a-zA-Z0-9\u0600-\u06ff-]/g, "-").slice(0, 40) + ".svg", "image/svg+xml;charset=utf-8");
    toast.success("فایل QR برای دانلود آماده شد.");
  };
  const nativeShare = async () => {
    try { await navigator.share({ title, url }); }
    catch (error) { if (error.name !== "AbortError") toast.error("اشتراک‌گذاری انجام نشد."); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm" className="pro-share-trigger" data-testid={testId}><Share2 size={15} /> {label}</Button></DialogTrigger>
      <DialogContent dir="rtl" className="pro-share-dialog">
        <DialogHeader><DialogTitle>یک لینک؛ هر جا که بخواهی.</DialogTitle><DialogDescription>صفحه یا لینک خودت را کپی کن، به اشتراک بگذار یا QR آن را بگیر.</DialogDescription></DialogHeader>
        <div className="pro-share-qr">
          <span className="pro-share-label">اسکن کن، وارد شو.</span>
          <div><QRCodeSVG ref={qrRef} value={url} title={title || "لینک 1ix.ir"} size={170} marginSize={4} level="M" bgColor="#ffffff" fgColor="#17181b" /></div>
          <span>{title || "لینک اختصاصی تو"}</span>
        </div>
        <label className="sr-only" htmlFor={inputId}>آدرس قابل اشتراک‌گذاری</label>
        <div className="pro-share-url">
          <input id={inputId} readOnly value={url} dir="ltr" onClick={(event) => event.currentTarget.select()} />
          <button type="button" onClick={copy} aria-label="کپی لینک" data-testid="share-copy">{copied ? <Check size={17} /> : <Copy size={17} />}</button>
        </div>
        <div className="pro-share-channels">
          <a href={"https://wa.me/?text=" + encoded} target="_blank" rel="noreferrer" data-testid="share-whatsapp"><MessageCircle size={19} /><span>واتساپ</span><ArrowUpLeft size={13} /></a>
          <a href={"https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(title || "")} target="_blank" rel="noreferrer" data-testid="share-telegram"><Send size={19} /><span>تلگرام</span><ArrowUpLeft size={13} /></a>
          <a href={"mailto:?subject=" + encodeURIComponent(title || "صفحه‌ی من در 1ix.ir") + "&body=" + encoded} data-testid="share-email"><Mail size={19} /><span>ایمیل</span><ArrowUpLeft size={13} /></a>
        </div>
        <button type="button" className="pro-share-download" onClick={downloadQr}><Download size={17} /><span>دانلود QR با کیفیت چاپ</span><small>SVG</small></button>
        {typeof navigator.share === "function" && <Button type="button" onClick={nativeShare} className="w-full"><Share2 size={16} /> اشتراک از طریق دستگاه</Button>}
      </DialogContent>
    </Dialog>
  );
}
