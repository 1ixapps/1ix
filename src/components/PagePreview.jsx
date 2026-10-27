import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import BusinessPageContent from "@/components/BusinessPageContent";
import { previewGeometry } from "@/lib/businessPage";
import "@/styles/business-preview.css";

/** A measured device viewport, not a second implementation of the business page. */
export default function PagePreview({ page, services = [], device = "mobile", compact = false }) {
  const hostRef = useRef(null);
  const contentRef = useRef(null);
  const scrollRef = useRef(null);
  const [size, setSize] = useState({ width: 390, height: 0 });
  const measure = useCallback(() => {
    const width = hostRef.current?.clientWidth || 390;
    const height = contentRef.current?.scrollHeight || 0;
    setSize((current) => Math.abs(current.width - width) < .5 && Math.abs(current.height - height) < .5 ? current : { width, height });
  }, []);

  useLayoutEffect(() => {
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (hostRef.current) observer?.observe(hostRef.current);
    if (contentRef.current) observer?.observe(contentRef.current);
    window.addEventListener("resize", measure);
    let alive = true;
    document.fonts?.ready?.then(() => { if (alive) measure(); });
    return () => { alive = false; observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [measure]);

  useLayoutEffect(() => { measure(); }, [page, services, device, measure]);
  useLayoutEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [device]);

  if (!page) return null;
  const geometry = previewGeometry(device, size.width, size.height);
  return (
    <div className={`bp-preview-shell preview-live preview-device--${device} ${compact ? "is-compact" : ""}`} data-testid="page-preview" data-device-width={geometry.width} data-preview-scale={geometry.scale} dir="rtl">
      <div className="bp-preview-browserbar"><span aria-hidden="true"><i /><i /><i /></span><b>نمای واقعی صفحه</b></div>
      <div className="bp-preview-viewport" ref={scrollRef} tabIndex={0} role="region" aria-label={device === "desktop" ? "محتوای پیش‌نمایش دسکتاپ؛ برای مشاهده ادامه پیمایش کنید" : "محتوای پیش‌نمایش موبایل؛ برای مشاهده ادامه پیمایش کنید"}>
        <div className="bp-preview-host" ref={hostRef}>
          <div className="bp-preview-spacer" style={{ width: geometry.scaledWidth, height: geometry.height || 600 }}>
            <div ref={contentRef} className="bp-preview-target" onLoadCapture={measure} style={{ width: geometry.width, transform: `scale(${geometry.scale})` }}>
              <BusinessPageContent page={page} services={services} readOnly />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
