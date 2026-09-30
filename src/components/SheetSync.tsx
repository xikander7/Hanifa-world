"use client";

import { ChangeEvent, useState } from "react";
import { CheckCircle2, ExternalLink, FileUp, RefreshCw } from "lucide-react";
import { detectSheet, mergeSheetActivity, parseTimeTracking, parseWeekly } from "@/domain/sheetSync";
import type { MergeResult, ParseResult } from "@/domain/sheetSync";
import { IMPORTED_ACTIVITY, KEYS, SKILLS, WORKING_SHEET_URL, fmtDay, fmtMinutes } from "@/lib/data";
import type { Activity } from "@/lib/data";
import { syncFromLiveSheet } from "@/lib/liveSheet";
import { useLocalStore } from "@/lib/store";
import { useCelebrate } from "./Celebrate";

type Preview = { file: string; weekly: ParseResult | null; time: ParseResult | null; entries: Activity[]; merge: MergeResult };

/** Mentor tool: bring entries from the Google Sheet into Hanifa's journal, live or from a downloaded .xlsx/.csv, safely and repeatably. */
export function SheetSync() {
  const { celebrate } = useCelebrate();
  const [activity, setActivity] = useLocalStore<Activity[]>(KEYS.activity, IMPORTED_ACTIVITY);
  const [lastSync, setLastSync] = useLocalStore<string>(KEYS.lastSheetSync, "");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);

  const syncLive = async () => {
    setSyncing(true); setError(""); setPreview(null);
    try {
      const { added, updated, removed, skipped } = await syncFromLiveSheet();
      celebrate({ emoji: "🔄", title: added + updated + removed ? "Sheet synced!" : "Already up to date", text: `${added} added · ${updated} updated · ${removed} removed`, confetti: false, sound: "pop" });
      if (skipped.length) setError(`Skipped: ${skipped.join("; ")}`);
    } catch (e) { setError(`${e instanceof Error ? e.message : "Couldn't reach the sheet"}. Use the download option below instead.`); }
    finally { setSyncing(false); }
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target, file = input.files?.[0];
    if (!file) return;
    setError(""); setPreview(null);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const topics = SKILLS.map(s => s.topic);
      let weekly: ParseResult | null = null, time: ParseResult | null = null;
      for (const name of workbook.SheetNames) {
        const rows = XLSX.utils.sheet_to_json<string[]>(workbook.Sheets[name], { header: 1, raw: false, defval: "" });
        const kind = detectSheet(rows);
        if (kind === "weekly") weekly = parseWeekly(rows, topics);
        else if (kind === "time") time = parseTimeTracking(rows, topics);
      }
      if (!weekly && !time) { setError("I couldn't find the “Weekly Learning Updates” or “Time Tracking Daily” pages in that file. Download the whole sheet as .xlsx and try again."); return; }
      const entries = [...(weekly?.entries ?? []), ...(time?.entries ?? [])];
      setPreview({ file: file.name, weekly, time, entries, merge: mergeSheetActivity(activity, entries) });
    } catch { setError("I couldn't read that file. In Google Sheets choose File, Download, Microsoft Excel (.xlsx), then pick it here."); }
    finally { input.value = ""; }
  };

  const confirm = () => {
    if (!preview) return;
    setActivity(preview.merge.merged); setLastSync(new Date().toISOString());
    const { added, updated } = preview.merge;
    celebrate({ emoji: "🔄", title: "Sheet synced!", text: `${added} added · ${updated} updated`, confetti: false, sound: "pop" });
    setPreview(null);
  };
  const skipped = [...(preview?.weekly?.skipped ?? []), ...(preview?.time?.skipped ?? [])].filter(s => !/sample week/.test(s));
  const exists = (id: string) => activity.some(a => a.id === id);

  return <section className="space-y-5">
    <div className="card p-6">
      <p className="eyebrow">Sync from sheet</p><h2 className="mt-1 font-display text-2xl font-extrabold">Bring Hanifa's sheet into the app</h2>
      <p className="mt-2 text-sm leading-6 text-ink/65">Her <b>Weekly Learning Updates</b> and <b>Time Tracking Daily</b> pages become journal entries here, with your review and her comments as chat messages. It is safe to do again and again: entries are matched, so nothing is doubled, and comments written in the app are kept.</p>
      <p className="mt-2 text-sm leading-6 text-ink/65">The app reads the live sheet by itself when it opens (at most every 5 minutes). Rows deleted from the sheet are removed here too, unless someone commented on them in the app.</p>
      <button onClick={syncLive} disabled={syncing} className="btn-primary mt-5"><RefreshCw size={16} className={syncing ? "animate-spin" : ""} />{syncing ? "Syncing…" : "Sync now from Google Sheets"}</button>
      {lastSync && <p className="mt-3 text-xs text-ink/50">Last synced {fmtDay(lastSync.slice(0, 10), { weekday: "long", day: "numeric", month: "long" })} at {new Date(lastSync).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</p>}
      {error && <p role="alert" className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
      <p className="mt-6 text-xs font-extrabold uppercase tracking-wider text-ink/45">No internet to Google, or the sheet stops being link-shared? Use a download</p>
      <ol className="mt-3 space-y-2 text-sm leading-6">
        <li><b>1.</b> Open the sheet: <a href={WORKING_SHEET_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-brand underline">Hanifa Admission Working <ExternalLink size={12} /></a></li>
        <li><b>2.</b> In Google Sheets choose <b>File → Download → Microsoft Excel (.xlsx)</b>.</li>
        <li><b>3.</b> Pick that file below and check the preview. Nothing changes until you press Import.</li>
      </ol>
      <label className="btn-soft mt-4 cursor-pointer"><FileUp size={16} />Choose the downloaded file<input type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={onFile} /></label>
    </div>

    {preview && <div className="card animate-fade-up p-6">
      <p className="eyebrow">Preview · {preview.file}</p>
      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        {[["New", preview.merge.added], ["Updated", preview.merge.updated], ["Already up to date", preview.merge.unchanged]].map(([label, n]) => <div key={String(label)} className="rounded-2xl bg-ink/[.04] p-3"><p className="font-display text-2xl font-extrabold">{n}</p><p className="text-[11px] font-bold text-ink/50">{label}</p></div>)}
      </div>
      {preview.entries.length === 0 ? <p className="mt-4 text-sm text-ink/60">Both pages are empty, so there is nothing to import yet.</p> :
        <ul className="mt-4 divide-y divide-ink/5">{preview.entries.map(entry => <li key={entry.id} className="flex flex-wrap items-center gap-2 py-3 text-sm">
          <span className="chip bg-ink/5 text-ink/60">{fmtDay(entry.date)}</span><span className="chip bg-brand/10 text-brand">{entry.kind}</span>
          <span className="min-w-0 flex-1 truncate font-bold">{entry.topic}{entry.minutes ? ` · ${fmtMinutes(entry.minutes)}` : ""}</span>
          <span className={`chip ${exists(entry.id) ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"}`}>{exists(entry.id) ? "update" : "new"}</span>
        </li>)}</ul>}
      {skipped.length > 0 && <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-950"><b>Skipped:</b><ul className="mt-1 list-disc pl-5">{skipped.map(s => <li key={s}>{s}</li>)}</ul></div>}
      <div className="mt-5 flex flex-wrap gap-3"><button onClick={confirm} disabled={preview.merge.added + preview.merge.updated === 0} className="btn-primary"><CheckCircle2 size={16} />Import {preview.merge.added + preview.merge.updated} {preview.merge.added + preview.merge.updated === 1 ? "entry" : "entries"}</button><button onClick={() => setPreview(null)} className="btn-soft">Cancel</button></div>
    </div>}
  </section>;
}
