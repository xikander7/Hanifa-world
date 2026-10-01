import { describe, expect, it } from "vitest";
import { shuffle, shuffleQuiz } from "@/lib/quiz";

// A small deterministic random generator so the tests are repeatable.
const seeded = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };

describe("shuffleQuiz", () => {
  const quiz = [
    { q: "One?", options: ["a", "b", "c", "d"], answer: 2, why: "because" },
    { q: "Two?", options: ["w", "x", "y", "z"], answer: 0, why: "because" },
    { q: "Three?", options: ["p", "q", "r", "s"], answer: 3, why: "because" },
  ];
  it("keeps every question and option, and the right answer still points at the right text", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const out = shuffleQuiz(quiz, seeded(seed));
      expect(out).toHaveLength(3);
      out.forEach(q => {
        const original = quiz.find(x => x.q === q.q)!;
        expect([...q.options].sort()).toEqual([...original.options].sort());
        expect(q.options[q.answer]).toBe(original.options[original.answer]);
      });
    }
  });
  it("does not change the original data", () => {
    const copy = JSON.parse(JSON.stringify(quiz));
    shuffleQuiz(quiz, seeded(7));
    expect(quiz).toEqual(copy);
  });
  it("actually moves things around", () => {
    const slots = new Set<number>();
    for (let seed = 1; seed <= 40; seed++) slots.add(shuffleQuiz(quiz, seeded(seed))[0].answer);
    expect(slots.size).toBeGreaterThan(1);
    expect(shuffle([1, 2, 3, 4, 5, 6], seeded(3))).not.toEqual([1, 2, 3, 4, 5, 6]);
  });
});
