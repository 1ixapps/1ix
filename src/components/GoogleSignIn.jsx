import React, { useEffect, useId, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { beginGoogleSignIn } from "@/lib/googleAuth";
import { pickError } from "@/lib/api";
import "@/styles/auth-feedback.css";

export default function GoogleSignIn({ next, disabled = false, onBusyChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const errorId = useId();
  useEffect(() => {
    mounted.current = true;
    const restore = event => { if (event.persisted) { inFlight.current = false; setBusy(false); onBusyChange?.(false); } };
    window.addEventListener("pageshow", restore);
    return () => { mounted.current = false; window.removeEventListener("pageshow", restore); };
  }, [onBusyChange]);
  const submit = async () => {
    if (disabled || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(""); onBusyChange?.(true);
    try {
      await beginGoogleSignIn(next, url => { if (mounted.current) window.location.assign(url); });
    } catch (failure) {
      if (mounted.current) { setError(pickError(failure)); setBusy(false); onBusyChange?.(false); }
      inFlight.current = false;
    }
  };
  return <div className="auth-google">
    <button type="button" className="auth-google-button" onClick={submit} disabled={disabled || busy} aria-busy={busy} aria-describedby={error ? errorId : undefined} data-testid="google-signin">
      {busy ? <Loader2 size={19} className="auth-google-spinner" aria-hidden="true" /> : <img src="/google-g.svg" alt="" width="20" height="20" aria-hidden="true" />}
      <span>{busy ? "در حال رفتن به گوگل…" : "ادامه با گوگل"}</span>
    </button>
    {error && <p id={errorId} role="alert" className="auth-error">{error}</p>}
    <div className="auth-method-divider"><span>یا با ایمیل</span></div>
  </div>;
}
