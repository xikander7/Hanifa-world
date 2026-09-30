"use client";

import { useMemo } from "react";
import { Copy, Share2 } from "lucide-react";
import { EMPTY_QUESTS, IMPORTED_ACTIVITY, KEYS, fmtDay, fmtMinutes, localDate, weekStart } from "@/lib/data";
import type { Activity, Quest } from "@/lib/data";
import { useGame } from "@/lib/useGame";
import { useHydrated, useLocalStore } from "@/lib/store";

// ------------------------------------------------------------------ share progress with Sikander
export function ShareCard({ goalHours, onCopied }: { goalHours: number; onCopied: () => void }) {
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
      questions.length ? `\n❓ Questions for Sikander:\n${questions.join("\n")}` : "",
    ].filter(Boolean).join("\n");
  }, [hydrated, activity, quests, game, goalHours]);
  const copy = async () => { try { await navigator.clipboard.writeText(text); onCopied(); } catch { window.prompt("Copy this update:", text); } };
  return <div className="card h-full p-6">
    <div className="flex items-center justify-between"><div><p className="eyebrow">Share</p><h2 className="mt-1 font-display text-xl font-extrabold">Update Sikander</h2></div><Share2 className="text-brand" /></div>
    <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap rounded-2xl bg-ink/[.04] p-4 font-sans text-xs leading-5 text-ink/70">{text || "…"}</pre>
    <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={copy} className="btn-primary !py-2.5 text-xs"><Copy size={14} />Copy</button><a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className="btn-soft !py-2.5 text-xs">WhatsApp</a></div>
  </div>;
}
