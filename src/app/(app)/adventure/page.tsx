"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Brain, Check, CheckCircle2, Clock3, Crown, Lock, RotateCcw, Send, ShieldCheck } from "lucide-react";
import roadmap from "@/data/roadmap.json";
import { lessons } from "@/data/lessons";
import { blankSkillProof, EMPTY_ROADMAP, EMPTY_SKILL_PROOF, KEYS, SKILLS, fmtDay } from "@/lib/data";
import type { RoadmapProgress, SkillProofMap } from "@/lib/data";
import { XP } from "@/lib/game";
import { canPassStage, getStageState } from "@/lib/roadmap-progress";
import { useGame } from "@/lib/useGame";
import { useHydrated, useLocalStore } from "@/lib/store";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useCelebrate } from "@/components/Celebrate";
import { Nova } from "@/components/Nova";
import { ProgressBar } from "@/components/ProgressBar";
import { SectionHeading } from "@/components/SectionHeading";

type RoadmapModule = (typeof roadmap)[number];
const stageIds = roadmap.map(m => `module-${m.number}`);
const WORLD_BLURB: Record<string, string> = {
  "Foundation World": "Understand how computers and the internet actually work.",
  "Tech World": "Cloud, Linux and your first taste of programming logic.",
  "Coding World": "Write real code: Python, databases, Git and the web.",
  "Builder World": "Connect everything, build apps and put them online.",
};
const WORLD_EMOJI: Record<string, string> = { "Foundation World": "🌱", "Tech World": "⚙️", "Coding World": "💻", "Builder World": "🏗️" };

const stepCount = (m: RoadmapModule, p: RoadmapProgress) => {
  const id = `module-${m.number}`;
  return (p.resources[id] || []).filter(r => m.resources.some(x => x.id === r && !x.optional)).length + (p.practice[id] || []).filter(t => m.practice.some(x => x.id === t)).length;
};
const stepTotal = (m: RoadmapModule) => m.resources.filter(r => !r.optional).length + m.practice.length;

export default function AdventurePage() {
  const hydrated = useHydrated();
  const { celebrate, burst } = useCelebrate();
  const game = useGame();
  const [progress, setProgress] = useLocalStore<RoadmapProgress>(KEYS.roadmap, EMPTY_ROADMAP);
  const [proofs, setProofs] = useLocalStore<SkillProofMap>(KEYS.skillProof, EMPTY_SKILL_PROOF);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

  const stateFor = (index: number) => getStageState(index, stageIds, progress.passed);
  const activeIndex = useMemo(() => stageIds.findIndex((_, i) => getStageState(i, stageIds, progress.passed) === "ready"), [progress.passed]);
  const selectedIndex = selectedNumber === null ? (activeIndex >= 0 ? activeIndex : roadmap.length - 1) : Math.max(0, Math.min(roadmap.length - 1, selectedNumber - 1));
  const selected = roadmap[selectedIndex];
  const selectedId = `module-${selected.number}`;
  const selectedState = stateFor(selectedIndex);
  const skill = SKILLS[selectedIndex];
  const proof = proofs[skill.id] ?? blankSkillProof();
  const resourcesDone = progress.resources[selectedId] || [];
  const practiceDone = progress.practice[selectedId] || [];
  const requiredResources = selected.resources.filter(r => !r.optional);
  const total = stepTotal(selected), done = stepCount(selected, progress);
  const readyToPass = canPassStage(requiredResources.map(r => r.id), selected.practice.map(t => t.id), resourcesDone, practiceDone);
  const passedCount = progress.passed.length;
  const overall = Math.round(roadmap.reduce((s, m) => s + stepCount(m, progress), 0) / roadmap.reduce((s, m) => s + stepTotal(m), 0) * 100);
  const worlds = useMemo(() => [...new Set(SKILLS.map(s => s.world))].map(name => ({ name, levels: SKILLS.map((s, i) => ({ s, i })).filter(x => x.s.world === name).map(x => x.i) })), []);
  const lesson = lessons[selectedIndex];

  const toggle = (kind: "resources" | "practice", id: string, e: React.MouseEvent) => {
    if (selectedState !== "ready") return;
    const list = progress[kind][selectedId] || [];
    const checking = !list.includes(id);
    setProgress({ ...progress, [kind]: { ...progress[kind], [selectedId]: checking ? [...list, id] : list.filter(x => x !== id) } });
    if (checking) burst({ x: e.clientX, y: e.clientY, count: 12 });
  };
  const passLevel = () => {
    if (selectedState !== "ready" || !readyToPass) return;
    setProgress({ ...progress, passed: [...progress.passed, selectedId] });
    const nextTitle = roadmap[selectedIndex + 1]?.title;
    celebrate({ emoji: "🚀", title: `Level ${selected.number} cleared!`, text: nextTitle ? `${nextTitle} is now unlocked` : "You finished the whole adventure!", xp: XP.levelCleared, sound: "win" });
    burst({ big: true, count: 60 });
    if (nextTitle) setSelectedNumber(selected.number + 1);
  };
  const reset = () => { if (window.confirm("Reset all adventure progress on this device? This cannot be undone.")) { setProgress(EMPTY_ROADMAP); setSelectedNumber(1); } };
  const editProof = (changes: Partial<typeof proof>) => setProofs({ ...proofs, [skill.id]: { ...proof, ...changes } });
  const sendToXander = () => { editProof({ sent: true, sentAt: new Date().toISOString(), verified: false, mentorFeedback: proof.mentorFeedback }); celebrate({ emoji: "📨", title: "Sent to Xander!", text: "He'll review it and leave you a comment.", confetti: false, sound: "pop" }); };

  return <div className="space-y-6 pb-6">
    <SectionHeading eyebrow="Adventure map · 20 levels to your tech future" title="Your Tech Adventure 🗺️" copy="Each level is a world of videos and real missions. Clear them in order to unlock the next. Every resource is free." />

    {/* hero */}
    <section className="bg-hero relative overflow-hidden rounded-[2.2rem] p-6 text-white shadow-glow sm:p-8">
      <div className="pointer-events-none absolute -right-8 -top-12 h-64 w-64 rounded-full bg-white/10" />
      <div className="relative grid items-center gap-5 md:grid-cols-[1fr_auto]">
        <div>
          <span className="chip bg-white/20 text-white">{passedCount === roadmap.length ? "Adventure complete" : `Level ${Math.max(1, activeIndex + 1)} of ${roadmap.length}`}</span>
          <h2 className="mt-3 font-display text-3xl font-extrabold">{passedCount === roadmap.length ? "Tech-world legend! 🏆" : "One level at a time. You’ve got this."}</h2>
          <p className="mt-1 text-sm text-white/80">About 9–11 months at a steady part-time pace, but small steps count every day.</p>
          <ProgressBar value={overall} height="h-3.5" className="mt-4 max-w-xl !bg-white/25" />
          <p className="mt-2 text-xs font-semibold text-white/80">{overall}% of all learning steps explored</p>
        </div>
        <div className="flex items-center gap-4 rounded-3xl bg-white/15 p-4 backdrop-blur">
          <Nova mood={readyToPass ? "cheer" : "happy"} size={72} />
          <div><p className="font-display text-3xl font-extrabold"><AnimatedNumber value={hydrated ? passedCount : 0} /><span className="text-lg text-white/60">/{roadmap.length}</span></p><p className="text-[11px] font-bold uppercase tracking-wider text-white/75">levels cleared</p><p className="mt-1 text-xs text-white/80">{game.xp} XP earned</p></div>
        </div>
      </div>
    </section>

    {/* the map */}
    <div className="space-y-4">
      {worlds.map((world, wi) => {
        const cleared = world.levels.filter(i => stateFor(i) === "passed").length;
        return <section key={world.name} className="card p-5 sm:p-6" style={{ animationDelay: `${wi * 70}ms` }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-2xl">{WORLD_EMOJI[world.name]}</span><div><h2 className="font-display text-lg font-extrabold leading-tight">{world.name}</h2><p className="text-xs text-ink/55">{WORLD_BLURB[world.name]}</p></div></div>
            <span className="chip bg-ink/5 text-ink/60">{cleared}/{world.levels.length} cleared</span>
          </div>
          <div className="no-scrollbar -mx-2 mt-5 flex items-start overflow-x-auto px-2 pb-2">
            {world.levels.map((index, n) => {
              const state = stateFor(index), isSelected = index === selectedIndex, module = roadmap[index];
              const passed = state === "passed", locked = state === "locked", ready = state === "ready";
              return <div key={module.number} className="flex items-start">
                <button disabled={locked} onClick={() => setSelectedNumber(module.number)} aria-current={isSelected ? "step" : undefined} aria-label={`Level ${module.number}: ${module.title} (${state})`} className="group flex w-[5.4rem] shrink-0 flex-col items-center text-center sm:w-28">
                  <span className="relative">
                    {ready && <span className="absolute inset-0 rounded-full bg-brand/40 animate-pulse-ring" />}
                    <span className={`relative grid h-16 w-16 place-items-center rounded-full text-3xl transition duration-300 sm:h-[4.5rem] sm:w-[4.5rem] ${locked ? "bg-ink/5 text-ink/30 grayscale" : passed ? "bg-emerald-500 text-white shadow-sticker" : "bg-hero text-white shadow-glow animate-bounce-soft"} ${isSelected ? "scale-110 ring-4 ring-brand/30 ring-offset-2" : "group-hover:scale-110"} ${!locked ? "group-hover:-rotate-6" : ""}`}>
                      {locked ? <Lock size={22} /> : passed ? <Check size={30} strokeWidth={3} /> : lessons[index].emoji}
                    </span>
                    {passed && <span className="absolute -right-1 -top-1 text-lg animate-check-pop">⭐</span>}
                  </span>
                  <span className={`mt-2 line-clamp-2 text-[11px] font-extrabold leading-tight ${locked ? "text-ink/35" : ""}`}>{module.title}</span>
                  <span className="text-[10px] font-bold text-ink/35">{ready ? "START HERE" : `Lv ${module.number}`}</span>
                </button>
                {n < world.levels.length - 1 && <svg className="mt-8 h-2 w-6 shrink-0 sm:w-10" viewBox="0 0 40 4" preserveAspectRatio="none" aria-hidden><line x1="0" y1="2" x2="40" y2="2" strokeWidth="3" strokeLinecap="round" className={passed ? "path-dash stroke-brand" : "stroke-ink/15"} strokeDasharray={passed ? undefined : "4 8"} /></svg>}
              </div>;
            })}
          </div>
        </section>;
      })}
    </div>

    {/* selected level */}
    <section id="level" key={selected.number} className="card animate-fade-up overflow-hidden">
      <div className="bg-hero p-5 text-white sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><span className="chip bg-white/20 text-white">Level {String(selected.number).padStart(2, "0")}</span><span className="chip bg-black/10 text-white"><Clock3 size={12} />{selected.duration}</span>{selectedState === "passed" && <span className="chip bg-emerald-300 text-emerald-950">CLEARED ✓</span>}{proof.verified && <span className="chip bg-white text-brand"><ShieldCheck size={12} />Verified by Xander</span>}</div>
            <h2 className="mt-3 font-display text-3xl font-extrabold">{lesson.emoji} {selected.title}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/90">{selected.summary}</p>
          </div>
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white/15 font-display text-3xl font-extrabold">{selected.number}</span>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-bold">{done} / {total} steps complete</span><div className="w-full max-w-56"><ProgressBar value={(done / total) * 100} className="!bg-white/25" /></div></div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-ink/5 bg-brand/5 px-5 py-3.5 sm:px-7">
        <span className="text-xl">🧠</span><p className="min-w-0 flex-1 text-sm font-semibold">Learn faster: flip the {lesson.cards.length} key-idea flashcards, then test yourself.</p>
        <Link href={`/ask?m=${selected.number}`} className="btn-soft !px-4 !py-2 text-xs">💬 Stuck? Ask a helper</Link>
        <Link href={`/learn?m=${selected.number}`} className="btn-primary !px-4 !py-2 text-xs"><Brain size={14} />Open Brain Gym</Link>
      </div>
      {selected.notes.length > 0 && <div className="space-y-2 border-b border-amber-200/60 bg-amber-50 px-5 py-4 sm:px-7">{selected.notes.map((n, i) => <p key={i} className="text-xs leading-5 text-amber-950">💡 {n}</p>)}</div>}

      <div className="grid xl:grid-cols-[1.1fr_.9fr]">
        <div className="p-5 sm:p-7">
          <p className="eyebrow">Watch &amp; explore</p><h3 className="mt-1 font-display text-xl font-extrabold">Your learning playlist 🎧</h3><p className="mt-1 text-xs text-ink/50">Go in order. Tick each one when you’ve finished.</p>
          <div className="stagger mt-5 space-y-3">{selected.resources.map((r, i) => {
            const checked = resourcesDone.includes(r.id);
            return <article key={r.id} className={`rounded-2xl p-4 ring-1 transition ${checked ? "bg-emerald-50 ring-emerald-200" : "bg-white/80 ring-ink/5 hover:ring-brand/40"}`}>
              <div className="flex gap-3">
                <button disabled={selectedState !== "ready"} aria-label={`${checked ? "Mark unfinished" : "Mark finished"}: ${r.title}`} onClick={e => toggle("resources", r.id, e)} className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full transition active:scale-90 ${checked ? "animate-check-pop bg-emerald-500 text-white" : "border-2 border-ink/20 text-transparent hover:border-brand"}`}><Check size={15} /></button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-extrabold text-ink/30">{String(i + 1).padStart(2, "0")}</span><h4 className="text-sm font-extrabold">{r.title}</h4>{r.optional && <span className="chip bg-amber-100 !py-0.5 text-[9px] uppercase text-amber-900">Optional · later</span>}</div>
                  <p className="mt-1.5 text-xs leading-5 text-ink/60">{r.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">{r.links.map((l, li) => <a key={`${l.url}-${li}`} href={l.url} target="_blank" rel="noopener noreferrer" className="chip bg-brand/10 text-brand transition hover:bg-brand hover:text-white">{l.label}<ArrowUpRight size={12} /></a>)}</div>
                </div>
              </div>
            </article>;
          })}</div>
        </div>

        <div className="border-t border-ink/5 bg-white/40 p-5 sm:p-7 xl:border-l xl:border-t-0">
          <p className="eyebrow">Real-world missions</p><h3 className="mt-1 font-display text-xl font-extrabold">Show what you can do 🧩</h3><p className="mt-1 text-xs text-ink/50">Finish each one before the next world opens.</p>
          <div className="stagger mt-5 space-y-3">{selected.practice.map((task, i) => {
            const checked = practiceDone.includes(task.id);
            return <button key={task.id} disabled={selectedState !== "ready"} onClick={e => toggle("practice", task.id, e)} className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left ring-1 transition active:scale-[.99] ${checked ? "bg-emerald-50 ring-emerald-200" : "bg-white/80 ring-ink/5 hover:ring-brand/40"}`}>
              <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${checked ? "animate-check-pop bg-emerald-500 text-white" : "bg-brand/10 text-brand"}`}>{checked ? <Check size={15} /> : i + 1}</span>
              <span className={`text-sm leading-6 ${checked ? "font-semibold text-emerald-900 line-through decoration-emerald-400" : ""}`}>{task.text}</span>
            </button>;
          })}</div>
          <label className="mt-5 block text-xs font-extrabold">My notes from this level <span className="font-medium text-ink/40">(optional)</span>
            <textarea value={progress.notes[selectedId] || ""} onChange={e => setProgress({ ...progress, notes: { ...progress.notes, [selectedId]: e.target.value } })} disabled={selectedState === "locked"} placeholder="What surprised you? What do you want to remember?" className="field mt-2 min-h-24 resize-y font-normal" />
          </label>
        </div>
      </div>

      {/* show Xander */}
      {selectedState !== "locked" && <div className="border-t border-ink/5 bg-brand/5 p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2"><ShieldCheck className="text-brand" size={20} /><h3 className="font-display text-lg font-extrabold">Show Xander what you made</h3>{proof.sent && !proof.verified && <span className="chip bg-amber-100 text-amber-900">Waiting for review</span>}{proof.verified && <span className="chip bg-emerald-100 text-emerald-800">Verified ✓</span>}</div>
        <p className="mt-1 text-xs text-ink/55">Activity is yours. <b>Verified</b> is Xander’s stamp: only he can give it. Share a link or a few words about what you built.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="field" placeholder="Proof link (GitHub, Google Doc, screenshot…)" value={proof.proof} onChange={e => editProof({ proof: e.target.value, sent: false })} />
          <input className="field" placeholder="One sentence: what did you make or learn?" value={proof.note} onChange={e => editProof({ note: e.target.value, sent: false })} />
        </div>
        {proof.mentorFeedback && <p className="animate-pop mt-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white"><b>Xander:</b> {proof.mentorFeedback}</p>}
        <button onClick={sendToXander} disabled={proof.sent || (!proof.proof.trim() && !proof.note.trim())} className="btn-primary mt-4"><Send size={15} />{proof.sent ? (proof.verified ? "Verified by Xander" : "Sent, waiting for Xander") : "Send to Xander"}</button>
        {proof.sentAt && <span className="ml-3 text-xs text-ink/45">sent {fmtDay(proof.sentAt.slice(0, 10))}</span>}
      </div>}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/5 bg-white/60 px-5 py-5 sm:px-7">
        <div className="flex items-start gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${readyToPass ? "animate-bounce-soft bg-emerald-100 text-emerald-700" : "bg-brand/10 text-brand"}`}>{readyToPass ? <CheckCircle2 size={22} /> : <Lock size={20} />}</span>
          <div><p className="text-sm font-extrabold">{selectedState === "passed" ? "Level cleared. Revisit anytime." : selectedState === "locked" ? "Clear the level before this one to unlock it." : readyToPass ? "Everything’s ticked. Ready to level up?" : "The next world opens once every step is done."}</p>
            {selectedState === "ready" && !readyToPass && <p className="mt-0.5 text-xs text-ink/50">{requiredResources.length - requiredResources.filter(r => resourcesDone.includes(r.id)).length} resources and {selected.practice.length - practiceDone.length} missions left</p>}</div></div>
        {selectedState === "ready" ? <button onClick={passLevel} disabled={!readyToPass} className={`btn-primary ${readyToPass ? "animate-bounce-soft" : ""}`}><Crown size={17} />I cleared this level! +{XP.levelCleared} XP</button>
          : selectedState === "passed" ? <span className="chip bg-emerald-100 !px-5 !py-3 text-sm text-emerald-800"><CheckCircle2 size={16} />Cleared</span> : <span className="chip bg-ink/5 !px-5 !py-3 text-sm text-ink/50"><Lock size={14} />Locked</span>}
      </div>
    </section>

    <footer className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/50 px-4 py-3"><p className="text-xs text-ink/50">Your progress is saved in this browser. Resources open in a new tab.</p><button onClick={reset} className="chip text-ink/50 transition hover:bg-rose-50 hover:text-rose-700"><RotateCcw size={12} />Reset my map</button></footer>
  </div>;
}
