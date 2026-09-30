"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Flame, Trophy } from "lucide-react";
import roadmap from "@/data/roadmap.json";
import { KEYS, addDays, fmtDay, fmtMinutes, localDate, weekStart } from "@/lib/data";
import { useGame } from "@/lib/useGame";
import { useHydrated, useLocalStore } from "@/lib/store";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useCelebrate } from "@/components/Celebrate";
import { Nova } from "@/components/Nova";
import { ProgressBar } from "@/components/ProgressBar";
import { Reveal } from "@/components/Reveal";
import { ShareCard } from "@/components/ShareCard";

const DEFAULT_GOAL_HOURS = 5;

const MORE = [
  { href: "/dreams", emoji: "🌍", title: "Dream board", text: "Universities and scholarships you like." },
  { href: "/quests", emoji: "🎯", title: "Missions", text: "Little jobs with XP prizes." },
  { href: "/sheet", emoji: "📊", title: "Working Excel Sheet", text: "The sheet you share with Sikander." },
];

/** Hanifa's trophy room: everything she has won, her streak calendar, and a report for Sikander. */
export default function TrophiesPage() {
  const hydrated = useHydrated();
  const game = useGame();
  const { celebrate } = useCelebrate();
  const [goalHours, setGoalHours] = useLocalStore<number>(KEYS.goal, DEFAULT_GOAL_HOURS);
  const [editingGoal, setEditingGoal] = useState(false);
  const today = hydrated ? localDate() : "";
  const weekPct = Math.min(100, Math.round((game.weekMinutes / (goalHours * 60)) * 100));
  const nextBadge = game.badges.find(b => !b.isEarned);

  return <div className="space-y-6">
    {/* ---------- hero ---------- */}
    <section className="bg-hero relative overflow-hidden rounded-[2.2rem] p-6 text-white shadow-glow sm:p-9">
      <div className="pointer-events-none absolute -left-12 -top-16 h-64 w-64 animate-float-slow rounded-full bg-white/10" />
      <div className="relative flex flex-wrap items-center gap-6">
        <span className="animate-bounce-soft text-7xl drop-shadow-lg sm:text-8xl">🏆</span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-widest text-white/75">Your trophy room</p>
          <h1 className="mt-1 font-display text-4xl font-extrabold sm:text-5xl">{game.rank.emoji} Level <AnimatedNumber value={game.level} /></h1>
          <p className="mt-1 text-sm text-white/85">{game.rank.title} · <AnimatedNumber value={game.xp} /> XP · {game.xpToNext} XP to the next level</p>
          <ProgressBar value={game.levelProgress} height="h-3" className="mt-3 max-w-md !bg-white/25" />
        </div>
        <div className="flex gap-3">
          <div className="rounded-3xl bg-white/15 px-5 py-4 text-center backdrop-blur"><Flame size={28} className={`mx-auto ${game.streak.current ? "animate-flame text-amber-200" : "text-white/50"}`} /><p className="mt-1 font-display text-3xl font-extrabold"><AnimatedNumber value={game.streak.current} /></p><p className="text-[10px] font-bold uppercase tracking-wider text-white/75">day streak</p></div>
          <div className="rounded-3xl bg-white/15 px-5 py-4 text-center backdrop-blur"><Trophy size={28} className="mx-auto text-amber-200" /><p className="mt-1 font-display text-3xl font-extrabold"><AnimatedNumber value={game.earnedBadges.length} /></p><p className="text-[10px] font-bold uppercase tracking-wider text-white/75">badges</p></div>
        </div>
      </div>
    </section>

    {/* ---------- trophy shelf ---------- */}
    <Reveal className="card p-6">
      <div className="flex items-center justify-between"><div><p className="eyebrow">Trophy shelf</p><h2 className="mt-1 font-display text-2xl font-extrabold">{game.earnedBadges.length} of {game.badges.length} badges</h2></div><Nova mood="cheer" size={56} /></div>
      <div className="stagger mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {game.badges.map(b => <div key={b.id} title={b.isEarned ? `${b.name}: ${b.hint}` : `Locked: ${b.hint}`} className={`group flex aspect-square flex-col items-center justify-center rounded-3xl p-2 text-center transition ${b.isEarned ? "bg-brand/10 ring-1 ring-brand/30 hover:-translate-y-1.5 hover:rotate-3 hover:shadow-glow" : "bg-ink/5 opacity-55 grayscale"}`}>
          <span className={`text-3xl sm:text-4xl ${b.isEarned ? "group-hover:animate-wiggle" : ""}`}>{b.isEarned ? b.emoji : "🔒"}</span>
          <span className="mt-1.5 text-[10px] font-extrabold leading-tight">{b.name}</span>
        </div>)}
      </div>
      {nextBadge && <p className="mt-5 rounded-2xl bg-brand/10 px-4 py-3 text-sm"><span className="mr-1">🎯</span><b>Win next:</b> {nextBadge.name}. {nextBadge.hint}</p>}
    </Reveal>

    {/* ---------- numbers ---------- */}
    <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div className="card card-hover p-5"><p className="text-sm font-bold text-ink/55">⏱️ Today</p><p className="mt-2 font-display text-3xl font-extrabold">{hydrated ? fmtMinutes(game.todayMinutes) : "0m"}</p><p className="mt-1 text-xs text-ink/45">of learning</p></div>
      <div className="card card-hover p-5">
        <div className="flex items-center justify-between"><p className="text-sm font-bold text-ink/55">📅 This week</p><button onClick={() => setEditingGoal(v => !v)} className="text-[11px] font-bold text-brand">{editingGoal ? "Done" : "Edit goal"}</button></div>
        <p className="mt-2 font-display text-3xl font-extrabold">{hydrated ? fmtMinutes(game.weekMinutes) : "0m"}</p>
        {editingGoal ? <div className="mt-2 flex items-center gap-2 text-xs font-bold">Goal <input type="number" min={1} max={60} value={goalHours} onChange={e => setGoalHours(Math.max(1, Number(e.target.value) || DEFAULT_GOAL_HOURS))} className="field !w-16 !py-1.5" /> hours</div> : <><ProgressBar value={weekPct} className="mt-2" /><p className="mt-1 text-xs text-ink/45">{weekPct}% of your {goalHours}h goal</p></>}
      </div>
      <div className="card card-hover p-5"><p className="text-sm font-bold text-ink/55">🗺️ Levels cleared</p><p className="mt-2 font-display text-3xl font-extrabold"><AnimatedNumber value={game.levelsCleared} /><span className="text-lg text-ink/35"> / {roadmap.length}</span></p><ProgressBar value={(game.levelsCleared / roadmap.length) * 100} className="mt-2" /></div>
      <div className="card card-hover p-5"><p className="text-sm font-bold text-ink/55">🃏 Cards mastered</p><p className="mt-2 font-display text-3xl font-extrabold"><AnimatedNumber value={game.masteredCards} /></p><p className="mt-1 text-xs text-ink/45">stuck in your memory</p></div>
    </Reveal>

    {/* ---------- streak calendar + share ---------- */}
    <div className="grid gap-6 lg:grid-cols-5">
      <Reveal className="card p-6 lg:col-span-3">
        <div className="flex items-center justify-between"><div><p className="eyebrow">Streak calendar</p><h2 className="mt-1 font-display text-xl font-extrabold">Your last 4 weeks</h2></div><span className="chip bg-brand/10 text-brand">Best streak {game.streak.best}</span></div>
        <div className="mt-5 grid grid-cols-7 gap-1.5">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i} className="text-center text-[10px] font-extrabold text-ink/35">{d}</span>)}
          {hydrated && Array.from({ length: 28 }, (_, i) => {
            const date = addDays(weekStart(today), i - 21);
            const minutes = game.perDay[date] || 0, active = game.activeDays.has(date), future = date > today, isToday = date === today;
            const tone = future ? "bg-transparent ring-1 ring-ink/5" : minutes >= 60 ? "bg-brand" : minutes >= 25 ? "bg-brand/60" : active ? "bg-brand/30" : "bg-ink/5";
            return <div key={date} title={`${fmtDay(date)} · ${fmtMinutes(minutes)}`} style={{ animationDelay: `${i * 18}ms` }} className={`animate-pop aspect-square rounded-xl transition hover:scale-110 ${tone} ${isToday ? "ring-2 ring-ink ring-offset-2" : ""}`} />;
          })}
        </div>
        <p className="mt-4 text-xs text-ink/50">Every coloured square is a day you showed up. Darker means more time.</p>
      </Reveal>
      <Reveal delay={80} className="lg:col-span-2"><ShareCard goalHours={goalHours} onCopied={() => celebrate({ emoji: "📋", title: "Update copied!", text: "Paste it to Sikander on WhatsApp.", confetti: false, sound: "pop" })} /></Reveal>
    </div>

    {/* ---------- more places ---------- */}
    <div className="stagger grid gap-4 sm:grid-cols-3">
      {MORE.map(m => <Link key={m.href} href={m.href} className="group card card-hover flex items-center gap-4 p-5">
        <span className="text-4xl transition group-hover:scale-125 group-hover:-rotate-6">{m.emoji}</span>
        <span className="min-w-0 flex-1"><span className="block font-display text-lg font-extrabold">{m.title}</span><span className="block text-xs text-ink/55">{m.text}</span></span>
        <ArrowRight size={18} className="text-brand transition group-hover:translate-x-1" />
      </Link>)}
    </div>
  </div>;
}
