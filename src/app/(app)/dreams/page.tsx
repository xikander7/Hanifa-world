"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Bookmark, CheckCircle2, ExternalLink, Heart, MessageCircle } from "lucide-react";
import seed from "@/data/seed.json";
import { KEYS } from "@/lib/data";
import { useLocalStore } from "@/lib/store";
import { useRole } from "@/components/AppShell";
import { useCelebrate } from "@/components/Celebrate";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionHeading } from "@/components/SectionHeading";

type Uni = (typeof seed.universities)[number] & { note?: string; chosen?: boolean; mentorNote?: string };
type Scholarship = (typeof seed.scholarships)[number] & { saved?: boolean; note?: string; checked?: string[]; mentorNote?: string };
const DEFAULT_UNIS: Uni[] = seed.universities.map(u => ({ ...u, chosen: u.name.includes("Sindh") }));
const DEFAULT_SCHOLARSHIPS: Scholarship[] = seed.scholarships.map(s => ({ ...s, saved: false, checked: [] }));
const STEPS: [string, string][] = [["Find requirements", "requirements"], ["Check the dates", "dates"], ["Talk with Sikander", "mentor"]];
const TABS = ["My shortlist", "Scholarship hunt", "Compare countries"] as const;
const flagEmoji: Record<string, string> = { Turkey: "🇹🇷", Germany: "🇩🇪", Hungary: "🇭🇺", China: "🇨🇳", Malaysia: "🇲🇾", "South Korea": "🇰🇷", Japan: "🇯🇵", Italy: "🇮🇹", Cyprus: "🇨🇾" };

export default function DreamsPage() {
  const role = useRole();
  const { celebrate } = useCelebrate();
  const [unis, setUnis] = useLocalStore<Uni[]>(KEYS.unis, DEFAULT_UNIS);
  const [scholarships, setScholarships] = useLocalStore<Scholarship[]>(KEYS.scholarships, DEFAULT_SCHOLARSHIPS);
  const [open, setOpen] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("My shortlist");
  const mentor = role === "mentor";

  const bump = (index: number, delta: number) => { const next = [...unis], to = index + delta; if (to < 0 || to >= next.length) return; [next[index], next[to]] = [next[to], next[index]]; setUnis(next.map((u, i) => ({ ...u, rank: i + 1 }))); };
  const editUni = (id: string, changes: Partial<Uni>) => setUnis(unis.map(u => u.id === id ? { ...u, ...changes } : u));
  const editSch = (id: string, changes: Partial<Scholarship>) => setScholarships(scholarships.map(s => s.id === id ? { ...s, ...changes } : s));
  const toggleStep = (s: Scholarship, step: string) => editSch(s.id, { checked: s.checked?.includes(step) ? s.checked.filter(x => x !== step) : [...(s.checked || []), step] });
  const visible = scholarships;
  const savedCount = scholarships.filter(s => s.saved).length;

  return <div>
    <SectionHeading eyebrow="Dream Board · big ideas, tiny next steps" title="Your future has options 🌍" copy="Explore, compare and rank. Leave thoughts for Sikander whenever something catches your eye." />

    <section className="bg-hero relative mb-8 overflow-hidden rounded-[2.2rem] p-7 text-white shadow-glow sm:p-9">
      <span className="pointer-events-none absolute -right-2 top-2 animate-float text-[7rem] opacity-25 sm:text-[9rem]">🎓</span>
      <span className="chip bg-white/20 text-white">THE BIG DREAM</span>
      <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">BS Computer Science</h2>
      <p className="mt-2 max-w-2xl text-white/90">Grow strong tech skills while you study. Keep exploring: the right path is the one that fits you and your family.</p>
      <div className="mt-5 flex flex-wrap gap-2">{["🏡 Nearby campus", "💻 Skills alongside study", "🌱 One step at a time"].map(t => <span key={t} className="chip bg-white/20 !px-4 !py-2 text-sm text-white">{t}</span>)}</div>
    </section>

    <div className="mb-6 flex flex-wrap gap-2">{TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`chip !px-4 !py-2.5 text-sm transition ${tab === t ? "bg-ink text-white shadow-pop" : "bg-white/80 text-ink/60 ring-1 ring-ink/5 hover:bg-white"}`}>{t === "My shortlist" ? `⭐ ${t}` : t === "Scholarship hunt" ? `💎 ${t} (${savedCount} saved)` : `🧭 ${t}`}</button>)}</div>

    {tab === "My shortlist" && <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><div><h2 className="font-display text-2xl font-extrabold">University wish list</h2><p className="mt-1 text-sm text-ink/55">Use the arrows to rank them the way it feels right to you.</p></div></div>
      <div className="stagger grid gap-4 lg:grid-cols-2">{unis.map((u, i) => <article key={u.id} className="card card-hover p-5">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand/10 font-display text-lg font-extrabold text-brand">#{i + 1}</div>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-display text-lg font-extrabold leading-tight">{u.name}</h3>{u.chosen && <span className="chip animate-pop bg-emerald-100 text-emerald-700"><Heart size={11} className="fill-current" />Favourite</span>}</div><p className="mt-1 text-sm text-ink/55">{u.cityMode}</p></div>
          <div className="flex flex-col gap-1"><button onClick={() => bump(i, -1)} disabled={i === 0} className="rounded-lg bg-ink/5 p-2 transition hover:bg-brand hover:text-white disabled:opacity-30" aria-label="Rank higher"><ArrowUp size={14} /></button><button onClick={() => bump(i, 1)} disabled={i === unis.length - 1} className="rounded-lg bg-ink/5 p-2 transition hover:bg-brand hover:text-white disabled:opacity-30" aria-label="Rank lower"><ArrowDown size={14} /></button></div>
        </div>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-ink/65">{u.verdict}</p>
        <div className="mt-4 flex flex-wrap gap-2"><span className="chip bg-ink/5 text-ink/60">💰 {u.cost?.slice(0, 60)}</span><span className="chip bg-brand/10 text-brand">📅 {u.ease}</span></div>
        {u.mentorNote && <p className="animate-pop mt-3 rounded-2xl bg-ink px-4 py-2.5 text-sm text-white"><b>Sikander:</b> {u.mentorNote}</p>}
        <button onClick={() => setOpen(open === u.id ? null : u.id)} className="mt-4 text-sm font-bold text-brand">{open === u.id ? "Hide details" : "Explore details & leave a thought →"}</button>
        {open === u.id && <div className="animate-fade-up mt-4 space-y-3 border-t border-ink/5 pt-4">
          <p className="text-sm text-ink/65">{u.bestIf}</p><p className="text-xs text-ink/50">Timing: {u.admissionTiming}</p><p className="text-xs text-ink/50">Future value: {u.futureValue}</p>
          <label className="block text-xs font-bold">My thought or question<textarea value={u.note || ""} onChange={e => editUni(u.id, { note: e.target.value })} className="field mt-1 min-h-20 font-normal" placeholder="What do you like? What should we ask Sikander?" /></label>
          {mentor && <label className="block text-xs font-bold">Your note for Hanifa<textarea value={u.mentorNote || ""} onChange={e => editUni(u.id, { mentorNote: e.target.value })} className="field mt-1 min-h-16 font-normal" placeholder="Advice, questions, things to check…" /></label>}
          <button onClick={() => { editUni(u.id, { chosen: !u.chosen }); if (!u.chosen) celebrate({ emoji: "⭐", title: "Added to favourites", text: u.name, sound: "pop" }); }} className={`chip !px-4 !py-2 transition ${u.chosen ? "bg-emerald-100 text-emerald-800" : "bg-ink/5 text-ink/60 hover:bg-ink/10"}`}>{u.chosen ? "✓ Favourite" : "♡ Make a favourite"}</button>
        </div>}
      </article>)}</div>
    </section>}

    {tab === "Scholarship hunt" && <section>
      <h2 className="font-display text-2xl font-extrabold">Scholarship treasure hunt 💎</h2><p className="mt-1 text-sm text-ink/55">Save the ones you like and tick off each step.</p>
      <div className="stagger mt-4 grid gap-4 md:grid-cols-2">{visible.map(s => {
        const pct = Math.round(((s.checked?.length ?? 0) / STEPS.length) * 100);
        return <article key={s.id} className={`card card-hover p-5 ${s.saved ? "ring-2 ring-brand/40" : ""}`}>
          <div className="flex items-center justify-between"><span className="text-3xl">{flagEmoji[s.country] ?? "💎"}</span><span className="chip bg-ink/5 text-ink/60">{s.country} · Rank {s.rank}</span></div>
          <h3 className="mt-3 font-display text-lg font-extrabold leading-tight">{s.university}</h3>
          <p className="mt-2 text-sm leading-6 text-ink/60">{s.howToApply}</p>
          <div className="mt-4"><div className="flex justify-between text-[11px] font-bold text-ink/45"><span>Your progress</span><span>{s.checked?.length ?? 0}/{STEPS.length}</span></div><ProgressBar value={pct} className="mt-1" /></div>
          <div className="mt-3 flex flex-wrap gap-2">{STEPS.map(([label, key]) => { const on = s.checked?.includes(key); return <button key={key} onClick={() => toggleStep(s, key)} className={`chip !px-3 !py-2 transition active:scale-95 ${on ? "bg-emerald-100 text-emerald-800" : "bg-white text-ink/60 ring-1 ring-ink/10 hover:ring-brand/40"}`}>{on ? <CheckCircle2 size={12} /> : "○"} {label}</button>; })}</div>
          {s.mentorNote && <p className="animate-pop mt-3 rounded-2xl bg-ink px-4 py-2.5 text-sm text-white"><b>Sikander:</b> {s.mentorNote}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button onClick={() => { editSch(s.id, { saved: !s.saved }); if (!s.saved) celebrate({ emoji: "💎", title: "Saved to your hunt", text: s.university, confetti: false, sound: "pop" }); }} className={`btn !px-4 !py-2 text-xs ${s.saved ? "bg-brand text-white" : "bg-brand/10 text-brand"}`}><Bookmark size={14} className={s.saved ? "fill-current" : ""} />{s.saved ? "Saved" : "Save this"}</button>
            <button onClick={() => setOpen(open === s.id ? null : s.id)} className="text-xs font-bold text-ink/55">{open === s.id ? "Close" : "Add a note"}</button>
            {s.applyLink?.startsWith("http") && <a target="_blank" rel="noopener noreferrer" href={s.applyLink} className="inline-flex items-center gap-1 text-xs font-bold text-brand">Apply <ExternalLink size={12} /></a>}
            {s.infoLink?.startsWith("http") && <a target="_blank" rel="noopener noreferrer" href={s.infoLink} className="inline-flex items-center gap-1 text-xs font-bold text-ink/55">Info <ExternalLink size={12} /></a>}
          </div>
          {open === s.id && <div className="animate-fade-up mt-3 space-y-2">
            <textarea value={s.note || ""} onChange={e => editSch(s.id, { note: e.target.value })} className="field min-h-20 font-normal" placeholder="Questions, ideas, or what excites you…" />
            {mentor && <textarea value={s.mentorNote || ""} onChange={e => editSch(s.id, { mentorNote: e.target.value })} className="field min-h-16 font-normal" placeholder="Your note for Hanifa…" />}
          </div>}
          {!s.applyLink?.startsWith("http") && s.applyLink && <p className="mt-3 text-[11px] leading-4 text-ink/40">{s.applyLink}</p>}
        </article>;
      })}</div>
    </section>}

    {tab === "Compare countries" && <section>
      <h2 className="font-display text-2xl font-extrabold">Where could your studies take you?</h2><p className="mt-1 text-sm text-ink/55">Use these notes to start a conversation, not to decide alone.</p>
      <div className="stagger mt-4 grid gap-4 lg:grid-cols-2">{[...seed.scholarshipRankings].sort((a, b) => a.rank - b.rank).map(r => <article key={r.id} className="card card-hover p-5">
        <div className="flex items-center justify-between"><h3 className="font-display text-xl font-extrabold">{flagEmoji[r.country] ?? "🌍"} {r.country}</h3><span className="chip bg-brand/10 text-brand">#{r.rank} research rank</span></div>
        <p className="mt-3 text-sm leading-6 text-ink/65">{r.comments}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">{[["Scholarship route", r.route], ["Living cost", r.livingCost], ["Can students work?", r.canSupportSelf], ["CS fit", r.bestForCs]].map(([label, value]) => <p key={label} className="rounded-2xl bg-ink/[.04] p-3"><b className="block text-ink/70">{label}</b>{value}</p>)}</div>
        <p className="mt-3 flex items-start gap-1 text-[11px] text-ink/40"><MessageCircle size={12} className="mt-0.5 shrink-0" />Estimates come from the workbook. Check current details before applying.</p>
      </article>)}</div>
    </section>}
  </div>;
}
