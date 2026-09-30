"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, CheckCircle2, Circle, Clock3, Crown, LockKeyhole, Map, RotateCcw, Sparkles, Star } from "lucide-react";
import roadmap from "@/data/roadmap.json";
import { SectionHeading } from "@/components/SectionHeading";
import { canPassStage, getStageState } from "@/lib/roadmap-progress";

type Progress = {
  passed: string[];
  resources: Record<string, string[]>;
  practice: Record<string, string[]>;
  notes: Record<string, string>;
};
type RoadmapModule = (typeof roadmap)[number];
type StageKind = "resources" | "practice";

const STORAGE_KEY = "hanifa-tech-roadmap-progress-v1";
const stageIds = roadmap.map(module => `module-${module.number}`);
const themes = [
  "from-fuchsia-500 to-rose-500", "from-sky-500 to-cyan-400", "from-emerald-500 to-teal-400", "from-violet-500 to-indigo-500",
  "from-amber-500 to-orange-400", "from-blue-500 to-indigo-400", "from-pink-500 to-rose-400", "from-green-500 to-lime-400",
  "from-cyan-500 to-blue-500", "from-slate-700 to-slate-500", "from-rose-500 to-pink-400", "from-yellow-500 to-amber-400",
  "from-indigo-500 to-violet-400", "from-orange-500 to-red-400", "from-purple-500 to-fuchsia-500", "from-teal-500 to-emerald-400",
  "from-blue-600 to-sky-400", "from-red-500 to-rose-400", "from-violet-600 to-purple-400", "from-lime-500 to-green-400",
];
const icons = ["🖥️", "🌐", "📊", "☁️", "⌨️", "🧰", "🧠", "🐍", "🗃️", "🐙", "🎨", "✨", "🔌", "📮", "🛠️", "🚀", "🐳", "🛡️", "🤖", "⚡"];
const emptyProgress: Progress = { passed: [], resources: {}, practice: {}, notes: {} };

function readStringListMap(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, Array.isArray(item) ? item.filter((entry): entry is string => typeof entry === "string") : []]));
}

function readStringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

function safelyReadProgress(): Progress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyProgress;
    const value = JSON.parse(stored) as Partial<Progress>;
    return {
      passed: Array.isArray(value.passed) ? value.passed.filter(id => stageIds.includes(id)) : [],
      resources: readStringListMap(value.resources),
      practice: readStringListMap(value.practice),
      notes: readStringMap(value.notes),
    };
  } catch {
    return emptyProgress;
  }
}

const getCount = (module: RoadmapModule, progress: Progress) =>
  (progress.resources[`module-${module.number}`] || []).filter(id => module.resources.some(resource => resource.id === id && !resource.optional)).length
  + (progress.practice[`module-${module.number}`] || []).filter(id => module.practice.some(task => task.id === id)).length;

export default function QuestsPage() {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    setProgress(safelyReadProgress());
  }, []);

  const stateFor = (index: number) => getStageState(index, stageIds, progress.passed);
  const activeIndex = useMemo(() => stageIds.findIndex((_, index) => getStageState(index, stageIds, progress.passed) === "ready"), [progress.passed]);
  const selectedIndex = selectedNumber === null ? (activeIndex >= 0 ? activeIndex : roadmap.length - 1) : Math.max(0, Math.min(roadmap.length - 1, selectedNumber - 1));
  const selected = roadmap[selectedIndex];
  const selectedId = `module-${selected.number}`;
  const selectedState = stateFor(selectedIndex);
  const resourcesDone = progress.resources[selectedId] || [];
  const practiceDone = progress.practice[selectedId] || [];
  const requiredResources = selected.resources.filter(item => !item.optional);
  const selectedStepCount = requiredResources.length + selected.practice.length;
  const readyToPass = canPassStage(requiredResources.map(item => item.id), selected.practice.map(item => item.id), resourcesDone, practiceDone);
  const totalChecked = roadmap.reduce((sum, module) => sum + getCount(module, progress), 0);
  const totalSteps = roadmap.reduce((sum, module) => sum + module.resources.filter(resource => !resource.optional).length + module.practice.length, 0);
  const totalProgress = Math.round(totalChecked / totalSteps * 100);
  const xp = progress.passed.length * 120;
  const passedCount = roadmap.filter((_, index) => stateFor(index) === "passed").length;

  const commit = (next: Progress) => {
    setProgress(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const toggleStep = (kind: StageKind, id: string) => {
    if (selectedState !== "ready") return;
    const field = kind === "resources" ? "resources" : "practice";
    const current = progress[field][selectedId] || [];
    const nextValues = current.includes(id) ? current.filter(value => value !== id) : [...current, id];
    commit({ ...progress, [field]: { ...progress[field], [selectedId]: nextValues } });
    setNotice("");
  };

  const passStage = () => {
    if (selectedState !== "ready" || !readyToPass) return;
    const nextPassed = [...progress.passed, selectedId];
    commit({ ...progress, passed: nextPassed });
    if (selectedIndex < roadmap.length - 1) {
      setNotice(`Level ${selected.number} cleared! ${roadmap[selectedIndex + 1].title} is now unlocked. Keep your streak alive! ✨`);
      setSelectedNumber(selected.number + 1);
    } else {
      setNotice("All 20 levels cleared! You built a brilliant tech adventure, one step at a time. 🏆");
    }
  };

  const resetProgress = () => {
    if (!window.confirm("Reset all roadmap progress on this device? This cannot be undone.")) return;
    commit(emptyProgress);
    setSelectedNumber(1);
    setNotice("Your adventure map is ready for a fresh start 🌱");
  };

  const updateNote = (value: string) => commit({ ...progress, notes: { ...progress.notes, [selectedId]: value } });

  return <div className="space-y-6 pb-10">
    <SectionHeading eyebrow="Quest map · 20 levels to your tech future" title="Your Tech Adventure 🎮" copy="Learn in order, try the real-world missions, and unlock the next world when you’re ready. All resources are free and open in a new tab." />

    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-950 via-violet-900 to-fuchsia-800 p-5 text-white shadow-lg sm:p-7">
      <div className="absolute -right-5 -top-10 text-[8rem] opacity-15">🌌</div>
      <div className="relative grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">{passedCount === roadmap.length ? "Adventure complete" : `Level ${Math.max(1, activeIndex + 1)} of ${roadmap.length}`}</span>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{passedCount === roadmap.length ? "Tech-world legend! 🏆" : "One quest at a time. You’ve got this!"}</h2>
          <p className="mt-1 max-w-xl text-sm text-violet-100">{passedCount} of 20 levels passed · about 9–11 months at a steady part-time pace</p>
          <div className="mt-4 h-3 max-w-xl overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-gradient-to-r from-amber-300 via-pink-300 to-cyan-300 transition-all duration-700" style={{ width: `${totalProgress}%` }} /></div>
          <p className="mt-2 text-xs text-violet-200">{totalProgress}% of learning steps explored · small steps count</p>
        </div>
        <div className="flex items-center gap-3 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-300 text-3xl text-amber-950 shadow-lg"><Crown size={30} /></span><div><span className="block text-2xl font-bold">{xp} XP</span><span className="text-xs text-violet-100">{passedCount} level{passedCount === 1 ? "" : "s"} cleared</span></div></div>
      </div>
    </section>

    {notice && <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900"><Sparkles className="mt-0.5 shrink-0 text-emerald-600" size={18} />{notice}</div>}

    <section className="rounded-[1.8rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.17em] text-violet-700">The map</p><h2 className="mt-1 text-xl font-semibold">20 worlds. One growing skill set.</h2><p className="mt-1 text-sm text-slate-500">Only your next level is unlocked. Finished levels stay open to revisit.</p></div><div className="flex flex-wrap gap-3 text-xs font-medium text-slate-500"><span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500" />Ready</span><span className="inline-flex items-center gap-1"><CheckCircle2 size={14} className="text-emerald-600" />Passed</span><span className="inline-flex items-center gap-1"><LockKeyhole size={13} />Locked</span></div></div>
      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">{roadmap.map((module, index) => {
        const stageState = stateFor(index);
        const isSelected = index === selectedIndex;
        const disabled = stageState === "locked";
        return <button key={module.number} disabled={disabled} onClick={() => { setSelectedNumber(module.number); setNotice(""); }} aria-current={isSelected ? "step" : undefined} className={`group relative min-h-28 overflow-hidden rounded-2xl border p-3 text-left transition sm:min-h-32 sm:p-4 ${disabled ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400" : isSelected ? `border-transparent bg-gradient-to-br ${themes[index]} text-white shadow-lg ring-4 ring-violet-100` : stageState === "passed" ? "border-emerald-200 bg-emerald-50 text-emerald-950 hover:-translate-y-0.5 hover:shadow-md" : "border-violet-200 bg-violet-50 text-violet-950 hover:-translate-y-0.5 hover:shadow-md"}`}>
          <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider opacity-75">LVL {String(module.number).padStart(2, "0")}</span>{disabled ? <LockKeyhole size={15} /> : stageState === "passed" ? <CheckCircle2 size={17} className="text-emerald-600" /> : <span className="text-[10px] font-bold uppercase tracking-wide">{isSelected ? "Play now" : "Ready"}</span>}</div>
          <span className={`mt-2 block text-2xl transition group-hover:scale-110 ${disabled ? "grayscale opacity-50" : ""}`}>{icons[index]}</span>
          <span className="mt-2 block line-clamp-2 text-xs font-bold leading-4 sm:text-sm">{module.title}</span>
          <span className="mt-1 block text-[10px] opacity-75">{module.duration}</span>
        </button>;
      })}</div>
    </section>

    <section id="active-quest" className="overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-sm">
      <div className={`bg-gradient-to-r ${themes[selectedIndex]} p-5 text-white sm:p-7`}>
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">World {String(selected.number).padStart(2, "0")}</span><span className="inline-flex items-center gap-1 rounded-full bg-black/10 px-3 py-1 text-xs font-semibold"><Clock3 size={13} />{selected.duration}</span>{selectedState === "passed" && <span className="rounded-full bg-emerald-300 px-3 py-1 text-xs font-bold text-emerald-950">PASSED ✓</span>}</div><h2 className="mt-3 text-2xl font-bold sm:text-3xl">{icons[selectedIndex]} {selected.title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/90">{selected.summary}</p></div><div className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl border border-white/25 bg-white/15 text-2xl font-bold">{selected.number}<span className="sr-only">of 20</span></div></div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 text-xs font-medium"><Star size={15} className="fill-amber-200 text-amber-200" />{getCount(selected, progress)} / {selectedStepCount} required steps complete</div><div className="h-2 w-full max-w-56 overflow-hidden rounded-full bg-black/15"><div className="h-full rounded-full bg-white transition-all" style={{ width: `${getCount(selected, progress) / selectedStepCount * 100}%` }} /></div></div>
      </div>

      {selected.notes.length > 0 && <div className="space-y-2 border-b border-amber-100 bg-amber-50 px-5 py-4 sm:px-7">{selected.notes.map((note, index) => <p key={index} className="text-xs leading-5 text-amber-950">💡 {note}</p>)}</div>}

      <div className="grid gap-0 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-sky-700">Watch & explore</p><h3 className="mt-1 text-xl font-bold">Your learning playlist</h3><p className="mt-1 text-xs text-slate-500">Go in order · tick each resource when you’ve finished</p></div><span className="text-2xl">🎧</span></div>
          <div className="mt-5 space-y-3">{selected.resources.map((resource, index) => {
            const checked = resourcesDone.includes(resource.id);
            return <article key={resource.id} className={`rounded-2xl border p-4 transition ${checked ? "border-emerald-200 bg-emerald-50/80" : "border-slate-200 bg-white hover:border-sky-200 hover:shadow-sm"}`}>
              <div className="flex gap-3"><button disabled={selectedState !== "ready"} aria-label={`${checked ? "Mark unfinished" : "Mark finished"}: ${resource.title}`} onClick={() => toggleStep("resources", resource.id)} className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full transition ${checked ? "bg-emerald-500 text-white" : "border-2 border-slate-300 text-transparent hover:border-sky-400"}`}><Check size={14} /></button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{String(index + 1).padStart(2, "0")}</span><h4 className={`text-sm font-bold ${checked ? "text-emerald-950" : "text-slate-900"}`}>{resource.title}</h4>{resource.optional && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-900">Optional · later</span>}</div><p className="mt-1.5 text-xs leading-5 text-slate-600">{resource.description}</p><div className="mt-3 flex flex-wrap gap-2">{resource.links.map((link, linkIndex) => <a key={`${link.url}-${linkIndex}`} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1.5 text-[11px] font-bold text-sky-900 transition hover:bg-sky-200">{link.label}<ArrowUpRight size={12} /></a>)}</div></div></div>
            </article>;
          })}</div>
        </div>

        <div className="border-t border-slate-100 bg-gradient-to-b from-amber-50/50 to-orange-50/50 p-5 sm:p-7 xl:border-l xl:border-t-0">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-orange-700">Real-world missions</p><h3 className="mt-1 text-xl font-bold">Show what you can do</h3><p className="mt-1 text-xs text-slate-500">Finish each one before opening the next world</p></div><span className="text-2xl">🧩</span></div>
          <div className="mt-5 space-y-3">{selected.practice.map((task, index) => {
            const checked = practiceDone.includes(task.id);
            return <button type="button" key={task.id} disabled={selectedState !== "ready"} onClick={() => toggleStep("practice", task.id)} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${checked ? "border-emerald-200 bg-emerald-50" : "border-orange-100 bg-white hover:border-orange-300 hover:shadow-sm"}`}><span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg ${checked ? "bg-emerald-500 text-white" : "border-2 border-orange-200 bg-orange-50 text-orange-400"}`}>{checked ? <Check size={14} /> : <span className="text-xs font-bold">{index + 1}</span>}</span><span className={`text-sm leading-6 ${checked ? "font-medium text-emerald-950 line-through decoration-emerald-400" : "text-slate-800"}`}>{task.text}</span></button>;
          })}</div>
          <label className="mt-5 block text-xs font-bold text-slate-700">My notes from this world <span className="font-normal text-slate-400">(optional)</span><textarea value={progress.notes[selectedId] || ""} onChange={event => updateNote(event.target.value)} disabled={selectedState !== "ready"} placeholder="What surprised you? What do you want to remember?" className="mt-2 min-h-24 w-full resize-y rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm font-normal text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-100 disabled:bg-slate-100" /></label>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-white px-5 py-5 sm:px-7"><div className="flex items-start gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${readyToPass ? "bg-emerald-100 text-emerald-700" : "bg-violet-50 text-violet-600"}`}>{readyToPass ? <CheckCircle2 size={21} /> : <Map size={20} />}</span><div><p className="text-sm font-bold">{selectedState === "passed" ? "Level cleared! You can revisit anytime." : readyToPass ? "Everything’s checked off—ready for your level-up?" : "Your next world unlocks after every step is complete."}</p><p className="mt-1 text-xs text-slate-500">{selectedState === "passed" ? "Your progress is saved on this device." : `${requiredResources.length - requiredResources.filter(item => resourcesDone.includes(item.id)).length} resources and ${selected.practice.length - practiceDone.length} missions left`}</p></div></div>{selectedState === "ready" ? <button onClick={passStage} disabled={!readyToPass} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"><Crown size={17} />I passed this level!</button> : selectedState === "passed" ? <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-5 py-3 text-sm font-bold text-emerald-800"><CheckCircle2 size={17} />Passed</span> : <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-500"><LockKeyhole size={15} />Locked</span>}</div>
    </section>

    <footer className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3"><p className="text-xs text-slate-500"><Circle size={12} className="mr-1 inline" />Your progress is saved in this browser on this device. Resources open in a new tab.</p><button onClick={resetProgress} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"><RotateCcw size={13} />Reset my map</button></footer>
  </div>;
}
