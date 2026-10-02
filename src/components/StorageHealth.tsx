"use client";

import { useEffect, useState } from "react";
import { Download, HardDrive } from "lucide-react";
import { SYNCED_KEYS } from "@/lib/data";
import { allLocalImages, localImageCount, pendingImageCount } from "@/lib/images";
import { localStorageUse } from "@/lib/store";
import { ProgressBar } from "./ProgressBar";

const mb = (bytes: number) => `${(bytes / 1_000_000).toFixed(bytes < 10_000_000 ? 1 : 0)} MB`;

/** Mentor tool: how full this device is, and a backup file of everything, so a full or wiped browser is never a disaster. */
export function StorageHealth() {
  const [info, setInfo] = useState<{ used: number; limit: number; images: number; pending: number; disk?: { usage: number; quota: number }; persisted?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { used, limit } = localStorageUse();
      const estimate = await navigator.storage?.estimate?.().catch(() => undefined);
      const persisted = await navigator.storage?.persisted?.().catch(() => undefined);
      setInfo({ used, limit, images: await localImageCount(), pending: pendingImageCount(), disk: estimate?.usage !== undefined && estimate.quota ? { usage: estimate.usage, quota: estimate.quota } : undefined, persisted });
    })();
  }, []);

  const backup = async () => {
    setBusy(true);
    try {
      const data: Record<string, unknown> = {};
      SYNCED_KEYS.forEach(key => { const raw = localStorage.getItem(key); if (raw !== null) { try { data[key] = JSON.parse(raw); } catch { /* skip a broken key */ } } });
      const file = { app: "my-future-world", version: 1, savedAt: new Date().toISOString(), data, screenshots: await allLocalImages() };
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([JSON.stringify(file)], { type: "application/json" }));
      link.download = `my-future-world-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
    } finally { setBusy(false); }
  };

  const pct = info ? Math.min(100, Math.round((info.used / info.limit) * 100)) : 0;
  return <section className="card p-5 sm:p-6">
    <div className="flex items-center gap-2"><HardDrive className="text-brand" size={20} /><h2 className="font-display text-xl font-extrabold">Storage &amp; backup</h2></div>
    <p className="mt-1 text-sm text-ink/55">Diary text and comments are tiny: months of them fit easily. Screenshots are kept apart, in the browser’s large storage and in your private cloud spreadsheet, so they never fill up the diary.</p>
    {info && <div className="mt-4 space-y-3 text-sm">
      <div><div className="flex justify-between text-xs font-bold"><span>App data on this device (text, comments, progress)</span><span className={pct > 70 ? "text-rose-600" : "text-ink/50"}>{mb(info.used)} of about {mb(info.limit)}</span></div><ProgressBar value={pct} className="mt-1" />
        {pct > 70 && <p className="mt-1 text-xs font-semibold text-rose-600">Getting full. Download a backup, then ask for help trimming old data.</p>}</div>
      <p className="text-xs text-ink/60">📸 <b>{info.images}</b> screenshot{info.images === 1 ? "" : "s"} kept on this device{info.pending ? <> · <b>{info.pending}</b> waiting to upload to the cloud</> : ""}{info.disk ? ` · browser storage ${mb(info.disk.usage)} used of ${mb(info.disk.quota)} available` : ""}</p>
      {info.persisted === false && <p className="text-xs text-ink/50">This browser may clear the app’s storage if it runs low on space. With Cloud save on, everything comes back from the cloud.</p>}
    </div>}
    <button onClick={backup} disabled={busy} className="btn-soft mt-4"><Download size={15} />{busy ? "Preparing…" : "Download a backup (everything, with screenshots)"}</button>
    <p className="mt-2 text-xs text-ink/45">A good habit once a month. The cloud spreadsheet is the main copy; this file is extra safety you keep yourself.</p>
  </section>;
}
