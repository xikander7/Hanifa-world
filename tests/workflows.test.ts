import { describe, expect, it } from "vitest";
import { canStartTimer, createSubmission, reviewSubmission, transitionQuest } from "@/domain/workflows";
import type { Quest } from "@/domain/types";

const quest: Quest = { id: "q1", title: "Practice SQL", category: "Learning", status: "in_progress", requiresApproval: true, createdBy: "mentor" };

describe("core workflows", () => {
  it("prevents a learner from approving a submission", () => {
    expect(() => transitionQuest({ ...quest, status: "mentor_review" }, "approved", "learner")).toThrow("Only the Mentor");
  });
  it("keeps a revision review available for resubmission", () => {
    const submission = createSubmission(quest, "hanifa", ["https://example.com/proof"], "I practiced joins");
    const approval = reviewSubmission(submission, "xander", "needs_revision", "Add one more example");
    expect(approval.decision).toBe("needs_revision");
    expect(transitionQuest({ ...quest, status: "mentor_review" }, "needs_revision", "mentor").status).toBe("needs_revision");
  });
  it("allows only one active timer", () => {
    expect(canStartTimer(undefined)).toBe(true);
    expect(canStartTimer({ id: "t1", date: "2026-09-25", durationMinutes: 0, category: "Learning" })).toBe(false);
  });
});
