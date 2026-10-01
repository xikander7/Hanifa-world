// Helpers for writing the Medium and Hard quiz banks compactly.
// A raw question is [question, correct answer, three wrong answers, why].
// The correct answer is placed in a rotating slot so A/B/C/D are used evenly.

import type { QuizQuestion } from "../lessons";

export type Raw = [q: string, correct: string, wrong: [string, string, string], why: string];
export type LevelBank = { medium: Raw[]; hard: Raw[] };

export function place(raws: Raw[], offset: number): QuizQuestion[] {
  return raws.map(([q, correct, wrong, why], i) => {
    const slot = (i + offset) % 4;
    const options = [...wrong];
    options.splice(slot, 0, correct);
    return { q, options, answer: slot, why };
  });
}
