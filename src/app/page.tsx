"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { Nova } from "@/components/Nova";
import { QuestTrail } from "@/components/QuestTrail";
import { Reveal } from "@/components/Reveal";

const WORDS = ["Python", "Git", "your future", "a real app", "the cloud", "your dream"];
const FEATURES = [
  { emoji: "🗺️", title: "An adventure map", copy: "20 levels from computer basics to building and launching real apps. Unlock each world one at a time." },
  { emoji: "🧠", title: "Quiz & Cards", copy: "Flip flashcards, beat quizzes and play the Daily 3. Smart repetition helps it actually stick." },
  { emoji: "🔥", title: "Streaks, XP & badges", copy: "Show up a little every day, level up, and unlock trophies. Your effort always counts." },
  { emoji: "💌", title: "A mentor in your corner", copy: "Ask questions, share proof and get comments, cheers and challenges from Sikander." },
];
/** Chips around the hero: emoji, label, position, mouse depth, and which way they scatter when you scroll. */
const CHIPS = [["⚡", "+30 XP", "left-[4%] top-[10%]", 0.9, -1, -0.7], ["🔥", "7 day streak", "right-[6%] top-[22%]", -0.6, 1, -0.5], ["🏆", "Quiz Whiz", "left-[10%] bottom-[14%]", -0.8, -1, 0.6], ["🚀", "Level up!", "right-[10%] bottom-[10%]", 1.1, 1, 0.8]] as const;
/** Skills from the level map, sliding past in two rows as you scroll. */
const SKILLS = ["🐍 Python", "🌱 Git & GitHub", "🗄️ SQL", "🌐 HTML & CSS", "⚡ JavaScript", "🐧 Linux", "🔌 APIs", "🐳 Docker", "☁️ The cloud", "🛡️ Cybersecurity", "🤖 AI coding", "🚀 Vercel"];
const NOVA_LINES = ["Hi! I’m Nova 👋 Tap me!", "Boop! That tickles 😆", "Ready for a quest?", "You’ve got this, Hanifa! 💪", "Wheee! 🚀", "One more level? 🎮"];
const STARS = ["⭐", "✨", "💖", "🌟"];
/** How far each hero layer moves with the mouse and with scroll (see .depth in globals.css). */
const depth = (d: number) => ({ "--d": d }) as React.CSSProperties;
const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Little stars that fly out of `host` and fade. Plain DOM + Web Animations, so React never re-renders for them. */
function burst(host: HTMLElement, count: number) {
  for (let i = 0; i < count; i++) {
    const star = document.createElement("span");
    star.textContent = STARS[i % STARS.length];
    star.setAttribute("aria-hidden", "true");
    Object.assign(star.style, { position: "absolute", left: "50%", top: "45%", fontSize: "20px", pointerEvents: "none", zIndex: "3" });
    host.appendChild(star);
    const angle = (i / count) * Math.PI * 2, reach = 80 + Math.random() * 60;
    star.animate([
      { transform: "translate(-50%, -50%) scale(.3)", opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(angle) * reach}px), calc(-50% + ${Math.sin(angle) * reach}px)) scale(1.2) rotate(${Math.random() * 300 - 150}deg)`, opacity: 0 },
    ], { duration: 850, easing: "cubic-bezier(.2,.8,.2,1)" }).onfinish = () => star.remove();
  }
}

/** Nova in the hero: watches your cursor, says something new and does a flip each time you tap. */
function HeroNova() {
  const [line, setLine] = useState(0);
  const body = useRef<HTMLSpanElement>(null);
  const boop = (e: React.MouseEvent<HTMLButtonElement>) => {
    setLine(l => (l + 1) % NOVA_LINES.length);
    if (calm()) return;
    body.current?.animate([
      { transform: "translateY(0) rotate(0) scale(1)" },
      { transform: "translateY(-52px) rotate(190deg) scale(1.12)", offset: 0.45 },
      { transform: "translateY(0) rotate(360deg) scale(1)" },
    ], { duration: 800, easing: "cubic-bezier(.3,1.2,.5,1)" });
    burst(e.currentTarget, 12);
  };
  return <div className="hero-nova relative">
    <p aria-live="polite" className="absolute bottom-[88%] left-[62%] z-[2] whitespace-nowrap max-sm:bottom-full max-sm:left-1/2 max-sm:-translate-x-1/2"><span key={line} className="glass block animate-pop rounded-2xl rounded-bl-md px-3 py-2 text-sm font-extrabold text-ink shadow-pop max-sm:rounded-bl-2xl">{NOVA_LINES[line]}</span></p>
    <button type="button" onClick={boop} aria-label="Tap Nova to say hi" className="relative block rounded-full outline-none focus-visible:ring-4 focus-visible:ring-brand/40">
      <span ref={body} className="block"><span className="block animate-pop"><Nova size={150} mood="cheer" watch /></span></span>
    </button>
  </div>;
}

export default function LandingPage() {
  const [index, setIndex] = useState(0);
  useEffect(() => { const id = window.setInterval(() => setIndex(i => (i + 1) % WORDS.length), 2200); return () => window.clearInterval(id); }, []);

  // A short trail of stars follows the mouse (desktop only, never when motion is reduced).
  useEffect(() => {
    if (calm() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let lastX = 0, lastY = 0, lastAt = 0, n = 0;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastAt < 45 || Math.hypot(e.clientX - lastX, e.clientY - lastY) < 36) return;
      lastAt = now; lastX = e.clientX; lastY = e.clientY;
      const star = document.createElement("span");
      star.textContent = STARS[n++ % STARS.length];
      star.setAttribute("aria-hidden", "true");
      Object.assign(star.style, { position: "fixed", left: `${e.clientX}px`, top: `${e.clientY}px`, fontSize: `${10 + Math.random() * 8}px`, pointerEvents: "none", zIndex: "70" });
      document.body.appendChild(star);
      star.animate([
        { transform: "translate(-50%, -50%) scale(1)", opacity: 0.9 },
        { transform: `translate(calc(-50% + ${Math.random() * 30 - 15}px), calc(-50% + 34px)) scale(.2) rotate(120deg)`, opacity: 0 },
      ], { duration: 700, easing: "ease-out" }).onfinish = () => star.remove();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Hero layers follow the mouse a little (desktop); --mx/--my run from -0.5 to 0.5.
  const tilt = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    e.currentTarget.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const untilt = (e: React.PointerEvent<HTMLElement>) => { e.currentTarget.style.removeProperty("--mx"); e.currentTarget.style.removeProperty("--my"); };

  return <main className="overflow-hidden">
    <section onPointerMove={tilt} onPointerLeave={untilt} className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16 text-center">
      {/* far plane: soft colour blobs drifting against the scroll */}
      <div aria-hidden className="depth pointer-events-none absolute left-[8%] top-[18%] h-56 w-56 rounded-full bg-brand/20 blur-3xl" style={depth(-0.5)} />
      <div aria-hidden className="depth pointer-events-none absolute bottom-[12%] right-[8%] h-64 w-64 rounded-full bg-brand2/20 blur-3xl" style={depth(-0.35)} />
      {/* chips follow the mouse, then scatter outwards as you scroll away */}
      {CHIPS.map(([emoji, label, pos, d, cx, cy], i) => <span key={label} className={`chip-scatter hero-fade absolute hidden md:block ${pos}`} style={{ "--d": d, "--cx": cx, "--cy": cy } as React.CSSProperties}><span className="glass flex animate-float items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold shadow-pop" style={{ animationDelay: `${i * 0.9}s` }}><span className="text-lg">{emoji}</span>{label}</span></span>)}
      <HeroNova />
      <div className="depth hero-fade" style={depth(0.18)}>
      <p className="eyebrow mt-4 animate-fade-up">My Future World</p>
      <h1 className="mx-auto mt-3 max-w-3xl animate-fade-up font-display text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
        Learn <span key={index} className="inline-block whitespace-nowrap"><span className="sr-only">{WORDS[index]}</span>{[...WORDS[index]].map((ch, i, all) => <span key={i} aria-hidden className="inline-block animate-zoom-in whitespace-pre" style={{ animationDelay: `${i * 35}ms`, color: `color-mix(in srgb, rgb(var(--brand2)) ${Math.round(i / Math.max(1, all.length - 1) * 100)}%, rgb(var(--brand)))` }}>{ch}</span>)}</span>,<br />one small quest at a time.
      </h1>
      <p className="mx-auto mt-6 max-w-xl animate-fade-up text-lg text-ink/60" style={{ animationDelay: ".15s" }}>A space built for Hanifa’s learning: levels to unlock, streaks to keep, questions to ask and a mentor who’s cheering her on.</p>
      <div className="mt-9 flex animate-fade-up flex-wrap justify-center gap-3" style={{ animationDelay: ".25s" }}>
        <Link href="/home" className="btn-primary !px-8 !py-4 text-base">Open my world <ArrowRight size={18} /></Link>
        <Link href="/adventure" className="btn-soft !px-8 !py-4 text-base">Preview the map</Link>
      </div>
      <p className="mt-6 flex items-center justify-center gap-1.5 text-xs font-bold text-ink/40"><Sparkles size={13} />5 minutes a day is enough to start</p>
      </div>
    </section>

    {/* skills band: two tilted rows that slide in opposite directions as you scroll */}
    <section aria-label="Skills you will unlock" className="-rotate-2 py-8">
      {[-1, 1].map(dir => <div key={dir} className="skill-row mt-3 flex w-max gap-3" style={{ "--dir": dir } as React.CSSProperties}>
        {[...SKILLS, ...SKILLS, ...SKILLS].map((s, i) => <span key={i} aria-hidden={i >= SKILLS.length} className={`whitespace-nowrap rounded-full px-5 py-2.5 font-display text-base font-extrabold shadow-sticker ${dir < 0 ? "bg-white/85 text-ink" : "bg-brand-gradient text-white"}`}>{s}</span>)}
      </div>)}
    </section>

    <section className="mx-auto max-w-6xl px-6 pb-24 pt-10">
      <Reveal><h2 className="mx-auto max-w-3xl text-center font-display text-3xl font-extrabold sm:text-4xl">Learning that feels like levelling up</h2></Reveal>
      <div className="mx-auto mt-12 max-w-4xl"><QuestTrail stops={FEATURES} /></div>

      {/* the close: Nova peeks over the card once it is in view */}
      <Reveal from="zoom" className="relative mt-28">
        <div aria-hidden className="cta-peek absolute left-1/2 top-0 z-0"><Nova size={104} mood="cheer" float={false} watch /></div>
        <div className="bg-hero relative z-[1] overflow-hidden rounded-[2.2rem] p-8 text-center text-white shadow-glow sm:p-12">
          <Zap className="absolute right-6 top-6 h-24 w-24 text-white/10" />
          <h2 className="relative font-display text-3xl font-extrabold sm:text-4xl">Ready for level 1?</h2>
          <p className="relative mx-auto mt-2 max-w-md text-white/85">Your first 30 XP is one Daily 3 away.</p>
          <Link href="/home" className="btn relative mt-6 bg-white !px-8 !py-4 text-base text-brand shadow-pop hover:-translate-y-0.5 hover:animate-wiggle">Let’s go <ArrowRight size={18} /></Link>
        </div>
      </Reveal>
    </section>
  </main>;
}
