"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Check, Copy, Flame, MessageCircle, NotebookPen, Pause, Play, Send, Share2, Target, Timer, Trophy } from "lucide-react";
import roadmap from "@/data/roadmap.json";
import { SKILLS, EMPTY_INBOX, EMPTY_QUESTS, EMPTY_ROADMAP, IMPORTED_ACTIVITY, KEYS, addDays, fmtDay, fmtMinutes, localDate, weekStart } from "@/lib/data";
import type { Activity, InboxMessage, Quest, RoadmapProgress } from "@/lib/data";
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

const DEFAULT_GOAL_HOURS = 5;

export default function HomePage() {
  const role = useRole();
  const hydrated = useHydrated();
  const game = useGame();
  const { celebrate } = useCelebrate();
  const [activity] = useLocalStore<Activity[]>(KEYS.activity, IMPORTED_ACTIVITY);
  const [quests] = useLocalStore<Quest[]>(KEYS.quests, EMPTY_QUESTS);
  const [roadmapProgress] = useLocalStore<RoadmapProgress>(KEYS.roadmap, EMPTY_ROADMAP);
  const [goalHours, setGoalHours] = useLocalStore<number>(KEYS.goal, DEFAULT_GOAL_HOURS);
  const [editingGoal, setEditingGoal] = useState(false);
  const [guideSeenRaw, setGuideSeen] = useLocalStore<string>(KEYS.guideSeen, "");
  const guideSeen = !hydrated || guideSeenRaw === "yes";
  const today = hydrated ? localDate() : "";
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
  const weekGoalMinutes = goalHours * 60;
  const weekPct = Math.min(100, Math.round((game.weekMinutes / weekGoalMinutes) * 100));
  const recent = [...activity].filter(a => a.id.startsWith("import-") === false).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  const goals = [
    { done: game.today.brain, emoji: "⚡", title: "Do your Daily 3", sub: `3 brain questions · +${XP.dailyThree} XP`, href: "/learn", cta: "Play" },
    { done: game.today.focus, emoji: "⏱️", title: `Focus for ${DAILY_FOCUS_GOAL_MINUTES} minutes`, sub: `${Math.min(game.todayMinutes, DAILY_FOCUS_GOAL_MINUTES)}/${DAILY_FOCUS_GOAL_MINUTES} min today`, href: "#focus", cta: "Start" },
    { done: game.today.journal, emoji: "📝", title: "Write one line in your journal", sub: `What did you learn? · +${XP.journalEntry} XP`, href: "/time?new=1", cta: "Write" },
  ];

  return <div className="space-y-6">
    {role === "mentor" && <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-ink px-5 py-3 text-sm font-semibold text-white"><span>👀 You’re viewing Hanifa’s space as Mentor.</span><Link href="/mentor" className="chip bg-white/15 text-white">Open Mentor Hub <ArrowRight size={13} /></Link></div>}

    {!guideSeen && role === "learner" && <div className="animate-fade-up flex flex-wrap items-center gap-3 rounded-3xl bg-white/80 px-5 py-3.5 ring-1 ring-brand/30">
      <span className="text-2xl">👋</span><p className="min-w-0 flex-1 text-sm font-semibold">New here? Read <b>How to use me</b>. It explains every tab in simple steps (5 minutes).</p>
      <Link href="/guide" onClick={() => setGuideSeen("yes")} className="btn-primary !py-2 text-xs"><BookOpen size={14} />Show me</Link><button onClick={() => setGuideSeen("yes")} className="text-xs font-bold text-ink/45 hover:text-ink">Not now</button>
    </div>}

    {/* ---------- hero ---------- */}
    <section className="bg-hero relative overflow-hidden rounded-[2.2rem] p-6 text-white shadow-glow sm:p-9">
      <div className="pointer-events-none absolute -right-10 -top-16 h-72 w-72 rounded-full bg-white/10" /><div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-white/10" />
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
            <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2.5 backdrop-blur" title="Day streak">
              <Flame size={26} className={game.streak.current ? "animate-flame text-amber-200" : "text-white/50"} />
              <div className="leading-tight"><p className="font-display text-2xl font-extrabold"><AnimatedNumber value={game.streak.current} /></p><p className="text-[10px] font-bold uppercase tracking-wider text-white/70">day streak</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ---------- today's goals + focus ---------- */}
    <div className="grid gap-6 lg:grid-cols-5">
      <Reveal className="card p-6 lg:col-span-3">
        <div className="flex items-start justify-between gap-3">
          <div><p className="eyebrow">Today’s plan</p><h2 className="mt-1 font-display text-2xl font-extrabold">{game.today.perfect ? "Perfect day! 🌟" : "3 small goals, 1 big day"}</h2><p className="mt-1 text-sm text-ink/55">Finish all three for a <b>+{XP.perfectDay} XP</b> Perfect Day bonus.</p></div>
          <Ring value={(game.today.done / 3) * 100} size={64} stroke={8}><span className="font-display text-lg font-extrabold">{game.today.done}/3</span></Ring>
        </div>
        <ul className="mt-5 space-y-2.5">
          {goals.map(g => <li key={g.title}>
            <Link href={g.href} className={`group flex items-center gap-3 rounded-2xl p-3.5 transition ${g.done ? "bg-emerald-50" : "bg-white/80 ring-1 ring-ink/5 hover:-translate-y-0.5 hover:ring-brand/40"}`}>
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl transition ${g.done ? "animate-check-pop bg-emerald-500 text-white" : "bg-brand/10 group-hover:scale-110"}`}>{g.done ? <Check size={22} /> : g.emoji}</span>
              <span className="min-w-0 flex-1"><span className={`block text-sm font-extrabold ${g.done ? "text-emerald-900 line-through decoration-emerald-400" : ""}`}>{g.title}</span><span className="block text-xs text-ink/50">{g.sub}</span></span>
              {!g.done && <span className="chip bg-brand text-white">{g.cta} <ArrowRight size={12} /></span>}
            </Link>
          </li>)}
        </ul>
      </Reveal>
      <Reveal delay={80} className="lg:col-span-2"><FocusCard /></Reveal>
    </div>

    {/* ---------- messages from Xander ---------- */}
    <Reveal><XanderInbox /></Reveal>

    {/* ---------- stats ---------- */}
    <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="card card-hover p-5"><p className="text-sm font-bold text-ink/55">Today</p><p className="mt-2 font-display text-3xl font-extrabold">{hydrated ? fmtMinutes(game.todayMinutes) : "0m"}</p><p className="mt-1 text-xs text-ink/45">of focused learning</p></div>
      <div className="card card-hover relative p-5">
        <div className="flex items-center justify-between"><p className="text-sm font-bold text-ink/55">This week</p><button onClick={() => setEditingGoal(v => !v)} className="text-[11px] font-bold text-brand">{editingGoal ? "Done" : "Edit goal"}</button></div>
        <p className="mt-2 font-display text-3xl font-extrabold">{hydrated ? fmtMinutes(game.weekMinutes) : "0m"}</p>
        {editingGoal ? <div className="mt-2 flex items-center gap-2 text-xs font-bold">Goal <input type="number" min={1} max={60} value={goalHours} onChange={e => setGoalHours(Math.max(1, Number(e.target.value) || DEFAULT_GOAL_HOURS))} className="field !w-16 !py-1.5" /> hours</div> : <><ProgressBar value={weekPct} className="mt-2" /><p className="mt-1 text-xs text-ink/45">{weekPct}% of your {goalHours}h goal</p></>}
      </div>
      <div className="card card-hover p-5"><p className="text-sm font-bold text-ink/55">Levels cleared</p><p className="mt-2 font-display text-3xl font-extrabold"><AnimatedNumber value={game.levelsCleared} /><span className="text-lg text-ink/35"> / {roadmap.length}</span></p><ProgressBar value={(game.levelsCleared / roadmap.length) * 100} className="mt-2" /></div>
      <div className="card card-hover p-5"><p className="text-sm font-bold text-ink/55">Cards mastered</p><p className="mt-2 font-display text-3xl font-extrabold"><AnimatedNumber value={game.masteredCards} /></p><p className="mt-1 text-xs text-ink/45">stuck in long-term memory 🧠</p></div>
    </Reveal>

    {/* ---------- continue learning + missions ---------- */}
    <div className="grid gap-6 lg:grid-cols-2">
      <Reveal className="card overflow-hidden">
        <div className="bg-brand-gradient p-5 text-white">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/75">Continue your adventure</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold">Level {current.number} · {current.title}</h2>
          <p className="mt-1 text-xs text-white/80">{current.duration} · {doneSteps}/{required} steps done</p>
          <ProgressBar value={(doneSteps / required) * 100} className="mt-3 !bg-white/25" />
        </div>
        <div className="space-y-3 p-5">
          <p className="line-clamp-3 text-sm leading-6 text-ink/65">{current.summary}</p>
          <div className="flex flex-wrap gap-2"><Link href="/adventure" className="btn-primary !py-2.5 text-xs">Open this level <ArrowRight size={14} /></Link><Link href={`/learn?m=${current.number}`} className="btn-soft !py-2.5 text-xs"><Brain size={14} />Flashcards for it</Link></div>
        </div>
      </Reveal>
      <Reveal delay={80} className="card p-5">
        <div className="flex items-center justify-between"><div><p className="eyebrow">Missions</p><h2 className="mt-1 font-display text-xl font-extrabold">From Xander &amp; you</h2></div><Target className="text-brand" /></div>
        {missions.length ? <ul className="mt-4 space-y-2.5">{missions.slice(0, 3).map(q => <li key={q.id} className="flex items-center gap-3 rounded-2xl bg-white/80 p-3 ring-1 ring-ink/5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/10">{q.createdBy === "mentor" ? "📌" : "✨"}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{q.title}</span><span className="block text-xs text-ink/50">{q.status}{q.dueDate ? ` · due ${fmtDay(q.dueDate)}` : ""}</span></span><span className="chip bg-brand/10 text-brand">+{q.xp ?? XP.defaultQuest}</span></li>)}</ul>
          : <div className="mt-4 rounded-2xl border border-dashed border-ink/15 p-6 text-center"><p className="text-3xl">🌤️</p><p className="mt-2 text-sm font-bold">No open missions</p><p className="text-xs text-ink/50">Add your own, or wait for one from Xander.</p></div>}
        <Link href="/quests" className="btn-soft mt-4 w-full !py-2.5 text-xs">{waiting ? `${waiting} waiting for Xander · ` : ""}Open missions <ArrowRight size={14} /></Link>
      </Reveal>
    </div>

    {/* ---------- consistency + badges ---------- */}
    <div className="grid gap-6 lg:grid-cols-5">
      <Reveal className="card p-6 lg:col-span-2">
        <div className="flex items-center justify-between"><div><p className="eyebrow">Consistency</p><h2 className="mt-1 font-display text-xl font-extrabold">Your last 4 weeks</h2></div><span className="chip bg-brand/10 text-brand">Best streak {game.streak.best}</span></div>
        <div className="mt-5 grid grid-cols-7 gap-1.5">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="text-center text-[10px] font-extrabold text-ink/35">{d}</span>)}
          {hydrated && Array.from({ length: 28 }, (_, i) => {
            const date = addDays(weekStart(today), i - 21);
            const minutes = game.perDay[date] || 0, active = game.activeDays.has(date), future = date > today, isToday = date === today;
            const tone = future ? "bg-transparent ring-1 ring-ink/5" : minutes >= 60 ? "bg-brand" : minutes >= 25 ? "bg-brand/60" : active ? "bg-brand/30" : "bg-ink/5";
            return <div key={date} title={`${fmtDay(date)} · ${fmtMinutes(minutes)}`} className={`aspect-square rounded-xl transition hover:scale-110 ${tone} ${isToday ? "ring-2 ring-ink ring-offset-2" : ""}`} />;
          })}
        </div>
        <p className="mt-4 text-xs text-ink/50">Every coloured square is a day you showed up. Darker means more time.</p>
      </Reveal>
      <Reveal delay={80} className="card p-6 lg:col-span-3">
        <div className="flex items-center justify-between"><div><p className="eyebrow">Trophy shelf</p><h2 className="mt-1 font-display text-xl font-extrabold">{game.earnedBadges.length} of {game.badges.length} badges</h2></div><Trophy className="text-brand" /></div>
        <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-6">
          {game.badges.map(b => <div key={b.id} title={b.isEarned ? `${b.name}: ${b.hint}` : `Locked: ${b.hint}`} className={`group flex aspect-square flex-col items-center justify-center rounded-2xl text-center transition ${b.isEarned ? "bg-brand/10 ring-1 ring-brand/30 hover:-translate-y-1 hover:rotate-3" : "bg-ink/5 opacity-50 grayscale"}`}>
            <span className={`text-2xl sm:text-3xl ${b.isEarned ? "group-hover:animate-wiggle" : ""}`}>{b.isEarned ? b.emoji : "🔒"}</span>
            <span className="mt-1 hidden px-1 text-[9px] font-extrabold leading-tight sm:block">{b.name}</span>
          </div>)}
        </div>
        {game.badges.some(b => !b.isEarned) && <p className="mt-4 rounded-2xl bg-ink/[.04] px-4 py-3 text-xs text-ink/60">🎯 <b>Next up:</b> {game.badges.find(b => !b.isEarned)?.name} — {game.badges.find(b => !b.isEarned)?.hint}</p>}
      </Reveal>
    </div>

    {/* ---------- recent wins + share ---------- */}
    <div className="grid gap-6 lg:grid-cols-5">
      <Reveal className="card p-6 lg:col-span-3">
        <div className="flex items-center justify-between"><div><p className="eyebrow">Journal</p><h2 className="mt-1 font-display text-xl font-extrabold">Recent little wins</h2></div><Link href="/time" className="chip bg-brand/10 text-brand">Open journal <ArrowRight size={12} /></Link></div>
        {recent.length ? <ul className="mt-4 divide-y divide-ink/5">{recent.map(a => <li key={a.id} className="flex gap-3 py-3.5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand/10 text-lg">{a.attachment ? "📸" : a.feeling.slice(0, 2) || "📝"}</span><div className="min-w-0"><p className="truncate text-sm font-extrabold">{a.topic}</p><p className="line-clamp-2 text-xs leading-5 text-ink/55">{a.did || "Time logged"}</p><p className="mt-1 text-[11px] font-bold text-ink/35">{fmtDay(a.date)}{a.minutes ? ` · ${fmtMinutes(a.minutes)}` : ""}{a.comments?.some(c => c.by === "mentor") || a.mentorNote ? " · 💬 Xander replied" : ""}</p></div></li>)}</ul>
          : <div className="mt-4 rounded-2xl border border-dashed border-ink/15 p-7 text-center"><NotebookPen className="mx-auto text-brand" /><p className="mt-2 text-sm font-bold">Your story starts with one line</p><Link href="/time?new=1" className="btn-primary mt-3 !py-2.5 text-xs">Write your first entry</Link></div>}
      </Reveal>
      <Reveal delay={80} className="lg:col-span-2"><ShareCard goalHours={goalHours} onCopied={() => celebrate({ emoji: "📋", title: "Update copied!", text: "Paste it to Xander on WhatsApp.", confetti: false, sound: "pop" })} /></Reveal>
    </div>
  </div>;
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

// ------------------------------------------------------------------ messages from Xander
function XanderInbox() {
  const [inbox, setInbox] = useLocalStore<InboxMessage[]>(KEYS.inbox, EMPTY_INBOX);
  const [activity] = useLocalStore<Activity[]>(KEYS.activity, IMPORTED_ACTIVITY);
  const [seen, setSeen] = useLocalStore<string>(KEYS.inboxSeen, "");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  type FeedItem = { id: string; at: string; text: string; kind: InboxMessage["kind"] | "comment"; topic: string; reply?: string };
  const comments: FeedItem[] = activity.flatMap(a => (a.comments ?? []).filter(c => c.by === "mentor").map(c => ({ id: c.id, at: c.at, text: c.text, kind: "comment" as const, topic: a.topic })));
  const feed: FeedItem[] = [...inbox.map(m => ({ ...m, topic: "" })), ...comments].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 4);
  const unread = feed.filter(m => m.at > seen).length;
  const reply = (e: FormEvent, id: string) => { e.preventDefault(); const t = drafts[id]?.trim(); if (!t) return; setInbox(list => list.map(m => m.id === id ? { ...m, reply: t, repliedAt: new Date().toISOString() } : m)); setDrafts(d => ({ ...d, [id]: "" })); };
  const icon = (kind: string) => kind === "cheer" ? "💖" : kind === "challenge" ? "🎯" : "💬";

  return <section className={`card p-6 ${unread ? "ring-2 ring-brand/50" : ""}`}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-3"><span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-ink text-xl text-white"><MessageCircle size={20} />{unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-extrabold animate-pop">{unread}</span>}</span><div><p className="eyebrow">From Xander</p><h2 className="font-display text-xl font-extrabold">{feed.length ? (unread ? "You have new messages" : "Messages & comments") : "Nothing yet"}</h2></div></div>
      {unread > 0 && <button onClick={() => setSeen(new Date().toISOString())} className="chip bg-ink/5 text-ink/60 hover:bg-ink/10"><Check size={12} />Mark all read</button>}
    </div>
    {feed.length === 0 ? <p className="mt-3 text-sm text-ink/55">When Xander sends a cheer, a challenge or comments on your journal, it shows up here. 💌</p> :
      <ul className="mt-4 space-y-3">{feed.map(m => <li key={m.id} className={`animate-fade-up rounded-2xl p-4 ${m.at > seen ? "bg-brand/10" : "bg-white/80 ring-1 ring-ink/5"}`}>
        <div className="flex gap-3"><span className="text-2xl">{icon(m.kind)}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold leading-6">{m.text}</p><p className="mt-0.5 text-[11px] font-bold text-ink/40">{m.kind === "comment" ? `On your journal · ${m.topic}` : m.kind === "challenge" ? "Challenge" : "Message"}{m.at ? ` · ${fmtDay(m.at.slice(0, 10), { day: "numeric", month: "short" })}` : ""}</p>
          {m.reply && <p className="mt-2 rounded-2xl bg-white px-3 py-2 text-xs"><b>You:</b> {m.reply}</p>}
          {!m.reply && m.kind !== "comment" && <form onSubmit={e => reply(e, m.id)} className="mt-2 flex gap-2"><input value={drafts[m.id] ?? ""} onChange={e => setDrafts(d => ({ ...d, [m.id]: e.target.value }))} placeholder="Reply…" className="field !py-2 text-xs" aria-label="Reply" /><button className="btn-primary !px-3.5 !py-2" aria-label="Send reply"><Send size={14} /></button></form>}
          {m.kind === "comment" && <Link href="/time" className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-brand">Reply in journal <ArrowRight size={12} /></Link>}
        </div></div>
      </li>)}</ul>}
  </section>;
}

// ------------------------------------------------------------------ share progress with Xander
function ShareCard({ goalHours, onCopied }: { goalHours: number; onCopied: () => void }) {
  const game = useGame();
  const [activity] = useLocalStore<Activity[]>(KEYS.activity, IMPORTED_ACTIVITY);
  const [quests] = useLocalStore<Quest[]>(KEYS.quests, EMPTY_QUESTS);
  const hydrated = useHydrated();
  const text = useMemo(() => {
    if (!hydrated) return "";
    const today = localDate(), start = weekStart(today);
    const week = activity.filter(a => !a.id.startsWith("import-") && a.date >= start && a.date <= today);
    const topics = [...new Set(week.map(a => a.topic))].join(", ") || "—";
    const questions = week.filter(a => a.blocker.trim()).map(a => `• ${a.topic}: ${a.blocker.trim()}`);
    return [
      `🌸 Hanifa’s update — week of ${fmtDay(start, { day: "numeric", month: "short" })}`,
      `⏱️ Time: ${fmtMinutes(game.weekMinutes)} of ${goalHours}h goal`,
      `🔥 Streak: ${game.streak.current} days · Level ${game.level} ${game.rank.title} (${game.xp} XP)`,
      `📚 Studied: ${topics}`,
      `🚀 Levels cleared: ${game.levelsCleared}/20 · Cards mastered: ${game.masteredCards}`,
      `✅ Missions done: ${quests.filter(q => q.status === "Completed").length} · Journal entries this week: ${week.length}`,
      questions.length ? `\n❓ Questions for Xander:\n${questions.join("\n")}` : "",
    ].filter(Boolean).join("\n");
  }, [hydrated, activity, quests, game, goalHours]);
  const copy = async () => { try { await navigator.clipboard.writeText(text); onCopied(); } catch { window.prompt("Copy this update:", text); } };
  return <div className="card h-full p-6">
    <div className="flex items-center justify-between"><div><p className="eyebrow">Share</p><h2 className="mt-1 font-display text-xl font-extrabold">Update Xander</h2></div><Share2 className="text-brand" /></div>
    <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap rounded-2xl bg-ink/[.04] p-4 font-sans text-xs leading-5 text-ink/70">{text || "…"}</pre>
    <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={copy} className="btn-primary !py-2.5 text-xs"><Copy size={14} />Copy</button><a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="btn-soft !py-2.5 text-xs">WhatsApp</a></div>
  </div>;
}
