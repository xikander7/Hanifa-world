// Three quiz difficulty tiers per level. Easy lives in lessons.ts; Medium and Hard live in ./quiz.
// A result is stored under the level number for Easy (as it always was) and "<level>:medium" / "<level>:hard".

import { lessons } from "./lessons";
import type { QuizQuestion } from "./lessons";
import { place } from "./quiz/build";
import type { LevelBank } from "./quiz/build";
import { levels01to05 } from "./quiz/levels01to05";
import { levels06to10 } from "./quiz/levels06to10";
import { levels11to15 } from "./quiz/levels11to15";
import { levels16to20 } from "./quiz/levels16to20";

export type Tier = "easy" | "medium" | "hard";
export const TIERS: { id: Tier; label: string; emoji: string; xpPerCorrect: number; blurb: string }[] = [
  { id: "easy", label: "Easy", emoji: "🌱", xpPerCorrect: 10, blurb: "Warm-up: the key ideas" },
  { id: "medium", label: "Medium", emoji: "🔥", xpPerCorrect: 15, blurb: "Apply it: predict, choose, spot the bug" },
  { id: "hard", label: "Hard", emoji: "💎", xpPerCorrect: 20, blurb: "Think it through: tricky cases and why" },
];

export const quizKey = (module: number, tier: Tier) => (tier === "easy" ? String(module) : `${module}:${tier}`);
export const tierOfKey = (key: string): Tier => (key.endsWith(":medium") ? "medium" : key.endsWith(":hard") ? "hard" : "easy");

const banks: Record<number, LevelBank> = { ...levels01to05, ...levels06to10, ...levels11to15, ...levels16to20 };

// The rotating answer slot starts at a different offset for each tier and level so A/B/C/D stay balanced.
const built = new Map<string, QuizQuestion[]>();
const extra = (module: number, tier: "medium" | "hard") => {
  const key = quizKey(module, tier);
  if (!built.has(key)) built.set(key, place(banks[module]?.[tier] ?? [], (module + (tier === "hard" ? 2 : 0)) % 4));
  return built.get(key)!;
};

export function quizFor(module: number, tier: Tier): QuizQuestion[] {
  if (tier === "easy") return lessons.find(l => l.module === module)?.quiz ?? [];
  return extra(module, tier);
}

export const TOTAL_QUIZ_QUESTIONS = lessons.reduce((sum, l) => sum + TIERS.reduce((s, t) => s + quizFor(l.module, t.id).length, 0), 0);
