"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Layers, RotateCcw, Sparkles, X, Zap } from "lucide-react";
import roadmap from "@/data/roadmap.json";
import { allCards, cardId, lessonFor, lessons, TOTAL_CARDS } from "@/data/lessons";
import type { QuizQuestion } from "@/data/lessons";
import { quizFor, TOTAL_QUIZ_QUESTIONS } from "@/data/quizTiers";
import { addDays, EMPTY_BRAIN, EMPTY_ROADMAP, KEYS, localDate } from "@/lib/data";
import type { Brain, RoadmapProgress } from "@/lib/data";
import { MASTERED_BOX, XP } from "@/lib/game";
import { shuffleQuiz } from "@/lib/quiz";
import { quizKey, tierMeta, TIERS } from "@/lib/quizTier";
import type { Tier } from "@/lib/quizTier";
import { useGame } from "@/lib/useGame";
import { play } from "@/lib/sfx";
import { useHydrated, useLocalStore } from "@/lib/store";
import { getStageState } from "@/lib/roadmap-progress";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { useCelebrate } from "@/components/Celebrate";
import { Nova } from "@/components/Nova";
import { ProgressBar } from "@/components/ProgressBar";
import { Ring } from "@/components/Ring";
import { SectionHeading } from "@/components/SectionHeading";

type Session =
  | { kind: "cards"; module: number }
  | { kind: "review" }
  | { kind: "quizmenu"; module: number }
  | { kind: "quiz"; module: number; tier: Tier }
  | { kind: "daily" }
  | null;

const INTERVALS = [0, 1, 3, 7, 14]; // days until a card returns, by Leitner box
const hash = (text: string) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const pickDaily = (date: string, modules: number[]) => {
  const pool = lessons.filter(l => modules.includes(l.module)).flatMap(l => TIERS.flatMap(t => quizFor(l.module, t.id).map((q, i) => ({ ...q, id: `m${l.module}-${t.id}${i + 1}`, module: l.module }))));
  return pool.map(q => ({ q, k: hash(`${date}:${q.id}`) })).sort((a, b) => a.k - b.k).slice(0, 3).map(x => x.q);
};

export default function LearnPage() { return <Suspense fallback={null}><Learn /></Suspense>; }

function Learn() {
  const params = useSearchParams();
  const hydrated = useHydrated();
  const game = useGame();
  const [brain, setBrain] = useLocalStore<Brain>(KEYS.brain, EMPTY_BRAIN);
  const [roadmapProgress] = useLocalStore<RoadmapProgress>(KEYS.roadmap, EMPTY_ROADMAP);
  const [session, setSession] = useState<Session>(null);
  const today = localDate();
  const stageIds = roadmap.map(m => `module-${m.number}`);
  const currentModule = Math.max(1, stageIds.findIndex((_, i) => getStageState(i, stageIds, roadmapProgress.passed) === "ready") + 1 || roadmap.length);
  const unlocked = stageIds.map((_, i) => getStageState(i, stageIds, roadmapProgress.passed) !== "locked");

  useEffect(() => { const m = Number(params.get("m")); if (m >= 1 && m <= lessons.length) setSession({ kind: "cards", module: m }); }, [params]);

  const dueCards = useMemo(() => allCards().filter(c => brain.cards[c.id] && brain.cards[c.id].due <= today), [brain.cards, today]);
  const dailyModules = useMemo(() => { const open = lessons.map(l => l.module).filter(m => unlocked[m - 1]); return open.length ? open : [1]; }, [unlocked]);
  const dailyDone = Boolean(brain.daily[today]);

  const markDay = (next: Brain): Brain => next.days.includes(today) ? next : { ...next, days: [...next.days, today] };
  const rate = (id: string, knew: boolean) => setBrain(prev => {
    const box = Math.min(INTERVALS.length - 1, knew ? (prev.cards[id]?.box ?? 0) + 1 : 1);
    return markDay({ ...prev, cards: { ...prev.cards, [id]: { box, due: addDays(today, INTERVALS[box]) } } });
  });
  const saveQuiz = (module: number, tier: Tier, correct: number, total: number) => setBrain(prev => {
    const key = quizKey(module, tier), old = prev.quiz[key];
    return markDay({ ...prev, quiz: { ...prev.quiz, [key]: { best: Math.max(old?.best ?? 0, correct), total, attempts: (old?.attempts ?? 0) + 1, last: today } } });
  });
  // "Play again for fun" never lowers today's score.
  const saveDaily = (score: number, total: number) => setBrain(prev => markDay({ ...prev, daily: { ...prev.daily, [today]: { score: Math.max(score, prev.daily[today]?.score ?? 0), total } } }));

  const masteredIn = (module: number) => lessonFor(module)!.cards.filter((_, i) => (brain.cards[cardId(module, i)]?.box ?? 0) >= MASTERED_BOX).length;

  if (session) return <div className="mx-auto max-w-2xl">
    <button onClick={() => setSession(null)} className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-ink/60 transition hover:text-ink"><ArrowLeft size={16} />Back to Brain Gym</button>
    {session.kind === "quizmenu" && <QuizMenu module={session.module} results={brain.quiz} onPick={tier => setSession({ kind: "quiz", module: session.module, tier })} onCards={() => setSession({ kind: "cards", module: session.module })} />}
    {session.kind === "quiz" && <QuizRunner key={`quiz-${session.module}-${session.tier}`} title={`${roadmap[session.module - 1].title} · ${tierMeta(session.tier).label}`} questions={quizFor(session.module, session.tier)} onFinish={(c, t) => saveQuiz(session.module, session.tier, c, t)} onExit={() => setSession(null)}
      next={session.tier === "hard" ? { label: "Pick another quiz", run: () => setSession({ kind: "quizmenu", module: session.module }) } : { label: `Try ${tierMeta(session.tier === "easy" ? "medium" : "hard").label} ${tierMeta(session.tier === "easy" ? "medium" : "hard").emoji}`, run: () => setSession({ kind: "quiz", module: session.module, tier: session.tier === "easy" ? "medium" : "hard" }) }} />}
    {session.kind === "daily" && <QuizRunner key="daily" title="Daily 3" questions={pickDaily(today, dailyModules)} bonus={XP.dailyThree} onFinish={saveDaily} onExit={() => setSession(null)} />}
    {session.kind === "cards" && <CardRunner key={`c${session.module}`} title={roadmap[session.module - 1].title} cards={lessonFor(session.module)!.cards.map(([front, back], i) => ({ id: cardId(session.module, i), front, back }))} hook={lessonFor(session.module)!.hook} onRate={rate} onExit={() => setSession(null)} onQuiz={() => setSession({ kind: "quizmenu", module: session.module })} />}
    {session.kind === "review" && <CardRunner key="review" title="Cards due today" cards={dueCards} onRate={rate} onExit={() => setSession(null)} />}
  </div>;

  return <div>
    <SectionHeading eyebrow="Quiz & Cards · 5 minutes a day beats 5 hours once a week" title="Train your brain 🧠" copy={`Flip flashcards, then take on ${TOTAL_QUIZ_QUESTIONS} quiz questions on three difficulty levels. Harder quizzes earn more XP.`} />

    <div className="stagger grid gap-4 lg:grid-cols-3">
      <section className="card relative overflow-hidden p-6 lg:col-span-2">
        <div className="bg-hero absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-15" />
        <div className="relative flex flex-wrap items-center gap-5">
          <Nova mood={dailyDone ? "cheer" : "happy"} size={104} />
          <div className="min-w-0 flex-1">
            <span className="chip bg-brand/10 text-brand"><Zap size={13} />Daily 3 · +{XP.dailyThree} XP</span>
            <h2 className="mt-2 font-display text-2xl font-extrabold">{dailyDone ? "Daily 3 complete! 🎉" : "Three quick questions, every day"}</h2>
            <p className="mt-1 text-sm text-ink/60">{dailyDone ? `You scored ${brain.daily[today].score}/${brain.daily[today].total} today. Come back tomorrow for a fresh set.` : "Mixed questions from the levels you've unlocked. It takes about two minutes and keeps your streak alive."}</p>
            <button onClick={() => setSession({ kind: "daily" })} className="btn-primary mt-4">{dailyDone ? "Play again for fun" : "Start Daily 3"} <Sparkles size={16} /></button>
          </div>
        </div>
      </section>
      <section className="card flex flex-col justify-between p-6">
        <div>
          <p className="eyebrow">Review</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">{dueCards.length ? `${dueCards.length} card${dueCards.length > 1 ? "s" : ""} due` : "All caught up ✨"}</h2>
          <p className="mt-1 text-sm text-ink/60">{dueCards.length ? "Cards you've seen come back right when you're about to forget them." : "Study a deck below and cards will return here at the perfect time."}</p>
        </div>
        <button disabled={!dueCards.length} onClick={() => setSession({ kind: "review" })} className="btn-soft mt-4"><RotateCcw size={16} />Review now</button>
      </section>
    </div>

    <div className="mt-4 grid grid-cols-3 gap-3">
      {[["Cards mastered", game.masteredCards, `of ${TOTAL_CARDS}`, "🃏"], ["Quizzes aced", Object.values(brain.quiz).filter(q => q.total && q.best === q.total).length, `of ${lessons.length * TIERS.length}`, "🏆"], ["Brain XP", game.breakdown.filter(b => ["Flashcards", "Quizzes", "Daily 3"].includes(b.label)).reduce((s, b) => s + b.xp, 0), "from learning", "⚡"]].map(([label, value, note, emoji]) =>
        <div key={String(label)} className="card p-4 text-center"><p className="text-2xl">{emoji}</p><p className="mt-1 font-display text-2xl font-extrabold"><AnimatedNumber value={hydrated ? Number(value) : 0} /></p><p className="text-[11px] font-bold text-ink/50">{label}</p><p className="text-[10px] text-ink/35">{note}</p></div>)}
    </div>

    <h2 className="mb-4 mt-9 font-display text-2xl font-extrabold">Pick a deck</h2>
    <div className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {lessons.map(lesson => {
        const mastered = hydrated ? masteredIn(lesson.module) : 0;
        const results = TIERS.map(t => ({ tier: t, result: brain.quiz[quizKey(lesson.module, t.id)] }));
        const current = lesson.module === currentModule;
        const pct = Math.round((mastered / lesson.cards.length) * 100);
        return <article key={lesson.module} className={`card card-hover flex flex-col p-5 ${current ? "ring-2 ring-brand/60" : ""}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-3xl transition group-hover:scale-110">{lesson.emoji}</div>
            <Ring value={pct} size={52} stroke={6}><span className="text-[11px] font-extrabold">{pct}%</span></Ring>
          </div>
          <p className="mt-3 text-[11px] font-extrabold uppercase tracking-wider text-ink/40">Level {lesson.module} {current && <span className="ml-1 text-brand">· You are here</span>}</p>
          <h3 className="font-display text-lg font-extrabold leading-tight">{roadmap[lesson.module - 1].title}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink/55">{lesson.hook}</p>
          <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-bold">
            <span className="chip bg-ink/5 text-ink/60"><Layers size={11} />{mastered}/{lesson.cards.length} mastered</span>
            {results.filter(r => r.result).map(({ tier, result }) => <span key={tier.id} title={`${tier.label} quiz best score`} className={`chip ${result!.best === result!.total ? "bg-emerald-100 text-emerald-700" : "bg-brand/10 text-brand"}`}>{tier.emoji} {result!.best}/{result!.total}</span>)}
          </div>
          <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
            <button onClick={() => setSession({ kind: "cards", module: lesson.module })} className="btn-primary !px-3 !py-2.5 text-xs">Flashcards</button>
            <button onClick={() => setSession({ kind: "quizmenu", module: lesson.module })} className="btn-soft !px-3 !py-2.5 text-xs">Quiz me</button>
          </div>
        </article>;
      })}
    </div>
  </div>;
}

// ---------------------------------------------------------------- flashcards
type CardItem = { id: string; front: string; back: string };

function CardRunner({ title, cards, hook, onRate, onExit, onQuiz }: { title: string; cards: CardItem[]; hook?: string; onRate: (id: string, knew: boolean) => void; onExit: () => void; onQuiz?: () => void }) {
  const { burst } = useCelebrate();
  const [queue, setQueue] = useState(cards);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [again, setAgain] = useState(0);
  const [intro, setIntro] = useState(Boolean(hook));
  const total = cards.length;
  const card = queue[0];

  if (intro) return <div className="card animate-zoom-in p-7 text-center">
    <Nova mood="think" size={96} className="mx-auto" />
    <p className="eyebrow mt-3">{title}</p>
    <h2 className="mt-2 font-display text-2xl font-extrabold">Before you flip…</h2>
    <p className="mx-auto mt-3 max-w-md text-base leading-7 text-ink/70">{hook}</p>
    <button onClick={() => setIntro(false)} className="btn-primary mt-6">Show me the cards 🃏</button>
  </div>;

  if (!card) return <div className="card animate-zoom-in p-8 text-center">
    <Nova mood="cheer" size={110} className="mx-auto" />
    <h2 className="mt-3 font-display text-3xl font-extrabold">{total ? "Deck done! 🎉" : "Nothing due right now"}</h2>
    {total > 0 && <p className="mt-2 text-ink/60">You knew <b>{known}</b> and will see <b>{again}</b> again soon. The cards you missed come back sooner.</p>}
    <div className="mt-6 flex flex-wrap justify-center gap-3">{onQuiz && <button onClick={onQuiz} className="btn-primary">Test yourself with the quiz</button>}<button onClick={onExit} className="btn-soft">Back to Brain Gym</button></div>
  </div>;

  const answer = (knew: boolean, e: React.MouseEvent) => {
    onRate(card.id, knew);
    if (knew) { setKnown(n => n + 1); play("correct"); burst({ x: e.clientX, y: e.clientY, count: 14 }); } else { setAgain(n => n + 1); play("pop"); }
    setFlipped(false);
    window.setTimeout(() => setQueue(q => q.slice(1)), 180);
  };

  return <div>
    <div className="mb-4 flex items-center gap-3"><ProgressBar value={((total - queue.length) / total) * 100} className="flex-1" /><span className="text-xs font-extrabold text-ink/50">{total - queue.length + 1}/{total}</span></div>
    <div className="flip" onClick={() => { setFlipped(f => !f); play("pop"); }} role="button" tabIndex={0} aria-label="Flip card" onKeyDown={e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped(f => !f); } }}>
      <div className={`flip-inner h-80 cursor-pointer sm:h-96 ${flipped ? "is-flipped" : ""}`}>
        <div className="flip-face card grid place-items-center p-8 text-center">
          <div><p className="eyebrow">{title}</p><h2 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">{card.front}</h2><p className="mt-6 text-xs font-bold text-ink/40">Tap to reveal 👆</p></div>
        </div>
        <div className="flip-face flip-back grid place-items-center rounded-[1.7rem] bg-hero p-8 text-center text-white shadow-glow">
          <div><p className="text-xs font-extrabold uppercase tracking-widest text-white/70">{card.front}</p><p className="mt-4 text-lg font-semibold leading-8 sm:text-xl">{card.back}</p></div>
        </div>
      </div>
    </div>
    <div className={`mt-5 grid grid-cols-2 gap-3 transition duration-300 ${flipped ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-30"}`}>
      <button onClick={e => answer(false, e)} className="btn-soft !py-4 text-rose-600"><RotateCcw size={17} />Show again</button>
      <button onClick={e => answer(true, e)} className="btn-primary !py-4"><Check size={18} />Got it!</button>
    </div>
  </div>;
}

// ---------------------------------------------------------------- quiz
type Q = QuizQuestion & { module?: number };

function QuizRunner({ title, questions, bonus = 0, onFinish, onExit, next }: { title: string; questions: Q[]; bonus?: number; onFinish: (correct: number, total: number) => void; onExit: () => void; next?: { label: string; run: () => void } }) {
  const { celebrate, burst } = useCelebrate();
  // Questions and A/B/C/D slots are shuffled once per attempt, so repeating a quiz can't be passed by memorising positions.
  const [deck, setDeck] = useState(() => shuffleQuiz(questions));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const total = deck.length;
  const q = deck[index];

  const choose = (i: number, e: React.MouseEvent) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) { setCorrect(c => c + 1); play("correct"); burst({ x: e.clientX, y: e.clientY, count: 22 }); } else play("wrong");
  };
  const next_ = () => {
    if (index + 1 < total) { setIndex(index + 1); setPicked(null); return; }
    onFinish(correct, total); setDone(true);
    if (correct === total) celebrate({ emoji: "🏆", title: "Perfect score!", text: `${title}: ${total}/${total}`, xp: bonus || undefined, sound: "win" });
    else if (correct >= Math.ceil(total / 2)) celebrate({ emoji: "🎉", title: "Nice work!", text: `${correct}/${total} correct`, xp: bonus || undefined, confetti: true, sound: "win" });
  };
  const retry = () => { setDeck(shuffleQuiz(questions)); setIndex(0); setPicked(null); setCorrect(0); setDone(false); };

  if (!total) return <div className="card p-8 text-center"><p>No questions yet.</p></div>;
  if (done) {
    const perfect = correct === total;
    return <div className="card animate-zoom-in p-8 text-center">
      <Nova mood={perfect ? "cheer" : "happy"} size={110} className="mx-auto" />
      <h2 className="mt-3 font-display text-3xl font-extrabold">{perfect ? "Flawless! 🏆" : correct >= total / 2 ? "Nice work! 🎉" : "Good try! 💪"}</h2>
      <p className="mt-2 font-display text-5xl font-extrabold text-gradient">{correct}/{total}</p>
      <p className="mt-2 text-ink/60">{perfect ? "Every answer right. You really know this." : "Mistakes are how brains grow. Flip through the flashcards, then try again. The questions come in a new order each time."}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {next && correct >= Math.ceil(total / 2) && <button onClick={next.run} className="btn-primary">{next.label}</button>}
        <button onClick={retry} className={next && correct >= Math.ceil(total / 2) ? "btn-soft" : "btn-primary"}>Try again</button>
        <button onClick={onExit} className="btn-soft">Back to Brain Gym</button>
      </div>
    </div>;
  }

  return <div>
    <div className="mb-4 flex items-center gap-3"><ProgressBar value={(index / total) * 100} className="flex-1" /><span className="text-xs font-extrabold text-ink/50">{index + 1}/{total}</span></div>
    <div key={index} className="card animate-fade-up p-6 sm:p-8">
      <p className="eyebrow">{title}</p>
      <h2 className="mt-3 font-display text-2xl font-extrabold leading-snug">{q.q}</h2>
      <div className="mt-6 space-y-3">
        {q.options.map((option, i) => {
          const isAnswer = i === q.answer, isPicked = i === picked, revealed = picked !== null;
          const style = !revealed ? "bg-white hover:-translate-y-0.5 hover:ring-brand/50" : isAnswer ? "bg-emerald-50 ring-emerald-400 text-emerald-900" : isPicked ? "bg-rose-50 ring-rose-300 text-rose-900 animate-shake" : "bg-white/60 opacity-60";
          return <button key={i} disabled={revealed} onClick={e => choose(i, e)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-semibold ring-2 ring-ink/10 transition ${style}`}>
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${revealed && isAnswer ? "bg-emerald-500 text-white" : revealed && isPicked ? "bg-rose-500 text-white" : "bg-ink/5"}`}>{revealed && isAnswer ? <Check size={16} /> : revealed && isPicked ? <X size={16} /> : String.fromCharCode(65 + i)}</span>
            {option}
          </button>;
        })}
      </div>
      {picked !== null && <div className="animate-pop mt-5 rounded-2xl bg-ink/[.04] p-4 text-sm leading-6"><b>{picked === q.answer ? "Yes! " : "Not quite. "}</b>{q.why}</div>}
      {picked !== null && <button onClick={next_} className="btn-primary mt-5 w-full">{index + 1 < total ? "Next question" : "See my score"}</button>}
    </div>
  </div>;
}

// ---------------------------------------------------------------- quiz level picker
function QuizMenu({ module, results, onPick, onCards }: { module: number; results: Brain["quiz"]; onPick: (tier: Tier) => void; onCards: () => void }) {
  const lesson = lessonFor(module)!;
  return <div>
    <div className="card p-6 text-center sm:p-8">
      <Nova mood="think" size={88} className="mx-auto" />
      <p className="eyebrow mt-3">Level {module} · {roadmap[module - 1].title}</p>
      <h2 className="mt-1 font-display text-2xl font-extrabold">Pick your challenge {lesson.emoji}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">Start gentle or jump straight to Hard. Harder quizzes pay more XP for every right answer. Only your best score counts, so retries are free.</p>
    </div>
    <div className="stagger mt-4 grid gap-3">
      {TIERS.map(tier => {
        const count = quizFor(module, tier.id).length, result = results[quizKey(module, tier.id)], aced = Boolean(result && result.total && result.best === result.total);
        return <button key={tier.id} onClick={() => onPick(tier.id)} className={`card card-hover flex items-center gap-4 p-5 text-left ${aced ? "ring-2 ring-emerald-400/70" : ""}`}>
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand/10 text-3xl">{tier.emoji}</span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-lg font-extrabold">{tier.label} <span className="text-xs font-bold text-ink/40">· {count} questions</span></span>
            <span className="block text-xs text-ink/55">{tier.blurb}</span>
            <span className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-bold"><span className="chip bg-amber-100 text-amber-800">+{tier.xpPerCorrect} XP per answer</span>{result && <span className={`chip ${aced ? "bg-emerald-100 text-emerald-700" : "bg-brand/10 text-brand"}`}>Best {result.best}/{result.total}{aced ? " 🏆" : ""}</span>}</span>
          </span>
        </button>;
      })}
    </div>
    <button onClick={onCards} className="btn-soft mx-auto mt-5 flex"><Layers size={16} />Study the flashcards first</button>
  </div>;
}
