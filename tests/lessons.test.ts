import { describe, expect, it } from "vitest";
import roadmap from "@/data/roadmap.json";
import seed from "@/data/seed.json";
import { allCards, lessons, TOTAL_CARDS } from "@/data/lessons";
import { quizFor, quizKey, TIERS, tierOfKey, TOTAL_QUIZ_QUESTIONS } from "@/data/quizTiers";

describe("teaching content", () => {
  it("has a lesson for every adventure level, in order, matching the roadmap and skills", () => {
    expect(lessons).toHaveLength(roadmap.length);
    lessons.forEach((lesson, i) => {
      expect(lesson.module).toBe(i + 1);
      expect(roadmap[i].number).toBe(i + 1);
      expect(seed.skills[i].sequence).toBe(i + 1);
      expect(seed.skills[i].topic).toBe(roadmap[i].title);
    });
  });
  it("gives each level 6 flashcards and a 4-question quiz with valid answers", () => {
    lessons.forEach(lesson => {
      expect(lesson.cards).toHaveLength(6);
      expect(lesson.quiz).toHaveLength(4);
      lesson.quiz.forEach(q => {
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(4);
        expect(q.why.length).toBeGreaterThan(10);
      });
      lesson.cards.forEach(([front, back]) => { expect(front).toBeTruthy(); expect(back.length).toBeGreaterThan(10); });
    });
    expect(TOTAL_CARDS).toBe(120);
    expect(new Set(allCards().map(c => c.id)).size).toBe(120);
  });
  it("does not always put the right answer in the same slot", () => {
    const slots = new Set(lessons.flatMap(l => l.quiz.map(q => q.answer)));
    expect(slots.size).toBe(4);
  });
});

describe("quiz tiers", () => {
  const sizes = { easy: 4, medium: 6, hard: 6 } as const;
  it("gives every level an Easy, Medium and Hard quiz with valid, distinct answers", () => {
    lessons.forEach(lesson => TIERS.forEach(({ id }) => {
      const quiz = quizFor(lesson.module, id);
      expect(quiz, `level ${lesson.module} ${id}`).toHaveLength(sizes[id]);
      quiz.forEach(q => {
        expect(q.options, q.q).toHaveLength(4);
        expect(new Set(q.options).size, q.q).toBe(4);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(4);
        expect(q.q.length).toBeGreaterThan(10);
        expect(q.why.length).toBeGreaterThan(20);
      });
    }));
    expect(TOTAL_QUIZ_QUESTIONS).toBe(20 * 16);
  });
  it("never repeats a question and spreads the right answers across A-D", () => {
    const all = lessons.flatMap(l => TIERS.flatMap(t => quizFor(l.module, t.id)));
    expect(new Set(all.map(q => q.q)).size).toBe(all.length);
    const counts = [0, 0, 0, 0];
    all.forEach(q => counts[q.answer]++);
    counts.forEach(c => expect(c).toBeGreaterThan(all.length * 0.18));
  });
  it("keeps Easy results under the plain level number so old scores still count", () => {
    expect(quizKey(3, "easy")).toBe("3");
    expect(quizKey(3, "hard")).toBe("3:hard");
    expect(tierOfKey("3")).toBe("easy");
    expect(tierOfKey("12:medium")).toBe("medium");
  });
});
