import { describe, expect, it } from "vitest";
import roadmap from "@/data/roadmap.json";
import seed from "@/data/seed.json";
import { allCards, lessons, TOTAL_CARDS } from "@/data/lessons";

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
