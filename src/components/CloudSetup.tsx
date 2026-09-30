"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, Copy, RefreshCw } from "lucide-react";
import { cloudUrl, cloudUrlIsBuiltIn, isCloudUrl, pingCloud, setCloudUrl, syncNow, useCloudStatus } from "@/lib/cloud";
import { useCelebrate } from "./Celebrate";

/** Mentor tool: connect this device to Cloud save, and hand Hanifa a link that connects hers. */
export function CloudSetup() {
  const { celebrate } = useCelebrate();
  const status = useCloudStatus();
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setSaved(cloudUrl()); setUrl(cloudUrl()); }, []);
  const deviceLink = saved ? `${window.location.origin}/home?cloud=${encodeURIComponent(saved)}` : "";

  const connect = async () => {
    const next = url.trim();
    if (!isCloudUrl(next)) { setError("That doesn't look like a web app address. It starts with https://script.google.com/macros/s/ and ends with /exec."); return; }
    setBusy(true); setError("");
    try {
      await pingCloud(next);
      setCloudUrl(next); setSaved(next);
      celebrate({ emoji: "☁️", title: "Cloud save connected", text: "Now open the link below on Hanifa's devices.", sound: "win" });
    } catch (e) { setError(`Couldn't reach it (${e instanceof Error ? e.message : "no answer"}). Check it's deployed with “Who has access: Anyone”.`); }
    finally { setBusy(false); }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(deviceLink); celebrate({ emoji: "🔗", title: "Link copied", text: "Send it to Hanifa and ask her to open it.", confetti: false, sound: "pop" }); } catch { window.prompt("Copy this link:", deviceLink); } };

  return <section className="card p-6">
    <p className="eyebrow">Cloud save · every device</p>
    <h2 className="mt-1 flex items-center gap-2 font-display text-2xl font-extrabold">{saved ? <Cloud className="text-emerald-600" /> : <CloudOff className="text-ink/40" />}{saved ? "Cloud save is on" : "Turn on Cloud save"}</h2>
    <p className="mt-2 text-sm leading-6 text-ink/65">With Cloud save, Hanifa's progress lives in a private Google Sheet in your Drive, and her phone, her laptop and your laptop all show the same thing. Her journal entries are also copied to an <b>App Journal</b> tab in the working sheet, where you can type replies. Setup takes about 10 minutes, once: follow <b>docs/cloud-setup.md</b>.</p>

    {saved && <div className="mt-4 rounded-2xl bg-ink/[.04] p-4 text-sm">
      <p className="flex flex-wrap items-center gap-2 font-semibold">
        <span className={`h-2.5 w-2.5 rounded-full ${status.state === "synced" ? "bg-emerald-500" : status.state === "syncing" ? "bg-amber-400" : "bg-rose-500"}`} />
        {status.state === "synced" ? `Synced ${status.at ? new Date(status.at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : ""}` : status.state === "syncing" ? "Syncing…" : status.state === "offline" ? "Offline" : status.message ?? "Not synced yet"}
        <button onClick={() => syncNow()} className="chip ml-auto bg-white text-ink/70 ring-1 ring-ink/10"><RefreshCw size={12} />Sync now</button>
      </p>
      <p className="mt-4 text-xs font-extrabold uppercase tracking-wider text-ink/45">Connect Hanifa's phone and laptop</p>
      <p className="mt-1 text-xs leading-5 text-ink/60">Open this link once on each of her devices (send it on WhatsApp). Anything already on that device is merged in, nothing is lost.</p>
      <div className="mt-2 flex gap-2"><input readOnly value={deviceLink} className="field !py-2 text-xs" aria-label="Link for Hanifa's devices" onFocus={e => e.target.select()} /><button onClick={copy} className="btn-primary !px-3.5 !py-2 text-xs"><Copy size={14} />Copy</button></div>
    </div>}

    {!cloudUrlIsBuiltIn() && <div className="mt-4">
      <label className="block text-xs font-bold">Web app address (from Deploy → New deployment in Apps Script)
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://script.google.com/macros/s/…/exec" className="field mt-1 font-normal" />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={connect} disabled={busy || !url.trim() || url.trim() === saved} className="btn-dark !py-2.5 text-xs">{busy ? "Checking…" : saved ? "Change address" : "Connect this device"}</button>
        {saved && <button onClick={() => { if (window.confirm("Turn off Cloud save on this device? Its data stays here, it just stops syncing.")) { setCloudUrl(""); setSaved(""); setUrl(""); } }} className="btn-soft !py-2.5 text-xs">Turn off on this device</button>}
      </div>
    </div>}
    {error && <p role="alert" className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
  </section>;
}
