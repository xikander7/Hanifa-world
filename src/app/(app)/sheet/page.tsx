"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Copy, ExternalLink, FileSpreadsheet, RefreshCw } from "lucide-react";
import { IMPORTED_ACTIVITY, KEYS, WORKING_SHEET_URL, fmtDay } from "@/lib/data";
import type { Activity } from "@/lib/data";
import { syncFromLiveSheet } from "@/lib/liveSheet";
import { useHydrated, useLocalStore } from "@/lib/store";
import { useRole } from "@/components/AppShell";
import { useCelebrate } from "@/components/Celebrate";
import { Nova } from "@/components/Nova";
import { SectionHeading } from "@/components/SectionHeading";

const TABS_IN_SHEET = [
  {
    emoji: "📝", name: "Weekly Learning Updates", who: "You fill this in, once a week",
    what: "A weekly report card written by you. Xander writes his review in the last column. Each row becomes a Weekly reflection in your Journal.",
    columns: ["Week: write “week 2”, “week 3” and so on", "Current Topic: what you studied (for example Computer Basics)", "Progress %: how much of that topic you finished", "What I Learned: list the things you learned", "Practice Completed: what you did to practise", "Proof / Link: a link or a note like “sent on WhatsApp”", "Difficulty for you: easy, medium or hard", "Blocker / Questions: what confused you", "Hanifa comments: anything else you want to say"],
  },
  {
    emoji: "⏱️", name: "Time Tracking Daily", who: "You fill this in, every day you study",
    what: "One row for each day. It shows how much time you really spent learning. Each filled row becomes a Time log in your Journal, and every hour is 60 XP.",
    columns: ["Date and Day are already there", "Hrs: how many hours you studied (for example 1.5)", "What Worked On: one line about what you did", "Hanifa Comments: how it went", "Sikander Comments: Xander writes here"],
  },
  { emoji: "🗺️", name: "Hanifa Training Plan", who: "Xander's plan, you can read it", what: "The list of all 20 topics with how long each should take. This is the same plan as the Adventure map in this app.", columns: [] },
  { emoji: "🎓", name: "Pakistan Uni Options", who: "Research for you and your family", what: "Universities compared side by side. You can see the same thing on the Dreams page.", columns: [] },
  { emoji: "💎", name: "Scholarship Links and Scholarship Options Ranking", who: "Research for you and your family", what: "Scholarships and countries to explore, with the official links. They are also on the Dreams page.", columns: [] },
];

export default function SheetPage() {
  const role = useRole();
  const hydrated = useHydrated();
  const { celebrate } = useCelebrate();
  const [activity] = useLocalStore<Activity[]>(KEYS.activity, IMPORTED_ACTIVITY);
  const [lastSync] = useLocalStore<string>(KEYS.lastSheetSync, "");
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const fromSheet = activity.filter(a => a.source === "sheet").length;
  const syncNow = async () => {
    setSyncing(true); setSyncError("");
    try {
      const { added, updated, removed, skipped } = await syncFromLiveSheet();
      const changed = added + updated + removed;
      celebrate(changed
        ? { emoji: "📊", title: "Synced with the sheet!", text: [added && `${added} new`, updated && `${updated} updated`, removed && `${removed} removed`].filter(Boolean).join(" · "), confetti: added > 0, sound: "win" }
        : { emoji: "✅", title: "Already up to date", text: "The Journal matches the sheet.", confetti: false, sound: "pop" });
      if (skipped.length) setSyncError(`Some rows were skipped: ${skipped.join("; ")}`);
    } catch (error) {
      setSyncError(`${error instanceof Error ? error.message : "Something went wrong"}. Check the internet connection and try again.`);
    } finally { setSyncing(false); }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(WORKING_SHEET_URL); celebrate({ emoji: "🔗", title: "Link copied!", confetti: false, sound: "pop" }); } catch { window.prompt("Copy this link:", WORKING_SHEET_URL); } };

  return <div className="max-w-4xl">
    <SectionHeading eyebrow="Working Excel Sheet · the Google Sheet you and Xander share" title="Your Working Excel Sheet 📊" copy="This is the spreadsheet where your weekly updates and daily time are written down. Whatever you write there shows up in your Journal here, and it counts for XP and your streak." />

    <section className="bg-hero relative mb-6 overflow-hidden rounded-[2.2rem] p-6 text-white shadow-glow sm:p-8">
      <div className="pointer-events-none absolute -right-10 -top-14 h-60 w-60 rounded-full bg-white/10" />
      <div className="relative flex flex-wrap items-center gap-5">
        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-white/20"><FileSpreadsheet size={40} /></div>
        <div className="min-w-0 flex-1"><p className="text-xs font-extrabold uppercase tracking-widest text-white/75">Google Sheets</p><h2 className="mt-1 font-display text-2xl font-extrabold">Hanifa Admission Working</h2><p className="mt-1 text-sm text-white/85">It opens in a new tab. The app reads it by itself every time you open the app, and you can press “Sync now” any time.</p></div>
      </div>
      <div className="relative mt-5 flex flex-wrap gap-3">
        <a href={WORKING_SHEET_URL} target="_blank" rel="noopener noreferrer" className="btn bg-white text-brand shadow-pop hover:-translate-y-0.5">Open the sheet <ExternalLink size={16} /></a>
        <button onClick={syncNow} disabled={syncing} className="btn bg-white/20 text-white hover:bg-white/30 disabled:opacity-70"><RefreshCw size={15} className={syncing ? "animate-spin" : ""} />{syncing ? "Syncing…" : "Sync now"}</button>
        <button onClick={copy} className="btn bg-white/20 text-white hover:bg-white/30"><Copy size={15} />Copy link</button>
      </div>
    </section>

    <section className="card mb-6 p-6">
      <div className="flex items-start gap-4"><Nova mood="think" size={72} /><div>
        <p className="eyebrow">Sheet or this app?</p><h2 className="mt-1 font-display text-xl font-extrabold">Use whichever you like. They stay in sync.</h2>
        <p className="mt-2 text-[15px] leading-7">Write your weekly update and your daily hours in the sheet, and <b>they appear in your Journal here by themselves</b>, with XP, streaks and badges. Xander's review in the last column shows up as his reply. Or write straight in the Journal, which is quicker on a phone.</p>
        <p className="mt-2 text-[15px] leading-7">To change an entry that came from the sheet, change it in the sheet. The app copies the sheet, so the sheet always wins. {role === "mentor" && <Link href="/mentor?tab=sync" className="font-bold text-brand underline">Sync tools for Mentor</Link>}</p>
      </div></div>
      {syncError && <p role="alert" className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{syncError}</p>}
      {hydrated && <p className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-ink/[.04] px-4 py-3 text-sm"><RefreshCw size={15} className="text-brand" /><span><b>{fromSheet}</b> {fromSheet === 1 ? "entry is" : "entries are"} in this app from the sheet{lastSync ? ` · last synced ${fmtDay(lastSync.slice(0, 10))} at ${new Date(lastSync).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}` : ""}.</span><Link href="/time" className="ml-auto inline-flex items-center gap-1 font-bold text-brand">See them in Journal <ArrowRight size={13} /></Link></p>}
    </section>

    <h2 className="mb-1 font-display text-2xl font-extrabold">What is inside the sheet?</h2>
    <p className="mb-4 text-sm text-ink/55">The sheet has several pages at the bottom, like tabs in a book. Here is what each one is for.</p>
    <div className="stagger space-y-4">{TABS_IN_SHEET.map(t => <article key={t.name} className="card p-5">
      <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-2xl">{t.emoji}</span>
        <div className="min-w-0"><h3 className="font-display text-lg font-extrabold">{t.name}</h3><p className="text-xs font-bold text-brand">{t.who}</p><p className="mt-2 text-[15px] leading-7">{t.what}</p>
          {t.columns.length > 0 && <ul className="mt-3 space-y-1.5">{t.columns.map(c => <li key={c} className="flex gap-2 text-sm leading-6 text-ink/70"><span className="text-brand">•</span>{c}</li>)}</ul>}</div></div>
    </article>)}</div>

    <div className="mt-8 flex flex-wrap items-center justify-center gap-3"><a href={WORKING_SHEET_URL} target="_blank" rel="noopener noreferrer" className="btn-primary">Open the sheet <ExternalLink size={16} /></a><Link href="/home" className="btn-soft">Back to Home</Link></div>
  </div>;
}
