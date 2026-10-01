// Three quiz difficulty tiers per level. Kept free of question data so game.ts can use it cheaply.
// A result is stored under the level number for Easy (as it always was) and "<level>:medium" / "<level>:hard".

export type Tier = "easy" | "medium" | "hard";
export const TIERS: { id: Tier; label: string; emoji: string; xpPerCorrect: number; blurb: string }[] = [
  { id: "easy", label: "Easy", emoji: "🌱", xpPerCorrect: 10, blurb: "Warm-up: the key ideas" },
  { id: "medium", label: "Medium", emoji: "🔥", xpPerCorrect: 15, blurb: "Apply it: predict, choose, spot the bug" },
  { id: "hard", label: "Hard", emoji: "💎", xpPerCorrect: 20, blurb: "Think it through: tricky cases and why" },
];

export const tierMeta = (tier: Tier) => TIERS.find(t => t.id === tier)!;
export const quizKey = (module: number, tier: Tier) => (tier === "easy" ? String(module) : `${module}:${tier}`);
export const tierOfKey = (key: string): Tier => (key.endsWith(":medium") ? "medium" : key.endsWith(":hard") ? "hard" : "easy");
export const moduleOfKey = (key: string) => Number(key.split(":")[0]);
