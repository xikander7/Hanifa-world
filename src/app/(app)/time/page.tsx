"use client";

import { ChangeEvent, FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Camera, ExternalLink, HelpCircle, ImagePlus, Link2, Pencil, Plus, Trash2, X } from "lucide-react";
import { FEELINGS, IMPORTED_ACTIVITY, KEYS, SKILLS, WORKING_SHEET_URL, addDays, feelingIcon, fileToCompressedDataUrl, fmtDay, fmtMinutes, isSample, localDate, uid } from "@/lib/data";
import type { Activity, Comment } from "@/lib/data";
import { XP } from "@/lib/game";
import { useGame } from "@/lib/useGame";
import { useHydrated, useLocalStore } from "@/lib/store";
import { useRole } from "@/components/AppShell";
import { useCelebrate } from "@/components/Celebrate";
import { CommentThread, LEGACY_NOTE_ID, sheetComment } from "@/components/CommentThread";
import { Screenshot } from "@/components/Screenshot";
import { storeImage } from "@/lib/images";
import { Nova } from "@/components/Nova";
import { SectionHeading } from "@/components/SectionHeading";

const FILTERS = ["All", "Time log", "Learning update", "Weekly reflection"] as const;
const QUICK_MINUTES = [15, 30, 45, 60, 90];
const blank = () => ({ date: localDate(), topic: SKILLS[0].topic, minutes: "30", did: "", practiced: "", feeling: "✨", blocker: "", proof: "", kind: "Learning update" as Activity["kind"] });

export default function TimePage() { return <Suspense fallback={null}><Journal /></Suspense>; }

function Journal() {
  const role = useRole();
  const hydrated = useHydrated();
  const params = useSearchParams();
  const { celebrate } = useCelebrate();
  const game = useGame();
  const [items, setItems] = useLocalStore<Activity[]>(KEYS.activity, IMPORTED_ACTIVITY);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(blank);
  const [attachment, setAttachment] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [error, setError] = useState("");
  const today = hydrated ? localDate() : "";
  const learner = role === "learner";

  useEffect(() => { if (params.get("new") === "1" && learner) setShowForm(true); }, [params, learner]);

  const filtered = items.filter(i => filter === "All" || i.kind === filter);
  const groups = Object.entries(filtered.reduce<Record<string, Activity[]>>((acc, item) => { (acc[item.date] ||= []).push(item); return acc; }, {})).sort((a, b) => b[0].localeCompare(a[0]));
  const last14 = useMemo(() => hydrated ? Array.from({ length: 14 }, (_, i) => { const d = addDays(today, i - 13); return { d, m: game.perDay[d] || 0 }; }) : [], [hydrated, today, game.perDay]);
  const maxMinutes = Math.max(30, ...last14.map(x => x.m));
  const entryCount = items.filter(i => !isSample(i)).length;

  const reset = () => { setShowForm(false); setEditingId(null); setDraft(blank()); setAttachment(""); setError(""); };
  const edit = (a: Activity) => { setEditingId(a.id); setDraft({ date: a.date, topic: a.topic, minutes: String(a.minutes), did: a.did, practiced: a.practiced, feeling: a.feeling, blocker: a.blocker, proof: a.proof, kind: a.kind }); setAttachment(a.attachment || ""); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const remove = (a: Activity) => { if (window.confirm("Delete this journal entry? This cannot be undone.")) { setItems(items.filter(x => x.id !== a.id)); if (editingId === a.id) reset(); } };
  const attach = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Choose an image or screenshot file."); return; }
    setAttachment(await fileToCompressedDataUrl(file)); setError("");
  };
  const [saving, setSaving] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const minutes = Math.max(0, Number(draft.minutes) || 0);
    if (!draft.did.trim() && minutes === 0) { setError("Add a few words or some time before saving."); return; }
    // A new screenshot goes to the screenshot store; the entry keeps only a short reference to it.
    setSaving(true);
    const savedAttachment = attachment ? await storeImage(attachment) : "";
    setSaving(false);
    const previous = editingId ? items.find(i => i.id === editingId) : undefined;
    const entry: Activity = { ...previous, id: editingId || uid(), date: draft.date, kind: draft.kind, topic: draft.topic, minutes, did: draft.did.trim(), practiced: draft.practiced.trim(), feeling: draft.feeling, blocker: draft.blocker.trim(), proof: draft.proof.trim(), attachment: savedAttachment || undefined, source: previous?.source ?? "manual" };
    setItems(list => editingId ? list.map(i => i.id === editingId ? entry : i) : [...list, entry]); // the latest list: saving the screenshot took a moment
    if (!editingId) celebrate({ emoji: draft.blocker.trim() ? "🙋‍♀️" : "📝", title: draft.blocker.trim() ? "Question sent to Sikander" : "Entry saved!", text: minutes ? `${fmtMinutes(minutes)} logged on ${draft.topic}` : "Every note counts.", xp: Math.min(minutes, 60) + XP.journalEntry, sound: "win" });
    reset();
  };
  const addComment = (id: string, comment: Comment) => setItems(items.map(i => i.id === id ? { ...i, comments: [...(i.comments ?? []), comment] } : i));
  const editComment = (id: string, commentId: string, text: string) => setItems(items.map(i => i.id === id ? { ...i, comments: (i.comments ?? []).map(c => c.id === commentId ? { ...c, text } : c) } : i));
  const deleteComment = (id: string, commentId: string) => setItems(items.map(i => i.id !== id ? i : commentId === LEGACY_NOTE_ID ? { ...i, mentorNote: "" } : { ...i, comments: (i.comments ?? []).filter(c => c.id !== commentId) }));

  return <div>
    <SectionHeading eyebrow="My Diary · your learning story" title="Every little step counts ✍️" copy="Log time, write what you learned, ask questions, and add proof. Sikander reads it all and can reply right here.">
      {learner && <button onClick={() => (showForm ? reset() : setShowForm(true))} className="btn-primary"><Plus size={16} />{showForm ? "Close" : "New entry"}</button>}
    </SectionHeading>

    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card p-5 lg:col-span-1">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="font-display text-2xl font-extrabold">{hydrated ? fmtMinutes(game.todayMinutes) : "0m"}</p><p className="text-[11px] font-bold text-ink/45">today</p></div>
          <div><p className="font-display text-2xl font-extrabold">{hydrated ? fmtMinutes(game.weekMinutes) : "0m"}</p><p className="text-[11px] font-bold text-ink/45">this week</p></div>
          <div><p className="font-display text-2xl font-extrabold">{hydrated ? entryCount : 0}</p><p className="text-[11px] font-bold text-ink/45">entries</p></div>
        </div>
        <p className="mt-4 rounded-2xl bg-brand/10 px-4 py-2.5 text-center text-xs font-bold text-brand">🔥 {game.streak.current}-day streak · best {game.streak.best}</p>
      </div>
      <div className="card p-5 lg:col-span-2">
        <p className="eyebrow">Last 14 days</p>
        <div className="mt-3 flex h-28 items-end gap-1.5" role="img" aria-label="Minutes studied per day for the last 14 days">
          {last14.map((x, i) => <div key={x.d} className="group relative flex h-full flex-1 flex-col items-center justify-end" title={`${fmtDay(x.d)} · ${fmtMinutes(x.m)}`}>
            <div className={`w-full rounded-t-lg ${x.m ? "bg-brand-gradient" : "bg-ink/5"} ${x.d === today ? "ring-2 ring-ink/30" : ""}`} style={{ height: `${Math.max(6, (x.m / maxMinutes) * 100)}%`, animation: `fadeUp .7s ${i * 40}ms cubic-bezier(.2,.8,.2,1) both`, transformOrigin: "bottom" }} />
          </div>)}
        </div>
        <div className="mt-1 flex justify-between text-[10px] font-bold text-ink/35"><span>{last14[0] ? fmtDay(last14[0].d, { day: "numeric", month: "short" }) : ""}</span><span>today</span></div>
      </div>
    </div>

    {showForm && learner && <form onSubmit={submit} className="card animate-fade-up mt-6 p-5 sm:p-7">
      <div className="flex items-center gap-3"><Nova size={48} float={false} mood="happy" /><div><h2 className="font-display text-xl font-extrabold">{editingId ? "Edit your entry" : "What did you do?"}</h2><p className="text-xs text-ink/50">Quick is fine. A few words and a time is a great entry.</p></div></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="text-xs font-bold">Topic<select className="field mt-1" value={draft.topic} onChange={e => setDraft({ ...draft, topic: e.target.value })}>{SKILLS.map(s => <option key={s.id}>{s.topic}</option>)}</select></label>
        <label className="text-xs font-bold">Date<input type="date" max={localDate()} className="field mt-1" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} /></label>
        <label className="text-xs font-bold">Type<select className="field mt-1" value={draft.kind} onChange={e => setDraft({ ...draft, kind: e.target.value as Activity["kind"] })}><option>Learning update</option><option>Time log</option><option>Weekly reflection</option></select></label>
      </div>
      <div className="mt-4"><p className="text-xs font-bold">How long did you study?</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">{QUICK_MINUTES.map(m => <button type="button" key={m} onClick={() => setDraft({ ...draft, minutes: String(m) })} className={`chip !px-3.5 !py-2 transition ${Number(draft.minutes) === m ? "bg-brand text-white shadow-glow" : "bg-ink/5 text-ink/60 hover:bg-ink/10"}`}>{fmtMinutes(m)}</button>)}<span className="mx-1 text-xs text-ink/40">or</span><input type="number" min={0} className="field !w-24 !py-2" value={draft.minutes} onChange={e => setDraft({ ...draft, minutes: e.target.value })} aria-label="Minutes" /><span className="text-xs text-ink/50">min</span></div></div>
      <label className="mt-4 block text-xs font-bold">What did you learn or do?<textarea className="field mt-1 min-h-24" placeholder="e.g. I learned what a for loop is and wrote one that prints my name 5 times." value={draft.did} onChange={e => setDraft({ ...draft, did: e.target.value })} /></label>
      <label className="mt-4 block text-xs font-bold">What did you practise? <span className="font-medium text-ink/40">(optional)</span><input className="field mt-1" value={draft.practiced} onChange={e => setDraft({ ...draft, practiced: e.target.value })} /></label>
      <div className="mt-4"><p className="text-xs font-bold">How did it feel?</p><div className="mt-2 flex flex-wrap gap-2">{FEELINGS.map(f => <button type="button" key={f.emoji} onClick={() => setDraft({ ...draft, feeling: f.emoji })} aria-pressed={draft.feeling === f.emoji} className={`flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold transition hover:-translate-y-0.5 ${draft.feeling === f.emoji ? "bg-brand/15 ring-2 ring-brand" : "bg-white ring-1 ring-ink/10"}`}><span className="text-lg">{f.emoji}</span>{f.label}</button>)}</div></div>
      <label className="mt-4 block rounded-2xl bg-amber-50 p-4 text-xs font-bold text-amber-950"><span className="flex items-center gap-1.5"><HelpCircle size={14} />Stuck on something? Ask Sikander</span><textarea className="field mt-2 min-h-16 font-normal" placeholder="Asking is a superpower. Write your question here." value={draft.blocker} onChange={e => setDraft({ ...draft, blocker: e.target.value })} /></label>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold"><span className="flex items-center gap-1"><Link2 size={12} />Proof link <span className="font-medium text-ink/40">(optional)</span></span><input className="field mt-1" placeholder="https://…" value={draft.proof} onChange={e => setDraft({ ...draft, proof: e.target.value })} /></label>
        <div className="text-xs font-bold"><span className="flex items-center gap-1"><Camera size={12} />Screenshot <span className="font-medium text-ink/40">(optional)</span></span>
          <label className="btn-soft mt-1 w-full cursor-pointer !py-3"><ImagePlus size={15} />{attachment ? "Change screenshot" : "Add a screenshot"}<input type="file" accept="image/*" className="sr-only" onChange={attach} /></label></div>
      </div>
      {attachment && <div className="animate-pop mt-3 flex items-center gap-3"><Screenshot value={attachment} /><button type="button" onClick={() => setAttachment("")} className="text-xs font-bold text-rose-600">Remove</button></div>}
      {error && <p role="alert" className="mt-3 rounded-2xl bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700">{error}</p>}
      <div className="mt-5 flex gap-3"><button className="btn-primary" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Save entry"}</button><button type="button" onClick={reset} className="btn-soft">Cancel</button></div>
    </form>}

    <div className="mb-4 mt-9 flex flex-wrap items-center gap-2"><h2 className="mr-auto font-display text-2xl font-extrabold">My story so far</h2>
      {FILTERS.map(f => <button key={f} onClick={() => setFilter(f)} className={`chip !px-3.5 !py-2 transition ${filter === f ? "bg-ink text-white" : "bg-white/80 text-ink/60 ring-1 ring-ink/5 hover:bg-white"}`}>{f}</button>)}</div>

    {groups.length === 0 ? <div className="card p-10 text-center"><Nova mood="happy" size={96} className="mx-auto" /><p className="mt-3 font-display text-xl font-extrabold">Your journal is ready</p><p className="mt-1 text-sm text-ink/55">Write your first entry and Nova will do a happy dance. 💃</p></div> :
      <div className="space-y-8">{groups.map(([date, entries]) => <section key={date}>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-ink/50"><CalendarDays size={15} />{fmtDay(date, { weekday: "long", day: "numeric", month: "long" })}{date === today && <span className="chip bg-brand text-white">Today</span>}</h3>
        <div className="stagger space-y-4">{entries.map(a => <article key={a.id} className="card p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand/10 text-2xl">{feelingIcon(a.feeling)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><span className="chip bg-brand/10 text-brand">{a.kind}</span>{a.minutes > 0 && <span className="chip bg-ink/5 text-ink/60">{fmtMinutes(a.minutes)}</span>}{a.source === "focus" && <span className="chip bg-ink/5 text-ink/60">⏱️ Focus timer</span>}{a.source === "sheet" && <span className="chip bg-emerald-100 text-emerald-800">📊 From the sheet</span>}{isSample(a) && <span className="chip bg-amber-100 text-amber-900">Sample week · not counted</span>}</div>
              <h4 className="mt-2 font-display text-lg font-extrabold">{a.topic}</h4>
            </div>
            {learner && a.source === "sheet" && <a href={WORKING_SHEET_URL} target="_blank" rel="noopener noreferrer" title="Entries from the sheet are changed in the sheet" className="chip shrink-0 bg-ink/5 text-ink/55 transition hover:bg-ink/10 hover:text-ink"><Pencil size={12} />Edit in sheet<ExternalLink size={11} /></a>}
            {learner && !isSample(a) && a.source !== "sheet" && <div className="flex gap-1"><button onClick={() => edit(a)} className="grid h-9 w-9 place-items-center rounded-xl text-ink/45 transition hover:bg-ink/5 hover:text-ink" aria-label="Edit entry"><Pencil size={15} /></button><button onClick={() => remove(a)} className="grid h-9 w-9 place-items-center rounded-xl text-ink/45 transition hover:bg-rose-50 hover:text-rose-600" aria-label="Delete entry"><Trash2 size={15} /></button></div>}
          </div>
          {a.did && <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{a.did}</p>}
          {a.practiced && <p className="mt-2 text-xs text-ink/55"><b>Practised:</b> {a.practiced}</p>}
          {a.blocker && <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-2.5 text-sm text-amber-950"><b>🙋‍♀️ Question for Sikander:</b> {a.blocker}</p>}
          {(a.proof || a.attachment) && <div className="mt-3 flex flex-wrap items-center gap-3">{a.proof && (a.proof.startsWith("http") ? <a href={a.proof} target="_blank" rel="noopener noreferrer" className="chip bg-brand/10 text-brand underline">🔗 Proof link</a> : <span className="chip bg-ink/5 text-ink/60">{a.proof}</span>)}{a.attachment && <Screenshot value={a.attachment} />}</div>}
          <CommentThread comments={a.comments ?? []} legacyMentorNote={a.mentorNote} viewer={learner ? "hanifa" : "mentor"} onAdd={c => addComment(a.id, c)} onEdit={(cid, t) => editComment(a.id, cid, t)} onDelete={cid => deleteComment(a.id, cid)} fromSheet={sheetComment(a)} />
        </article>)}</div>
      </section>)}</div>}

    {/* Browsers won't open a saved screenshot (a data: link) in a new tab, so show it here instead. */}
  </div>;
}
