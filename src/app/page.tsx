"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Brain, Compass, Flame, MessageCircle, Sparkles, Zap } from "lucide-react";
import { Nova } from "@/components/Nova";
import { Reveal } from "@/components/Reveal";

const WORDS = ["Python", "Git", "your future", "a real app", "the cloud", "your dream"];
const FEATURES = [
  { icon: Compass, emoji: "🗺️", title: "An adventure map", copy: "20 levels from computer basics to building and launching real apps. Unlock each world one at a time." },
  { icon: Brain, emoji: "🧠", title: "Brain Gym", copy: "Flip flashcards, beat quizzes and play the Daily 3. Smart repetition helps it actually stick." },
  { icon: Flame, emoji: "🔥", title: "Streaks, XP & badges", copy: "Show up a little every day, level up, and unlock trophies. Your effort always counts." },
  { icon: MessageCircle, emoji: "💌", title: "A mentor in your corner", copy: "Ask questions, share proof and get comments, cheers and challenges from Xander." },
];
const CHIPS = [["⚡", "+30 XP", "left-[4%] top-[10%]"], ["🔥", "7 day streak", "right-[6%] top-[22%]"], ["🏆", "Quiz Whiz", "left-[10%] bottom-[14%]"], ["🚀", "Level up!", "right-[10%] bottom-[10%]"]];

export default function LandingPage() {
  const [index, setIndex] = useState(0);
  useEffect(() => { const id = window.setInterval(() => setIndex(i => (i + 1) % WORDS.length), 2200); return () => window.clearInterval(id); }, []);
  return <main className="overflow-hidden">
    <section className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16 text-center">
      {CHIPS.map(([emoji, label, pos], i) => <span key={label} className={`glass absolute hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold shadow-pop md:flex ${pos} animate-float`} style={{ animationDelay: `${i * 0.9}s` }}><span className="text-lg">{emoji}</span>{label}</span>)}
      <div className="animate-pop"><Nova size={150} mood="cheer" /></div>
      <p className="eyebrow mt-4 animate-fade-up">My Future World</p>
      <h1 className="mt-3 max-w-3xl animate-fade-up font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
        Learn <span key={index} className="text-gradient inline-block animate-zoom-in">{WORDS[index]}</span>,<br />one small quest at a time.
      </h1>
      <p className="mt-6 max-w-xl animate-fade-up text-lg text-ink/60" style={{ animationDelay: ".15s" }}>A space built for Hanifa’s learning: levels to unlock, streaks to keep, questions to ask and a mentor who’s cheering her on.</p>
      <div className="mt-9 flex animate-fade-up flex-wrap justify-center gap-3" style={{ animationDelay: ".25s" }}>
        <Link href="/home" className="btn-primary !px-8 !py-4 text-base">Open my world <ArrowRight size={18} /></Link>
        <Link href="/adventure" className="btn-soft !px-8 !py-4 text-base">Preview the map</Link>
      </div>
      <p className="mt-6 flex items-center gap-1.5 text-xs font-bold text-ink/40"><Sparkles size={13} />5 minutes a day is enough to start</p>
    </section>

    <section className="mx-auto max-w-6xl px-6 pb-24">
      <Reveal><h2 className="text-center font-display text-3xl font-extrabold sm:text-4xl">Learning that feels like levelling up</h2></Reveal>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">{FEATURES.map((f, i) => <Reveal key={f.title} delay={i * 90}><article className="card card-hover h-full p-7"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-3xl">{f.emoji}</span><h3 className="mt-4 font-display text-xl font-extrabold">{f.title}</h3><p className="mt-2 text-ink/60">{f.copy}</p></article></Reveal>)}</div>

      <Reveal className="mt-14"><div className="bg-hero relative overflow-hidden rounded-[2.2rem] p-8 text-center text-white shadow-glow sm:p-12">
        <Zap className="absolute right-6 top-6 h-24 w-24 text-white/10" />
        <h2 className="relative font-display text-3xl font-extrabold sm:text-4xl">Ready for level 1?</h2>
        <p className="relative mx-auto mt-2 max-w-md text-white/85">Your first 30 XP is one Daily 3 away.</p>
        <Link href="/home" className="btn relative mt-6 bg-white !px-8 !py-4 text-base text-brand shadow-pop hover:-translate-y-0.5">Let’s go <ArrowRight size={18} /></Link>
      </div></Reveal>
    </section>
  </main>;
}
