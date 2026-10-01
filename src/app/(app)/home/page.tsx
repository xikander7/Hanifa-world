"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, Flame, MessageCircle, Pause, Play, Send, Target, Timer } from "lucide-react";
import roadmap from "@/data/roadmap.json";
import { SKILLS, EMPTY_ASKS, EMPTY_INBOX, EMPTY_QUESTS, EMPTY_ROADMAP, IMPORTED_ACTIVITY, KEYS, fmtDay } from "@/lib/data";
import type { Activity, AskLog, InboxMessage, Quest, RoadmapProgress } from "@/lib/data";
import { DAILY_FOCUS_GOAL_MINUTES, XP } from "@/lib/game";
import { novaSays } from "@/lib/nova";
import { finishFocus, useFocusTimer } from "@/lib/useFocus";
import { useGame } from "@/lib/useGame";
import { useNow } from "@/lib/useNow";
import { getStageState } from "@/lib/roadmap-progress";
import { useHydrated, useLocalStore } from "@/lib/store";
import { useRole } from "@/components/AppShell";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useCelebrate } from "@/components/Celebrate";
import { Nova } from "@/components/Nova";
import { ProgressBar } from "@/components/ProgressBar";
import { Reveal } from "@/components/Reveal";
import { Ring } from "@/components/Ring";

export default function HomePage() {
  const role = useRole();
  const hydrated = useHydrated();
  const game = useGame();
  const [quests] = useLocalStore<Quest[]>(KEYS.quests, EMPTY_QUESTS);
  const [roadmapProgress] = useLocalStore<RoadmapProgress>(KEYS.roadmap, EMPTY_ROADMAP);
  const [guideSeenRaw, setGuideSeen] = useLocalStore<string>(KEYS.guideSeen, "");
  const guideSeen = !hydrated || guideSeenRaw === "yes";
  const hour = hydrated ? new Date().getHours() : 12;
  const line = novaSays(game, hour);

  const stageIds = roadmap.map(m => `module-${m.number}`);
  const readyIndex = stageIds.findIndex((_, i) => getStageState(i, stageIds, roadmapProgress.passed) === "ready");
  const current = roadmap[readyIndex >= 0 ? readyIndex : roadmap.length - 1];
  const currentId = `module-${current.number}`;
  const required = current.resources.filter(r => !r.optional).length + current.practice.length;
  const doneSteps = (roadmapProgress.resources[currentId] || []).filter(id => current.resources.some(r => r.id === id && !r.optional)).length + (roadmapProgress.practice[currentId] || []).length;

  const missions = quests.filter(q => q.status !== "Completed");
  const waiting = quests.filter(q => q.status === "Waiting for Mentor").length;

  const goals = [
    { done: game.today.brain, emoji: "⚡", title: "Do your Daily 3", sub: `3 brain questions · +${XP.dailyThree} XP`, href: "/learn", cta: "Play" },
    { done: game.today.focus, emoji: "⏱️", title: `Focus for ${DAILY_FOCUS_GOAL_MINUTES} minutes`, sub: `${Math.min(game.todayMinutes, DAILY_FOCUS_GOAL_MINUTES)}/${DAILY_FOCUS_GOAL_MINUTES} min today`, href: "#focus", cta: "Start" },
    { done: game.today.journal, emoji: "📝", title: "Write one line in your journal", sub: `What did you learn? · +${XP.journalEntry} XP`, href: "/time?new=1", cta: "Write" },
  ];

  const stepPct = required ? Math.round((doneSteps / required) * 100) : 0;

  return <div className="space-y-6">
    {role === "mentor" && <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-ink px-5 py-3 text-sm font-semibold text-white"><span>👀 You’re viewing Hanifa’s space as Mentor.</span><Link href="/mentor" className="chip bg-white/15 text-white">Open Mentor Hub <ArrowRight size={13} /></Link></div>}

    {!guideSeen && role === "learner" && <div className="animate-fade-up flex flex-wrap items-center gap-3 rounded-3xl bg-white/80 px-5 py-3.5 ring-1 ring-brand/30">
      <span className="animate-wave text-2xl">👋</span><p className="min-w-0 flex-1 text-sm font-semibold">New here? Read <b>How to use this app</b>. It takes 3 minutes.</p>
      <Link href="/guide" onClick={() => setGuideSeen("yes")} className="btn-primary !py-2 text-xs"><BookOpen size={14} />Show me</Link><button onClick={() => setGuideSeen("yes")} className="text-xs font-bold text-ink/45 hover:text-ink">Not now</button>
    </div>}

    {/* ---------- hero ---------- */}
    <section className="bg-hero relative overflow-hidden rounded-[2.2rem] p-6 text-white shadow-glow sm:p-9">
      <div className="pointer-events-none absolute -right-10 -top-16 h-72 w-72 animate-float-slow rounded-full bg-white/10" /><div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 animate-float-slow rounded-full bg-white/10" style={{ animationDelay: "-6s" }} />
      <Sparkles />
      <div className="relative grid items-center gap-6 md:grid-cols-[auto_1fr]">
        <div className="mx-auto md:mx-0"><Nova mood={line.mood} size={112} /></div>
        <div>
          <div className="animate-pop relative rounded-3xl rounded-bl-md bg-white px-5 py-4 text-ink shadow-pop" key={line.text}>
            <p className="text-sm font-semibold leading-6 sm:text-base">{line.text}</p>
          </div>
          <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">{game.rank.emoji} {game.rank.title}</p>
              <p className="font-display text-5xl font-extrabold leading-none">Level <AnimatedNumber value={game.level} /></p>
            </div>
            <div className="min-w-[12rem] flex-1">
              <div className="flex justify-between text-xs font-bold text-white/80"><span><AnimatedNumber value={game.xp} /> XP</span><span>{game.xpToNext} to next level</span></div>
              <ProgressBar value={game.levelProgress} height="h-3.5" className="mt-1.5 !bg-white/25" />
            </div>
            <Link href="/me" className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur transition hover:scale-105 hover:bg-white/25" title="Day streak · see your trophies">
              <Flame size={26} className={game.streak.current ? "animate-flame text-amber-200" : "text-white/50"} />
              <div className="leading-tight"><p className="font-display text-2xl font-extrabold"><AnimatedNumber value={game.streak.current} /></p><p className="text-[10px] font-bold uppercase tracking-wider text-white/70">day streak</p></div>
            </Link>
          </div>
        </div>
      </div>
    </section>

    {/* ---------- the one big next step ---------- */}
    <Link href="/adventure" className="group card card-hover relative block overflow-hidden p-0">
      <div className="shine absolute inset-0 opacity-60" aria-hidden />
      <div className="relative flex flex-wrap items-center gap-5 p-6">
        <span className="relative grid h-20 w-20 shrink-0 place-items-center">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand/30" />
          <span className="relative grid h-20 w-20 place-items-center rounded-full bg-brand text-white shadow-glow transition group-hover:scale-110"><Play size={34} className="ml-1" fill="currentColor" /></span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Your next quest</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">Level {current.number} · {current.title}</h2>
          <div className="mt-3 flex items-center gap-3"><ProgressBar value={stepPct} height="h-3" className="flex-1" /><span className="chip bg-brand/10 text-brand">{doneSteps}/{required} steps</span></div>
        </div>
        <span className="btn-primary hidden sm:inline-flex">Let’s go <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
      </div>
    </Link>

    {/* ---------- today's goals + focus ---------- */}
    <div className="grid gap-6 lg:grid-cols-5">
      <Reveal className="card p-6 lg:col-span-3">
        <div className="flex items-start justify-between gap-3">
          <div><p className="eyebrow">Today’s plan</p><h2 className="mt-1 font-display text-2xl font-extrabold">{game.today.perfect ? "Perfect day! 🌟" : "3 small goals, 1 big day"}</h2><p className="mt-1 text-sm text-ink/55">Finish all three for a <b>+{XP.perfectDay} XP</b> Perfect Day bonus.</p></div>
          <Ring value={(game.today.done / 3) * 100} size={64} stroke={8}><span className="font-display text-lg font-extrabold">{game.today.done}/3</span></Ring>
        </div>
        <ul className="stagger mt-5 space-y-2.5">
          {goals.map(g => <li key={g.title}>
            <Link href={g.href} className={`group flex items-center gap-3 rounded-2xl p-3.5 transition ${g.done ? "bg-emerald-50" : "bg-white/80 ring-1 ring-ink/5 hover:-translate-y-0.5 hover:ring-brand/40"}`}>
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl transition ${g.done ? "animate-check-pop bg-emerald-500 text-white" : "bg-brand/10 group-hover:scale-110 group-hover:rotate-6"}`}>{g.done ? <Check size={22} /> : g.emoji}</span>
              <span className="min-w-0 flex-1"><span className={`block text-sm font-extrabold ${g.done ? "text-emerald-900 line-through decoration-emerald-400" : ""}`}>{g.title}</span><span className="block text-xs text-ink/50">{g.sub}</span></span>
              {!g.done && <span className="chip bg-brand text-white">{g.cta} <ArrowRight size={12} /></span>}
            </Link>
          </li>)}
        </ul>
      </Reveal>
      <Reveal delay={80} className="lg:col-span-2"><FocusCard /></Reveal>
    </div>

    {/* ---------- messages + missions from Sikander ---------- */}
    <div className="grid gap-6 lg:grid-cols-2">
      <Reveal><SikanderInbox /></Reveal>
      <Reveal delay={80} className="card p-6">
        <div className="flex items-center justify-between"><div><p className="eyebrow">Missions</p><h2 className="mt-1 font-display text-xl font-extrabold">Little jobs with prizes</h2></div><Target className="text-brand animate-bounce-soft" /></div>
        {missions.length ? <ul className="stagger mt-4 space-y-2.5">{missions.slice(0, 3).map(q => <li key={q.id}><Link href="/quests" className="flex items-center gap-3 rounded-2xl bg-white/80 p-3 ring-1 ring-ink/5 transition hover:-translate-y-0.5 hover:ring-brand/40"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10">{q.createdBy === "mentor" ? "📌" : "✨"}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{q.title}</span><span className="block text-xs text-ink/50">{q.status}{q.dueDate ? ` · due ${fmtDay(q.dueDate)}` : ""}</span></span><span className="chip bg-brand/10 text-brand">+{q.xp ?? XP.defaultQuest}</span></Link></li>)}</ul>
          : <div className="mt-4 rounded-2xl border border-dashed border-ink/15 p-6 text-center"><p className="animate-bounce-soft text-3xl">🌤️</p><p className="mt-2 text-sm font-bold">No missions right now</p><p className="text-xs text-ink/50">Make your own, or wait for one from Sikander.</p></div>}
        <Link href="/quests" className="btn-soft mt-4 w-full !py-2.5 text-xs">{waiting ? `${waiting} waiting for Sikander · ` : ""}Open missions <ArrowRight size={14} /></Link>
      </Reveal>
    </div>

    <Link href="/me" className="group card card-hover flex items-center gap-4 p-5">
      <span className="text-4xl transition group-hover:animate-wiggle">🏆</span>
      <div className="min-w-0 flex-1"><p className="font-display text-lg font-extrabold">Your trophy room</p><p className="text-sm text-ink/60">{game.earnedBadges.length} of {game.badges.length} badges won · best streak {game.streak.best} days</p></div>
      <ArrowRight className="text-brand transition group-hover:translate-x-1" />
    </Link>
  </div>;
}

/** Little stars twinkling across the hero. */
function Sparkles() {
  const spots = [["8%", "18%", "0s"], ["22%", "78%", ".9s"], ["62%", "12%", "1.6s"], ["88%", "62%", ".4s"], ["45%", "88%", "2.1s"]];
  return <div className="pointer-events-none absolute inset-0" aria-hidden>{spots.map(([left, top, delay]) => <span key={left} className="absolute animate-twinkle text-lg" style={{ left, top, animationDelay: delay }}>✦</span>)}</div>;
}

// ------------------------------------------------------------------ focus timer
function FocusCard() {
  const { timer, start } = useFocusTimer();
  const { celebrate } = useCelebrate();
  const running = Boolean(timer);
  const now = useNow(1000, running);
  const [minutes, setMinutes] = useState(25);
  const [topic, setTopic] = useState("");
  const topics = useMemo(() => SKILLS.map(s => s.topic), []);
  const chosen = topic || topics[0];
  const total = timer ? timer.minutes * 60 : minutes * 60;
  const left = timer ? Math.max(0, Math.round((timer.endsAt - now) / 1000)) : total;
  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(left % 60).padStart(2, "0");

  const stopEarly = () => {
    const logged = finishFocus();
    celebrate(logged ? { emoji: "👏", title: `${logged} min saved`, text: "Every minute counts.", xp: logged, sound: "pop" } : { emoji: "🌱", title: "Session ended", text: "Under a minute, so nothing was logged.", confetti: false, sound: "pop" });
  };

  return <div id="focus" className="card relative h-full overflow-hidden p-6">
    <div className="flex items-start justify-between"><div><p className="eyebrow">Focus mode</p><h2 className="mt-1 font-display text-2xl font-extrabold">{running ? "In the zone 🎧" : "Start a focus session"}</h2></div><Timer className="text-brand" /></div>
    <div className="mt-4 flex flex-col items-center">
      <div className="relative">
        {running && <span className="absolute inset-0 rounded-full bg-brand/20 animate-pulse-ring" />}
        <Ring value={running ? ((total - left) / total) * 100 : 0} size={170} stroke={12}>
          <div><p className="font-display text-4xl font-extrabold tabular-nums">{mm}:{ss}</p><p className="text-[11px] font-bold text-ink/45">{running ? timer?.topic : `${minutes} min`}</p></div>
        </Ring>
      </div>
      {!running ? <>
        <div className="mt-4 flex gap-2">{[15, 25, 45, 60].map(m => <button key={m} onClick={() => setMinutes(m)} className={`chip !px-3.5 !py-1.5 transition ${minutes === m ? "bg-brand text-white shadow-glow" : "bg-ink/5 text-ink/60 hover:bg-ink/10"}`}>{m}m</button>)}</div>
        <select value={chosen} onChange={e => setTopic(e.target.value)} className="field mt-3 !py-2.5" aria-label="Topic">{topics.map(t => <option key={t}>{t}</option>)}</select>
        <button onClick={() => start(minutes, chosen)} className="btn-primary mt-4 w-full"><Play size={16} />Start {minutes} min</button>
      </> : <button onClick={stopEarly} className="btn-soft mt-5 w-full"><Pause size={16} />Finish early &amp; save</button>}
    </div>
    <p className="mt-3 text-center text-[11px] text-ink/40">Time is saved to your journal automatically, even if you switch pages.</p>
  </div>;
}

// ------------------------------------------------------------------ messages from Sikander
function SikanderInbox() {
  const [inbox, setInbox] = useLocalStore<InboxMessage[]>(KEYS.inbox, EMPTY_INBOX);
  const [activity] = useLocalStore<Activity[]>(KEYS.activity, IMPORTED_ACTIVITY);
  const [seen, setSeen] = useLocalStore<string>(KEYS.inboxSeen, "");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [asks] = useLocalStore<AskLog[]>(KEYS.asks, EMPTY_ASKS);
  type FeedItem = { id: string; at: string; text: string; kind: InboxMessage["kind"] | "comment"; topic: string; reply?: string; onAsk?: boolean };
  const comments: FeedItem[] = activity.flatMap(a => (a.comments ?? []).filter(c => c.by === "mentor").map(c => ({ id: c.id, at: c.at, text: c.text, kind: "comment" as const, topic: a.topic })));
  const askComments: FeedItem[] = asks.flatMap(a => (a.comments ?? []).filter(c => c.by === "mentor").map(c => ({ id: c.id, at: c.at, text: c.text, kind: "comment" as const, topic: a.question || a.topic, onAsk: true })));
  const feed: FeedItem[] = [...inbox.map(m => ({ ...m, topic: "" })), ...comments, ...askComments].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);
  const unread = feed.filter(m => m.at > seen).length;
  const reply = (e: FormEvent, id: string) => { e.preventDefault(); const t = drafts[id]?.trim(); if (!t) return; setInbox(list => list.map(m => m.id === id ? { ...m, reply: t, repliedAt: new Date().toISOString() } : m)); setDrafts(d => ({ ...d, [id]: "" })); };
  const icon = (kind: string) => kind === "cheer" ? "💖" : kind === "challenge" ? "🎯" : "💬";

  return <section className={`card p-6 ${unread ? "ring-2 ring-brand/50" : ""}`}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-3"><span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-ink text-xl text-white"><MessageCircle size={20} />{unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-extrabold animate-pop">{unread}</span>}</span><div><p className="eyebrow">From Sikander</p><h2 className="font-display text-xl font-extrabold">{feed.length ? (unread ? "You have new messages" : "Messages & comments") : "Nothing yet"}</h2></div></div>
      {unread > 0 && <button onClick={() => setSeen(new Date().toISOString())} className="chip bg-ink/5 text-ink/60 hover:bg-ink/10"><Check size={12} />Mark all read</button>}
    </div>
    {feed.length === 0 ? <p className="mt-3 text-sm text-ink/55">When Sikander sends a cheer, a challenge or comments on your journal or questions, it shows up here. 💌</p> :
      <ul className="mt-4 space-y-3">{feed.map(m => <li key={m.id} className={`animate-fade-up rounded-2xl p-4 ${m.at > seen ? "bg-brand/10" : "bg-white/80 ring-1 ring-ink/5"}`}>
        <div className="flex gap-3"><span className="text-2xl">{icon(m.kind)}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold leading-6">{m.text}</p><p className="mt-0.5 text-[11px] font-bold text-ink/40">{m.kind === "comment" ? `${m.onAsk ? "On your question" : "On your journal"} · ${m.topic}` : m.kind === "challenge" ? "Challenge" : "Message"}{m.at ? ` · ${fmtDay(m.at.slice(0, 10), { day: "numeric", month: "short" })}` : ""}</p>
          {m.reply && <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-xs"><b>You:</b> {m.reply}</p>}
          {!m.reply && m.kind !== "comment" && <form onSubmit={e => reply(e, m.id)} className="mt-2 flex gap-2"><input value={drafts[m.id] ?? ""} onChange={e => setDrafts(d => ({ ...d, [m.id]: e.target.value }))} placeholder="Reply…" className="field !py-2 text-xs" aria-label="Reply" /><button className="btn-primary !px-3.5 !py-2" aria-label="Send reply"><Send size={14} /></button></form>}
          {m.kind === "comment" && <Link href={m.onAsk ? "/ask#my-questions" : "/time"} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-brand">{m.onAsk ? "Reply on your question" : "Reply in journal"} <ArrowRight size={12} /></Link>}
        </div></div>
      </li>)}</ul>}
  </section>;
}
