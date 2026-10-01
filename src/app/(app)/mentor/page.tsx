"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BadgeCheck, CheckCircle2, Flame, HelpCircle, Lock, MessageCircle, Pencil, Send, Trash2, Trophy } from "lucide-react";
import roadmap from "@/data/roadmap.json";
import { lessons } from "@/data/lessons";
import { EMPTY_BRAIN, EMPTY_INBOX, EMPTY_QUESTS, EMPTY_ROADMAP, EMPTY_SKILL_PROOF, IMPORTED_ACTIVITY, KEYS, SKILLS, addDays, blankSkillProof, feelingIcon, fmtDay, fmtMinutes, isSample, localDate, uid, weekStart } from "@/lib/data";
import type { Activity, Brain, Comment, InboxMessage, Quest, RoadmapProgress, SkillProofMap } from "@/lib/data";
import { XP } from "@/lib/game";
import { quizKey, TIERS } from "@/lib/quizTier";
import { getStageState } from "@/lib/roadmap-progress";
import { useGame } from "@/lib/useGame";
import { useHydrated, useLocalStore } from "@/lib/store";
import { useRole } from "@/components/AppShell";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { AskedQuestions } from "@/components/AskedQuestions";
import { useCelebrate } from "@/components/Celebrate";
import { CommentThread } from "@/components/CommentThread";
import { MissionForm } from "@/components/MissionForm";
import { Nova } from "@/components/Nova";
import { ProgressBar } from "@/components/ProgressBar";
import { Ring } from "@/components/Ring";
import { SectionHeading } from "@/components/SectionHeading";
import { CloudSetup } from "@/components/CloudSetup";
import { SheetSync } from "@/components/SheetSync";

// "To do" comes first: everything Hanifa sent that needs Sikander, in one place.
// Each part of Mentor Hub has its own menu item (see mentorNav in AppShell), picked with ?tab=.
const TABS = ["todo", "diary", "progress", "message", "settings"] as const;
type Tab = (typeof TABS)[number];
const HEADINGS: Record<Tab, [string, string, string]> = {
  todo: ["To do", "What Hanifa needs from you ✅", "Missions and levels to review, her questions, and diary entries with no reply yet."],
  diary: ["Her diary", "Everything she wrote 📝", "Her time, notes and questions, newest first. Reply to any entry."],
  progress: ["Progress", "How Hanifa is doing 📈", "Her level, streak, study time and how far she is on each level."],
  message: ["Messages & missions", "Cheer her on 💌", "Send a message or a challenge, and give her missions."],
  settings: ["Settings", "Devices & sync ⚙️", "Cloud save, device links and the sheet sync."],
};
const stageIds = roadmap.map(m => `module-${m.number}`);
const TEMPLATES: { kind: InboxMessage["kind"]; text: string }[] = [
  { kind: "cheer", text: "I saw your effort this week and I'm really proud of you. Keep going! 💖" },
  { kind: "cheer", text: "Your streak is looking great. Consistency beats intensity every time. 🔥" },
  { kind: "challenge", text: "Challenge: finish one full quiz with 100% by tomorrow. You can do it! 🎯" },
  { kind: "challenge", text: "Challenge: explain today's topic to someone at home in 2 minutes, then write what they asked. 🗣️" },
  { kind: "note", text: "Stuck is normal. Write your exact question in the journal and I'll answer tonight. 🙋‍♀️" },
];

export default function MentorPage() { return <Suspense fallback={null}><MentorHub /></Suspense>; }

function MentorHub() {
  const role = useRole();
  const hydrated = useHydrated();
  const { celebrate } = useCelebrate();
  const game = useGame();
  const router = useRouter();
  const asked = useSearchParams().get("tab");
  const tab: Tab = asked === "sync" ? "settings" : TABS.includes(asked as Tab) ? (asked as Tab) : "todo";
  const setTab = (next: Tab) => router.push(`/mentor?tab=${next}`);
  const [activity, setActivity] = useLocalStore<Activity[]>(KEYS.activity, IMPORTED_ACTIVITY);
  const [quests, setQuests] = useLocalStore<Quest[]>(KEYS.quests, EMPTY_QUESTS);
  const [editing, setEditing] = useState<string | null>(null);
  const [proofs, setProofs] = useLocalStore<SkillProofMap>(KEYS.skillProof, EMPTY_SKILL_PROOF);
  const [brain] = useLocalStore<Brain>(KEYS.brain, EMPTY_BRAIN);
  const [roadmapProgress] = useLocalStore<RoadmapProgress>(KEYS.roadmap, EMPTY_ROADMAP);
  const [inbox, setInbox] = useLocalStore<InboxMessage[]>(KEYS.inbox, EMPTY_INBOX);
  const [goalHours] = useLocalStore<number>(KEYS.goal, 5);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<InboxMessage["kind"]>("cheer");
  const [onlyOpen, setOnlyOpen] = useState(false);

  const today = hydrated ? localDate() : "";
  const real = useMemo(() => activity.filter(a => !isSample(a)), [activity]);
  const waitingQuests = quests.filter(q => q.status === "Waiting for Mentor");
  const waitingProofs = SKILLS.map((s, i) => ({ s, i, p: proofs[s.id] })).filter(x => x.p?.sent && !x.p.verified);
  const needsReply = real.filter(a => (a.blocker.trim() || a.did.trim()) && !(a.comments ?? []).some(c => c.by === "mentor") && !a.mentorNote);
  const questions = real.filter(a => a.blocker.trim() && !(a.comments ?? []).some(c => c.by === "mentor"));
  const attention = waitingQuests.length + waitingProofs.length + questions.length;
  const lastActive = [...game.activeDays].sort().pop();
  const daysAway = lastActive && today ? Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${lastActive}T12:00:00`).getTime()) / 86_400_000) : null;
  const last14 = hydrated ? Array.from({ length: 14 }, (_, i) => { const d = addDays(today, i - 13); return { d, m: game.perDay[d] || 0 }; }) : [];
  const maxM = Math.max(30, ...last14.map(x => x.m));
  const byTopic = useMemo(() => {
    if (!today) return [] as [string, number][];
    const start = weekStart(today), totals: Record<string, number> = {};
    real.filter(a => a.date >= start).forEach(a => { totals[a.topic] = (totals[a.topic] || 0) + a.minutes; });
    return Object.entries(totals).filter(([, m]) => m > 0).sort((a, b) => b[1] - a[1]);
  }, [real, today]);
  const quizAttempts = Object.values(brain.quiz);
  const quizAvg = quizAttempts.length ? Math.round((quizAttempts.reduce((s, q) => s + q.best / q.total, 0) / quizAttempts.length) * 100) : 0;
  const weekPct = Math.min(100, Math.round((game.weekMinutes / (goalHours * 60)) * 100));

  if (role !== "mentor") return <div className="card mx-auto max-w-md p-8 text-center"><Nova mood="think" size={96} className="mx-auto" /><Lock className="mx-auto mt-2 text-brand" /><h1 className="mt-3 font-display text-2xl font-extrabold">Mentor space</h1><p className="mt-2 text-sm text-ink/60">Use “Mentor sign in” in the sidebar to open reviews, comments and progress tracking.</p></div>;

  const fb = (id: string) => feedback[id]?.trim() || "";
  const reviewQuest = (q: Quest, approve: boolean) => {
    if (!approve && !fb(q.id)) { setMessage("Add a friendly note so Hanifa knows what to try next."); return; }
    setQuests(quests.map(x => x.id === q.id ? { ...x, status: approve ? "Completed" : "Needs a tweak", completedAt: approve ? new Date().toISOString() : x.completedAt, mentorFeedback: fb(q.id) || "Approved. Lovely work! 🎉" } : x));
    setFeedback(f => ({ ...f, [q.id]: "" })); setMessage(approve ? "Approved. She’ll see your note on Home." : "Sent back kindly with your feedback.");
  };
  const reviewProof = (index: number, verify: boolean) => {
    const skill = SKILLS[index], p = proofs[skill.id] ?? blankSkillProof(), id = skill.id;
    if (!verify && !fb(id)) { setMessage("Tell her what to add so she can try again."); return; }
    setProofs({ ...proofs, [id]: { ...p, verified: verify, sent: verify, mentorFeedback: fb(id) || (verify ? "Verified. Great work! ✅" : "") } });
    setFeedback(f => ({ ...f, [id]: "" })); setMessage(verify ? `Level ${index + 1} verified ✅` : "Asked for a little more.");
  };
  const toggleVerified = (index: number) => { const skill = SKILLS[index], p = proofs[skill.id] ?? blankSkillProof(); setProofs({ ...proofs, [skill.id]: { ...p, verified: !p.verified } }); };
  const comment = (id: string, c: Comment) => setActivity(activity.map(a => a.id === id ? { ...a, comments: [...(a.comments ?? []), c] } : a));
  const send = (kind: InboxMessage["kind"], text: string) => { if (!text.trim()) return; setInbox([{ id: uid(), at: new Date().toISOString(), kind, text: text.trim() }, ...inbox]); setMessage(""); celebrate({ emoji: kind === "cheer" ? "💖" : "📨", title: "Sent to Hanifa", text: "She’ll see it on her Home page.", confetti: false, sound: "pop" }); };

  // To do only lists entries still waiting for a reply; Her diary lists everything unless the filter is on.
  const open = (a: Activity) => !isSample(a) && (a.blocker.trim() || a.did.trim()) && !(a.comments ?? []).some(c => c.by === "mentor") && !a.mentorNote;
  const journal = [...activity].sort((a, b) => b.date.localeCompare(a.date)).filter(a => (tab === "todo" || onlyOpen) ? open(a) : true);

  return <div>
    <SectionHeading eyebrow={`Mentor Hub · ${HEADINGS[tab][0]}`} title={HEADINGS[tab][1]} copy={HEADINGS[tab][2]} />
    {message && <p role="status" className="animate-pop mb-4 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white">{message}</p>}


    {tab === "progress" && <div className="space-y-5">
      <div className="stagger grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5"><p className="text-sm font-bold text-ink/55">Level</p><p className="mt-2 font-display text-3xl font-extrabold">{game.rank.emoji} <AnimatedNumber value={game.level} /></p><p className="text-xs text-ink/45">{game.rank.title} · {game.xp} XP</p></div>
        <div className="card p-5"><p className="text-sm font-bold text-ink/55">Streak</p><p className="mt-2 flex items-center gap-1 font-display text-3xl font-extrabold"><Flame className={game.streak.current ? "animate-flame text-brand" : "text-ink/30"} /><AnimatedNumber value={game.streak.current} /></p><p className="text-xs text-ink/45">best {game.streak.best} day{game.streak.best === 1 ? "" : "s"}</p></div>
        <div className="card p-5"><p className="text-sm font-bold text-ink/55">This week</p><p className="mt-2 font-display text-3xl font-extrabold">{fmtMinutes(game.weekMinutes)}</p><ProgressBar value={weekPct} className="mt-2" /><p className="mt-1 text-xs text-ink/45">{weekPct}% of {goalHours}h goal</p></div>
        <div className="card p-5"><p className="text-sm font-bold text-ink/55">Last active</p><p className="mt-2 font-display text-3xl font-extrabold">{daysAway === null ? "—" : daysAway === 0 ? "Today" : daysAway === 1 ? "Yesterday" : `${daysAway}d ago`}</p><p className="text-xs text-ink/45">{daysAway !== null && daysAway >= 2 ? "Time for a friendly nudge 💌" : "Right on track"}</p></div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className={`card p-6 ${attention ? "ring-2 ring-brand/40" : ""}`}>
          <p className="eyebrow">Needs you</p><h2 className="mt-1 font-display text-xl font-extrabold">{attention ? `${attention} thing${attention > 1 ? "s" : ""} waiting` : "All caught up ✨"}</h2>
          <ul className="mt-4 space-y-2.5 text-sm font-semibold">
            {[["Missions to review", waitingQuests.length, "todo", "🎯"], ["Levels sent for verification", waitingProofs.length, "todo", "🛡️"], ["Questions from Hanifa", questions.length, "todo", "🙋‍♀️"], ["Entries with no reply yet", needsReply.length, "todo", "💬"]].map(([label, n, target, emoji]) =>
              <li key={String(label)}><button onClick={() => setTab(target as Tab)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:-translate-y-0.5 ${Number(n) ? "bg-brand/10" : "bg-ink/[.04] text-ink/45"}`}><span>{emoji}</span><span className="flex-1">{label}</span><span className="font-display text-lg font-extrabold">{n}</span></button></li>)}
          </ul>
        </section>
        <section className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between"><div><p className="eyebrow">Last 14 days</p><h2 className="mt-1 font-display text-xl font-extrabold">Time studied per day</h2></div><span className="chip bg-ink/5 text-ink/60">{fmtMinutes(last14.reduce((s, x) => s + x.m, 0))} total</span></div>
          <div className="mt-4 flex h-36 items-end gap-1.5" role="img" aria-label="Minutes per day for the last 14 days">
            {last14.map((x, i) => <div key={x.d} title={`${fmtDay(x.d)} · ${fmtMinutes(x.m)}`} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
              {x.m > 0 && <span className="text-[9px] font-bold text-ink/45">{x.m}</span>}
              <div className={`w-full rounded-t-lg ${x.m ? "bg-brand-gradient" : "bg-ink/5"}`} style={{ height: `${Math.max(5, (x.m / maxM) * 100)}%`, animation: `fadeUp .7s ${i * 40}ms cubic-bezier(.2,.8,.2,1) both` }} />
              <span className="text-[9px] font-bold text-ink/30">{fmtDay(x.d, { weekday: "narrow" })}</span>
            </div>)}
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="card p-6">
          <p className="eyebrow">Learning snapshot</p>
          <div className="mt-4 flex items-center gap-4"><Ring value={(game.levelsCleared / roadmap.length) * 100} size={88} stroke={10}><span className="font-display text-xl font-extrabold">{game.levelsCleared}</span></Ring><div className="text-sm"><p className="font-extrabold">levels cleared of {roadmap.length}</p><p className="text-ink/55">{game.verifiedCount} verified by you</p></div></div>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-center"><div className="rounded-2xl bg-ink/[.04] p-3"><dt className="text-[11px] font-bold text-ink/45">Cards mastered</dt><dd className="font-display text-2xl font-extrabold">{game.masteredCards}</dd></div><div className="rounded-2xl bg-ink/[.04] p-3"><dt className="text-[11px] font-bold text-ink/45">Quiz average</dt><dd className="font-display text-2xl font-extrabold">{quizAttempts.length ? `${quizAvg}%` : "—"}</dd></div></dl>
        </section>
        <section className="card p-6">
          <p className="eyebrow">This week by topic</p>
          {byTopic.length ? <ul className="mt-4 space-y-3">{byTopic.slice(0, 5).map(([topic, m]) => <li key={topic}><div className="flex justify-between text-xs font-bold"><span className="truncate">{topic}</span><span className="text-ink/45">{fmtMinutes(m)}</span></div><ProgressBar value={(m / byTopic[0][1]) * 100} className="mt-1" /></li>)}</ul> : <p className="mt-4 text-sm text-ink/50">No time logged this week yet.</p>}
        </section>
        <section className="card p-6">
          <div className="flex items-center justify-between"><p className="eyebrow">Where her XP comes from</p><Trophy size={16} className="text-brand" /></div>
          <ul className="mt-4 space-y-2 text-sm">{game.breakdown.filter(b => b.xp > 0).sort((a, b) => b.xp - a.xp).map(b => <li key={b.label} className="flex items-center gap-2"><span>{b.emoji}</span><span className="flex-1 font-semibold">{b.label}</span><span className="font-extrabold text-brand">{b.xp}</span></li>)}{game.xp === 0 && <li className="text-ink/50">No XP yet. Her first entry will start it.</li>}</ul>
          <p className="mt-4 rounded-2xl bg-ink/[.04] p-3 text-xs text-ink/55">🏅 {game.earnedBadges.length}/{game.badges.length} badges · {game.earnedBadges.slice(-4).map(b => b.emoji).join(" ") || "none yet"}</p>
        </section>
      </div>
    </div>}

    {tab === "todo" && <div className="space-y-8">
      <section><h2 className="font-display text-2xl font-extrabold">Missions to review</h2>
        {waitingQuests.length === 0 ? <p className="card mt-3 p-6 text-sm text-ink/55">Nothing waiting. 🎉</p> : <div className="mt-3 space-y-4">{waitingQuests.map(q => <article key={q.id} className="card animate-fade-up p-5">
          <p className="eyebrow">{q.skill}</p><h3 className="mt-1 font-display text-xl font-extrabold">{q.title}</h3>
          {q.comment && <p className="mt-3 rounded-2xl bg-ink/[.04] p-4 text-sm leading-6"><b>Hanifa:</b> {q.comment}</p>}
          {q.proof && <p className="mt-2 break-all text-xs"><b>Proof:</b> {q.proof.startsWith("http") ? <a className="font-bold text-brand underline" href={q.proof} target="_blank" rel="noopener noreferrer">{q.proof}</a> : q.proof}</p>}
          <textarea className="field mt-4 min-h-20" placeholder="Your feedback (required if sending back)" value={feedback[q.id] ?? ""} onChange={e => setFeedback({ ...feedback, [q.id]: e.target.value })} />
          <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => reviewQuest(q, true)} className="btn-primary !py-2.5 text-xs"><CheckCircle2 size={14} />Approve (+{q.xp ?? XP.defaultQuest} XP)</button><button onClick={() => reviewQuest(q, false)} className="btn-soft !py-2.5 text-xs">Needs a tweak</button></div>
        </article>)}</div>}
      </section>
      <section><h2 className="font-display text-2xl font-extrabold">Levels sent for verification</h2>
        {waitingProofs.length === 0 ? <p className="card mt-3 p-6 text-sm text-ink/55">Nothing sent yet. Hanifa can send proof from any level on the Level Map.</p> : <div className="mt-3 space-y-4">{waitingProofs.map(({ s, i, p }) => <article key={s.id} className="card animate-fade-up p-5">
          <p className="eyebrow">Level {i + 1}</p><h3 className="mt-1 font-display text-xl font-extrabold">{lessons[i].emoji} {s.topic}</h3>
          {p?.note && <p className="mt-3 rounded-2xl bg-ink/[.04] p-4 text-sm leading-6"><b>Hanifa:</b> {p.note}</p>}
          {p?.proof && <p className="mt-2 break-all text-xs"><b>Proof:</b> {p.proof.startsWith("http") ? <a className="font-bold text-brand underline" href={p.proof} target="_blank" rel="noopener noreferrer">{p.proof}</a> : p.proof}</p>}
          <textarea className="field mt-4 min-h-20" placeholder="Feedback (required if asking for more)" value={feedback[s.id] ?? ""} onChange={e => setFeedback({ ...feedback, [s.id]: e.target.value })} />
          <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => reviewProof(i, true)} className="btn-primary !py-2.5 text-xs"><BadgeCheck size={14} />Verify (+{XP.verifiedSkill} XP)</button><button onClick={() => reviewProof(i, false)} className="btn-soft !py-2.5 text-xs">Ask for a bit more</button></div>
        </article>)}</div>}
      </section>
    </div>}

    {(tab === "todo" || tab === "diary") && <section className={tab === "todo" ? "mt-8" : ""}>
      <div className="mb-4 flex flex-wrap items-center gap-2"><h2 className="mr-auto font-display text-2xl font-extrabold">{tab === "todo" ? "Diary entries waiting for your reply" : "Her diary"}</h2>{tab === "diary" && <button onClick={() => setOnlyOpen(v => !v)} className={`chip !px-4 !py-2 transition ${onlyOpen ? "bg-ink text-white" : "bg-white/80 text-ink/60 ring-1 ring-ink/5"}`}>{onlyOpen ? "Show all entries" : "Show only: needs a reply"}</button>}</div>
      {journal.length === 0 ? <p className="card p-6 text-sm text-ink/55">{tab === "todo" ? "All replied. 🎉" : "Nothing to show."}</p> : <div className="stagger space-y-4">{journal.map(a => <article key={a.id} className="card p-5">
        <div className="flex flex-wrap items-center gap-2"><span className="text-xl">{feelingIcon(a.feeling)}</span><h3 className="font-display text-lg font-extrabold">{a.topic}</h3><span className="chip bg-ink/5 text-ink/60">{fmtDay(a.date)}</span>{a.minutes > 0 && <span className="chip bg-brand/10 text-brand">{fmtMinutes(a.minutes)}</span>}{isSample(a) && <span className="chip bg-amber-100 text-amber-900">Sample week</span>}</div>
        {a.did && <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{a.did}</p>}
        {a.practiced && <p className="mt-2 text-xs text-ink/55"><b>Practised:</b> {a.practiced}</p>}
        {a.blocker && <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-2.5 text-sm text-amber-950"><HelpCircle size={14} className="mr-1 inline" /><b>Question:</b> {a.blocker}</p>}
        {(a.proof || a.attachment) && <div className="mt-3 flex flex-wrap items-center gap-3">{a.proof && (a.proof.startsWith("http") ? <a href={a.proof} target="_blank" rel="noopener noreferrer" className="chip bg-brand/10 text-brand underline">🔗 Proof link</a> : <span className="chip bg-ink/5">{a.proof}</span>)}{a.attachment && <a href={a.attachment} target="_blank" rel="noopener noreferrer"><img src={a.attachment} alt="Screenshot" className="h-20 rounded-xl ring-1 ring-ink/10" /></a>}</div>}
        <CommentThread comments={a.comments ?? []} legacyMentorNote={a.mentorNote} viewer="mentor" onAdd={c => comment(a.id, c)} />
      </article>)}</div>}
    </section>}

    {tab === "todo" && <div className="mt-8"><AskedQuestions /></div>}

    {tab === "progress" && <section className="mt-8">
      <h2 className="font-display text-2xl font-extrabold">Level by level</h2><p className="mt-1 text-sm text-ink/55">Activity is hers. The ✅ verified stamp is yours. Tap it to give or remove it.</p>
      <div className="card mt-4 divide-y divide-ink/5 overflow-hidden">{roadmap.map((m, i) => {
        const state = getStageState(i, stageIds, roadmapProgress.passed), id = `module-${m.number}`;
        const total = m.resources.filter(r => !r.optional).length + m.practice.length;
        const done = (roadmapProgress.resources[id] || []).filter(r => m.resources.some(x => x.id === r && !x.optional)).length + (roadmapProgress.practice[id] || []).length;
        const qs = TIERS.map(t => ({ tier: t, result: brain.quiz[quizKey(m.number, t.id)] })), verified = proofs[SKILLS[i].id]?.verified;
        const mastered = lessons[i].cards.filter((_, ci) => (brain.cards[`m${m.number}-c${ci + 1}`]?.box ?? 0) >= 3).length;
        return <div key={m.number} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
          <span className="text-2xl">{lessons[i].emoji}</span>
          <div className="min-w-[10rem] flex-1"><p className="text-sm font-extrabold">{m.number}. {m.title}</p><div className="mt-1.5 flex items-center gap-2"><ProgressBar value={(done / total) * 100} height="h-1.5" className="max-w-40 flex-1" /><span className="text-[11px] font-bold text-ink/40">{done}/{total}</span></div></div>
          <span className={`chip ${state === "passed" ? "bg-emerald-100 text-emerald-800" : state === "ready" ? "bg-brand/10 text-brand" : "bg-ink/5 text-ink/40"}`}>{state === "passed" ? "Cleared" : state === "ready" ? "In progress" : "Locked"}</span>
          <span className="chip bg-ink/5 text-ink/60" title="Flashcards mastered">🃏 {mastered}/{lessons[i].cards.length}</span>
          <span className="flex gap-1" title="Best quiz scores: Easy, Medium, Hard">{qs.map(({ tier, result }) => <span key={tier.id} className={`chip ${result ? (result.best === result.total ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900") : "bg-ink/5 text-ink/40"}`}>{tier.emoji} {result ? `${result.best}/${result.total}` : "—"}</span>)}</span>
          <button onClick={() => toggleVerified(i)} className={`chip !px-3 !py-1.5 transition ${verified ? "bg-brand text-white" : "bg-white text-ink/50 ring-1 ring-ink/10 hover:ring-brand/50"}`}><BadgeCheck size={13} />{verified ? "Verified" : "Verify"}</button>
        </div>;
      })}</div>
    </section>}

    {tab === "settings" && <div className="space-y-5"><CloudSetup /><SheetSync /></div>}

    {tab === "message" && <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-4">
        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-2"><MessageCircle className="text-brand" size={20} /><h2 className="font-display text-xl font-extrabold">Send Hanifa a message</h2></div>
          <div className="mt-4 flex gap-2">{(["cheer", "challenge", "note"] as const).map(k => <button key={k} onClick={() => setMessageKind(k)} className={`chip !px-3.5 !py-2 capitalize transition ${messageKind === k ? "bg-brand text-white shadow-glow" : "bg-ink/5 text-ink/60"}`}>{k === "cheer" ? "💖" : k === "challenge" ? "🎯" : "💬"} {k}</button>)}</div>
          <textarea className="field mt-3 min-h-24" placeholder="Write something encouraging, or a small challenge…" value={message} onChange={e => setMessage(e.target.value)} aria-label="Message" />
          <button onClick={() => send(messageKind, message)} className="btn-primary mt-3"><Send size={15} />Send</button>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-wider text-ink/40">Quick sends</p>
          <div className="mt-2 space-y-2">{TEMPLATES.map(t => <button key={t.text} onClick={() => send(t.kind, t.text)} className="w-full rounded-2xl bg-ink/[.04] px-4 py-2.5 text-left text-xs font-semibold leading-5 transition hover:-translate-y-0.5 hover:bg-brand/10">{t.text}</button>)}</div>
        </div>
        <div className="card p-5 sm:p-6"><h3 className="font-display text-lg font-extrabold">Sent messages</h3>
          {inbox.length === 0 ? <p className="mt-2 text-sm text-ink/50">Nothing sent yet.</p> : <ul className="mt-3 space-y-3">{inbox.slice(0, 8).map(m => <li key={m.id} className="rounded-2xl bg-ink/[.04] p-3.5 text-sm"><p className="leading-6">{m.text}</p><p className="mt-1 flex items-center gap-2 text-[11px] font-bold text-ink/40"><span className="flex-1">{m.kind} · {fmtDay(m.at.slice(0, 10), { day: "numeric", month: "short" })}</span><button onClick={() => { if (window.confirm("Delete this message?")) setInbox(inbox.filter(x => x.id !== m.id)); }} aria-label="Delete message" title="Delete" className="text-ink/40 hover:text-rose-600"><Trash2 size={13} /></button></p>{m.reply && <p className="animate-pop mt-2 rounded-xl bg-white px-3 py-2 text-xs"><b>Hanifa:</b> {m.reply}</p>}</li>)}</ul>}
        </div>
      </section>
      <section className="space-y-4">
        <MissionForm by="mentor" onCreate={q => { setQuests([...quests, q]); celebrate({ emoji: "📌", title: "Mission assigned", text: q.title, confetti: false, sound: "pop" }); }} />
        <div className="card p-5 sm:p-6"><h3 className="font-display text-lg font-extrabold">Missions</h3>
          {quests.length === 0 ? <p className="mt-2 text-sm text-ink/50">None yet.</p> : <ul className="mt-3 space-y-2">{[...quests].sort((a, b) => Number(a.status === "Completed") - Number(b.status === "Completed")).map(q => <li key={q.id} className="rounded-2xl bg-ink/[.04] px-4 py-2.5 text-sm">
            {editing === q.id
              ? <MissionForm by="mentor" initial={q} onCancel={() => setEditing(null)} onCreate={next => { setQuests(quests.map(x => x.id === q.id ? next : x)); setEditing(null); celebrate({ emoji: "✏️", title: "Mission updated", text: next.title, confetti: false, sound: "pop" }); }} />
              : <div className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate font-bold">{q.title}</span><span className="chip bg-white text-ink/60">{q.status}</span>
                <button onClick={() => setEditing(q.id)} aria-label={`Edit ${q.title}`} title="Edit" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-ink/60 transition hover:text-brand"><Pencil size={14} /></button>
                <button onClick={() => { if (window.confirm(`Delete the mission "${q.title}"? This can't be undone.`)) setQuests(quests.filter(x => x.id !== q.id)); }} aria-label={`Delete ${q.title}`} title="Delete" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-ink/60 transition hover:text-rose-600"><Trash2 size={14} /></button></div>}
          </li>)}</ul>}
        </div>
      </section>
    </div>}
  </div>;
}
