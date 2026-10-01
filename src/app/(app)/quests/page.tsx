"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Clock3, Hourglass, Pencil, Play, Plus, Send, Target, Trash2 } from "lucide-react";
import { EMPTY_QUESTS, KEYS, fmtDay, localDate } from "@/lib/data";
import type { Quest } from "@/lib/data";
import { XP } from "@/lib/game";
import { useLocalStore } from "@/lib/store";
import { useRole } from "@/components/AppShell";
import { useCelebrate } from "@/components/Celebrate";
import { MissionForm } from "@/components/MissionForm";
import { Nova } from "@/components/Nova";
import { SectionHeading } from "@/components/SectionHeading";

const TABS = ["Active", "Waiting for Sikander", "Done"] as const;

export default function MissionsPage() {
  const role = useRole();
  const { celebrate } = useCelebrate();
  const [quests, setQuests] = useLocalStore<Quest[]>(KEYS.quests, EMPTY_QUESTS);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Active");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [proof, setProof] = useState("");
  const [reflection, setReflection] = useState("");
  const today = localDate();

  const groups = {
    Active: quests.filter(q => ["Today", "Upcoming", "In Progress", "Needs a tweak"].includes(q.status)),
    "Waiting for Sikander": quests.filter(q => q.status === "Waiting for Mentor"),
    Done: quests.filter(q => q.status === "Completed"),
  };
  const list = [...groups[tab]].sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999"));
  const patch = (id: string, changes: Partial<Quest>) => setQuests(quests.map(q => q.id === id ? { ...q, ...changes } : q));

  const complete = (q: Quest) => { patch(q.id, { status: "Completed", completedAt: new Date().toISOString() }); celebrate({ emoji: "🎯", title: "Mission complete!", text: q.title, xp: q.xp ?? XP.defaultQuest }); };
  const submit = (e: FormEvent, q: Quest) => {
    e.preventDefault();
    patch(q.id, { status: "Waiting for Mentor", proof: proof.trim(), comment: reflection.trim() });
    setSubmitting(null); setProof(""); setReflection("");
    celebrate({ emoji: "📨", title: "Sent to Sikander!", text: "You’ll see his feedback on your Home page.", confetti: false, sound: "pop" });
  };

  return <div>
    <SectionHeading eyebrow="Missions · small tasks, real progress" title="Your missions 🎯" copy="Missions from Sikander and ones you set yourself. Finish them for bonus XP, and send the bigger ones for review.">
      <button onClick={() => setAdding(v => !v)} className="btn-primary"><Plus size={16} />{adding ? "Close" : role === "mentor" ? "Assign a mission" : "New mission"}</button>
    </SectionHeading>
    {adding && <div className="mb-6"><MissionForm by={role === "mentor" ? "mentor" : "hanifa"} onCreate={q => { setQuests([...quests, q]); setAdding(false); celebrate({ emoji: "✨", title: "Mission added", text: q.title, confetti: false, sound: "pop" }); }} /></div>}

    <div className="mb-5 flex flex-wrap gap-2">{TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`chip !px-4 !py-2 text-sm transition ${tab === t ? "bg-ink text-white shadow-pop" : "bg-white/80 text-ink/60 ring-1 ring-ink/5 hover:bg-white"}`}>{t}<span className={`ml-1 rounded-full px-1.5 text-[11px] ${tab === t ? "bg-white/20" : "bg-ink/5"}`}>{groups[t].length}</span></button>)}</div>

    {list.length === 0 ? <div className="card p-10 text-center"><Nova mood={tab === "Done" ? "think" : "happy"} size={96} className="mx-auto" /><p className="mt-3 font-display text-xl font-extrabold">{tab === "Active" ? "No active missions" : tab === "Done" ? "Nothing finished yet" : "Nothing waiting"}</p><p className="mt-1 text-sm text-ink/55">{tab === "Active" ? "Add a mission for yourself, or wait for one from Sikander. 🌤️" : tab === "Done" ? "Your completed missions will collect here." : "Missions you send for review appear here."}</p></div> :
      <div className="stagger space-y-4">{list.map(q => {
        const overdue = q.dueDate && q.dueDate < today && q.status !== "Completed";
        if (editing === q.id) return <MissionForm key={q.id} by="hanifa" initial={q} onCancel={() => setEditing(null)} onCreate={next => { setQuests(quests.map(x => x.id === q.id ? next : x)); setEditing(null); celebrate({ emoji: "✏️", title: "Mission updated", text: next.title, confetti: false, sound: "pop" }); }} />;
        // Hanifa can fix or remove her own missions; Sikander's are his to change.
        const mine = role === "learner" && q.createdBy === "hanifa";
        return <article key={q.id} className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><span className="chip bg-brand/10 text-brand">{q.createdBy === "mentor" ? "📌 From Sikander" : "✨ My mission"}</span>{q.skill && <span className="chip bg-ink/5 text-ink/60">{q.skill}</span>}{q.requiresApproval && <span className="chip bg-amber-100 text-amber-900">Needs review</span>}{overdue && <span className="chip bg-rose-100 text-rose-700">Overdue</span>}</div>
              <h3 className="mt-2 font-display text-xl font-extrabold">{q.title}</h3>
              {q.description && <p className="mt-1 text-sm leading-6 text-ink/60">{q.description}</p>}
              <p className="mt-2 flex flex-wrap items-center gap-3 text-xs font-bold text-ink/45"><span className="inline-flex items-center gap-1"><Clock3 size={12} />{q.minutes} min</span>{q.dueDate && <span>Due {fmtDay(q.dueDate)}</span>}<span className="inline-flex items-center gap-1 text-brand">+{q.xp ?? XP.defaultQuest} XP</span></p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {["Today", "Upcoming"].includes(q.status) && <button onClick={() => patch(q.id, { status: "In Progress" })} className="btn-soft !py-2.5 text-xs"><Play size={14} />Start</button>}
              {["Today", "Upcoming", "In Progress", "Needs a tweak"].includes(q.status) && (q.requiresApproval
                ? <button onClick={() => { setSubmitting(q.id); setProof(q.proof); setReflection(q.comment); }} className="btn-primary !py-2.5 text-xs"><Send size={14} />{q.status === "Needs a tweak" ? "Resubmit" : "Send for review"}</button>
                : <button onClick={() => complete(q)} className="btn-primary !py-2.5 text-xs"><CheckCircle2 size={14} />I did it!</button>)}
              {q.status === "Waiting for Mentor" && <span className="chip bg-amber-100 !py-2 text-amber-900"><Hourglass size={13} />Sikander is reviewing</span>}
              {q.status === "Completed" && <span className="chip bg-emerald-100 !py-2 text-emerald-800"><CheckCircle2 size={13} />Done</span>}
              {mine && <>
                <button onClick={() => setEditing(q.id)} aria-label={`Edit ${q.title}`} title="Edit" className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink/60 transition hover:text-brand"><Pencil size={14} /></button>
                <button onClick={() => { if (window.confirm(`Delete the mission "${q.title}"?`)) setQuests(quests.filter(x => x.id !== q.id)); }} aria-label={`Delete ${q.title}`} title="Delete" className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink/60 transition hover:text-rose-600"><Trash2 size={14} /></button>
              </>}
            </div>
          </div>
          {role === "learner" && q.createdBy === "mentor" && <p className="mt-3 text-[11px] font-semibold text-ink/40">Only Sikander can edit or delete this mission (Mentor sign in → Messages &amp; Missions).</p>}
          {q.mentorFeedback && <p className="animate-pop mt-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white"><b>Sikander:</b> {q.mentorFeedback}</p>}
          {submitting === q.id && <form onSubmit={e => submit(e, q)} className="animate-fade-up mt-4 space-y-3 rounded-2xl bg-brand/5 p-4">
            <input className="field" placeholder="Proof link or screenshot link (optional)" value={proof} onChange={e => setProof(e.target.value)} />
            <textarea className="field min-h-20" placeholder="What did you do? What was hard? What did you learn?" value={reflection} onChange={e => setReflection(e.target.value)} required />
            <div className="flex gap-2"><button className="btn-primary !py-2.5 text-xs">Send to Sikander</button><button type="button" onClick={() => setSubmitting(null)} className="btn-soft !py-2.5 text-xs">Cancel</button></div>
          </form>}
          {q.status !== "Today" && q.status !== "Upcoming" && q.status !== "In Progress" && q.proof && <p className="mt-3 break-all text-xs text-ink/50"><Target size={12} className="mr-1 inline" />Proof: {q.proof.startsWith("http") ? <a className="font-bold text-brand underline" href={q.proof} target="_blank" rel="noopener noreferrer">{q.proof}</a> : q.proof}</p>}
        </article>;
      })}</div>}
  </div>;
}
