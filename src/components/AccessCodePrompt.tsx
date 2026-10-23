"use client";

import { useEffect, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import { accessCode, setAccessCode, syncNow, useCloudStatus } from "@/lib/cloud";

/**
 * Asks for the family access code, but only when Cloud save says this device needs it (the script has an ACCESS_CODE).
 * "Later" just closes it: the app keeps working on this device, and the question comes back the next time it is opened.
 */
export function AccessCodePrompt() {
  const status = useCloudStatus();
  const [code, setCode] = useState("");
  const [later, setLater] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const show = Boolean(status.needsCode) && !later;
  useEffect(() => { if (show) input.current?.focus(); }, [show]);
  if (!show) return null;

  const save = async () => {
    if (!code.trim() || busy) return;
    setBusy(true);
    setAccessCode(code);
    setTried(true);
    await syncNow().catch(() => undefined);
    setBusy(false);
  };
  // After a try that was refused, the status asks for the code again, so the message below shows until it is right.
  const wrong = tried && Boolean(accessCode());

  return <div role="dialog" aria-modal="true" aria-labelledby="access-code-title" className="fixed inset-0 z-[97] grid place-items-center bg-ink/50 p-4 backdrop-blur-sm">
    <form onSubmit={e => { e.preventDefault(); void save(); }} className="card w-full max-w-sm p-6">
      <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/10 text-brand"><KeyRound size={22} /></span>
        <h2 id="access-code-title" className="font-display text-xl font-extrabold">Family access code</h2></div>
      <p className="mt-3 text-sm leading-6 text-ink/70">Cloud save is protected. Type the code Sikander gave you, once, and this device will remember it.</p>
      <input ref={input} type="password" autoComplete="off" value={code} onChange={e => setCode(e.target.value)} className="field mt-4" placeholder="Access code" aria-label="Family access code" />
      {wrong && <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">That code didn’t work. Check it and try again.</p>}
      <div className="mt-4 flex gap-2">
        <button type="submit" disabled={busy || !code.trim()} className="btn-primary flex-1 !py-2.5 text-sm">{busy ? "Checking…" : "Save code"}</button>
        <button type="button" onClick={() => setLater(true)} className="btn-soft !py-2.5 text-sm">Later</button>
      </div>
    </form>
  </div>;
}
