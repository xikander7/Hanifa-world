"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Copy, ExternalLink, ShieldAlert } from "lucide-react";
import roadmap from "@/data/roadmap.json";
import { EMPTY_ASKS, EMPTY_ROADMAP, KEYS, uid } from "@/lib/data";
import type { AskLog, RoadmapProgress } from "@/lib/data";
import { ASK_MODES, buildPrompt, chatGptLink, modeInfo, validateAsk } from "@/lib/askPrompt";
import type { AskMode } from "@/lib/askPrompt";
import { getStageState } from "@/lib/roadmap-progress";
import { useLocalStore } from "@/lib/store";
import { useCelebrate } from "@/components/Celebrate";
import { Nova } from "@/components/Nova";
import { SectionHeading } from "@/components/SectionHeading";

const stageIds = roadmap.map(m => `module-${m.number}`);
const RULES = [
  { emoji: "🧠", title: "Ask it to teach you", text: "Don't ask it to do your work. You learn by trying it yourself first." },
  { emoji: "🔍", title: "Check important things", text: "ChatGPT can make mistakes. Check with your lesson, or ask Sikander." },
  { emoji: "🔒", title: "Keep secrets secret", text: "Never type passwords, your address, your phone number or private things." },
];

export default function AskPage() { return <Suspense fallback={null}><Ask /></Suspense>; }

function Ask() {
  const params = useSearchParams();
  const { celebrate } = useCelebrate();
  const [roadmapProgress] = useLocalStore<RoadmapProgress>(KEYS.roadmap, EMPTY_ROADMAP);
  const [, setAsks] = useLocalStore<AskLog[]>(KEYS.asks, EMPTY_ASKS);
  const currentLevel = Math.max(1, stageIds.findIndex((_, i) => getStageState(i, stageIds, roadmapProgress.passed) === "ready") + 1 || roadmap.length);
  const [level, setLevel] = useState<number | null>(null);
  const [mode, setMode] = useState<AskMode>("explain");
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [asked, setAsked] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => { const m = Number(params.get("m")); if (m >= 1 && m <= roadmap.length) setLevel(m); }, [params]);
  const chosen = level ?? currentLevel;
  const topic = roadmap[chosen - 1].title;
  const info = modeInfo(mode);
  const prompt = useMemo(() => buildPrompt({ level: chosen, topic, mode, question }), [chosen, topic, mode, question]);

  const ask = async () => {
    const problem = validateAsk(mode, question);
    if (problem) { setError(problem); return; }
    setError("");
    try { await navigator.clipboard.writeText(prompt); } catch { /* the link still works */ }
    setAsks(list => [{ id: uid(), at: new Date().toISOString(), module: chosen, topic, mode, question: question.trim() }, ...list].slice(0, 100));
    window.open(chatGptLink(prompt), "_blank", "noopener,noreferrer");
    setAsked(true);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(prompt); celebrate({ emoji: "📋", title: "Question copied!", text: "Now paste it into ChatGPT.", confetti: false, sound: "pop" }); }
    catch { window.prompt("Copy this question:", prompt); }
  };

  return <div className="max-w-3xl">
    <SectionHeading eyebrow="Ask · get help when you're stuck" title="Ask a helper 💬" copy="ChatGPT is like a super patient teacher who is awake any time. Follow the 3 easy steps and we'll write the perfect question for you." />

    <section className="bg-hero relative mb-6 overflow-hidden rounded-[2.2rem] p-6 text-white shadow-glow sm:p-8">
      <div className="pointer-events-none absolute -right-10 -top-14 h-60 w-60 rounded-full bg-white/10" />
      <div className="relative flex flex-wrap items-center gap-5"><Nova mood="think" size={96} />
        <div className="min-w-0 flex-1"><h2 className="font-display text-2xl font-extrabold sm:text-3xl">Stuck? Don't stay stuck!</h2>
          <p className="mt-2 text-sm leading-6 text-white/90">Everybody gets stuck, even experts. The trick is to ask good questions. We will do the hard part: writing a clear question. You just choose and press a button.</p></div></div>
    </section>

    <div className="mb-8 grid gap-3 sm:grid-cols-3">{RULES.map(r => <div key={r.title} className="card p-4"><p className="text-2xl">{r.emoji}</p><p className="mt-1 font-display font-extrabold">{r.title}</p><p className="mt-1 text-xs leading-5 text-ink/60">{r.text}</p></div>)}</div>

    <section className="card p-5 sm:p-7">
      <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand font-display font-extrabold text-white">1</span><h2 className="font-display text-xl font-extrabold">What are you learning?</h2></div>
      <select value={chosen} onChange={e => { setLevel(Number(e.target.value)); setAsked(false); }} className="field mt-4" aria-label="Topic">
        {roadmap.map(m => <option key={m.number} value={m.number}>Level {m.number}: {m.title}{m.number === currentLevel ? " (you are here)" : ""}</option>)}
      </select>

      <div className="mt-8 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand font-display font-extrabold text-white">2</span><h2 className="font-display text-xl font-extrabold">What kind of help do you want?</h2></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{ASK_MODES.map(m => {
        const on = mode === m.id;
        return <button key={m.id} onClick={() => { setMode(m.id); setError(""); setAsked(false); }} aria-pressed={on} className={`relative flex items-center gap-3 rounded-2xl p-4 text-left ring-2 transition active:scale-[.98] ${on ? "bg-brand/10 ring-brand" : "bg-white/80 ring-ink/10 hover:-translate-y-0.5 hover:ring-brand/40"}`}>
          <span className="text-3xl">{m.emoji}</span><span><span className="block font-display font-extrabold leading-tight">{m.label}</span><span className="block text-xs text-ink/55">{m.hint}</span></span>
          {on && <span className="animate-check-pop absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-brand text-white"><Check size={14} /></span>}
        </button>;
      })}</div>

      <div className="mt-8 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-brand font-display font-extrabold text-white">3</span><h2 className="font-display text-xl font-extrabold">{info.needsText ? "Tell us more" : "Anything to add?"}</h2></div>
      <label className="mt-4 block text-sm font-bold">{info.textLabel}
        <textarea value={question} onChange={e => { setQuestion(e.target.value); setError(""); }} placeholder={info.placeholder} className="field mt-2 min-h-28 font-normal" />
      </label>
      {error && <p role="alert" className="animate-shake mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={ask} className="btn-primary !px-7 !py-4 text-base">Ask ChatGPT <ExternalLink size={17} /></button>
        <button onClick={copy} className="btn-soft !py-4"><Copy size={16} />Copy my question</button>
      </div>
      <p className="mt-3 text-xs leading-5 text-ink/50">ChatGPT opens in a new tab with your question already typed. We also copy it for you. If the box is empty, just paste it (Cmd + V on Mac, Ctrl + V on Windows). If it asks you to sign in, use your account.</p>

      <button onClick={() => setShowPreview(v => !v)} className="mt-4 text-sm font-bold text-brand">{showPreview ? "Hide" : "Show"} the exact question we'll send</button>
      {showPreview && <pre className="animate-fade-up mt-2 whitespace-pre-wrap rounded-2xl bg-ink/[.04] p-4 font-sans text-xs leading-6 text-ink/70">{prompt}</pre>}
    </section>

    {asked && <section className="card animate-fade-up mt-6 p-5 sm:p-7">
      <div className="flex items-center gap-3"><Nova mood="cheer" size={56} /><h2 className="font-display text-xl font-extrabold">Great question! What now?</h2></div>
      <ol className="mt-4 space-y-3 text-[15px] leading-7">
        <li><b>1. Read the answer slowly.</b> Take your time.</li>
        <li><b>2. Didn't understand?</b> Tell ChatGPT: “Please explain that again in an easier way.” You can do this as many times as you like.</li>
        <li><b>3. Try it yourself.</b> Do the small thing it suggests on your own computer.</li>
        <li><b>4. Write what you learned.</b> One sentence in your Journal earns XP, and helps you remember it.</li>
      </ol>
      <div className="mt-5 flex flex-wrap gap-3"><Link href="/time?new=1" className="btn-primary !py-2.5 text-sm">Write it in my Journal <ArrowRight size={15} /></Link><Link href="/home" className="btn-soft !py-2.5 text-sm">Back to Home</Link></div>
    </section>}

    <p className="mt-6 flex items-start gap-2 rounded-2xl bg-white/60 px-4 py-3 text-xs leading-5 text-ink/55"><ShieldAlert size={14} className="mt-0.5 shrink-0 text-brand" />Sikander can see which questions you asked here. That way he can help you with the things you find tricky. You won't get in trouble for asking.</p>
  </div>;
}
