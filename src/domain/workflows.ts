import { can } from "./permissions";
import type { Approval, Quest, QuestStatus, Role, Submission, TimeLog } from "./types";

const transitions: Record<QuestStatus, QuestStatus[]> = { planned: ["in_progress"], in_progress: ["submitted", "completed"], submitted: ["mentor_review"], mentor_review: ["approved", "needs_revision"], needs_revision: ["in_progress", "submitted"], approved: ["completed"], completed: [] };

export function transitionQuest(quest: Quest, next: QuestStatus, role: Role): Quest {
  if (!transitions[quest.status].includes(next)) throw new Error(`Cannot move quest from ${quest.status} to ${next}`);
  if ((next === "approved" || next === "needs_revision") && !can(role, "approve_milestone")) throw new Error("Only the Mentor can review a submission");
  return { ...quest, status: next };
}

export function createSubmission(quest: Quest, learnerId: string, evidenceUrls: string[], reflection?: string): Submission {
  if (!quest.requiresApproval) throw new Error("This quest does not require mentor approval");
  if (!["in_progress", "needs_revision"].includes(quest.status)) throw new Error("Quest is not ready for submission");
  return { id: crypto.randomUUID(), questId: quest.id, submittedAt: new Date().toISOString(), submittedBy: learnerId, reflection, evidenceUrls };
}

export function reviewSubmission(submission: Submission, reviewerId: string, decision: Approval["decision"], feedback?: string): Approval {
  return { id: crypto.randomUUID(), submissionId: submission.id, reviewerId, decision, feedback, reviewedAt: new Date().toISOString() };
}

export function canStartTimer(active: TimeLog | undefined): boolean { return !active; }
