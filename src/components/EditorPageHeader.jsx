import React from "react";
import { Link } from "react-router-dom";
import { Eye, ExternalLink, PanelsTopLeft, Save, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ShareDialog from "@/components/ShareDialog";
import { BuilderSaveStatus } from "@/components/BuilderSettingsNav";

export default function EditorPageHeader({ page, dirty, saving, onSave, onPublish, onPreview }) {
  return (
    <header className="editor-page-header">
      <div className="editor-page-overview">
        <span className="editor-page-symbol" aria-hidden="true"><PanelsTopLeft size={24} strokeWidth={1.7} /></span>
        <div className="editor-page-title"><span>استودیوی صفحهٔ شما</span><h1>{page.business_name || "صفحهٔ کسب‌وکار"}</h1><bdi className="editor-page-address">1ix.ir/u/{page.username}</bdi></div>
        <span className={`editor-publication-badge ${page.published ? "is-published" : ""}`}><span aria-hidden="true" />{page.published ? "منتشر شده" : "پیش‌نویس"}</span>
      </div>
      <div className="editor-page-toolbar">
        <div className="editor-publication-control"><Switch id="page-published" checked={Boolean(page.published)} disabled={saving} onCheckedChange={onPublish} data-testid="publish-toggle" /><Label htmlFor="page-published">نمایش عمومی</Label></div>
        <BuilderSaveStatus dirty={dirty} saving={saving} />
        <div className="editor-page-actions">
          {page.published && <><Link to={`/u/${page.username}`} target="_blank" rel="noreferrer" className="editor-view-public" aria-label="مشاهدهٔ صفحهٔ عمومی"><ExternalLink size={17} /><span>صفحهٔ عمومی</span></Link><ShareDialog url={`${window.location.origin}/u/${page.username}`} title={page.business_name} label="لینک و QR" testId="share-page-btn" /></>}
          <Button type="button" variant="outline" onClick={onPreview} className="editor-preview-action" data-testid="editor-preview-btn"><Eye size={17} /> پیش‌نمایش</Button>
          <Button type="button" onClick={onSave} disabled={saving || !dirty} aria-busy={saving} data-testid="save-page-btn">{saving ? <LoaderCircle size={17} className="editor-saving-icon" /> : <Save size={17} />}{saving ? "در حال ذخیره" : "ذخیره تغییرات"}</Button>
        </div>
      </div>
    </header>
  );
}
