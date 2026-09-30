import type { AppData, Approval, Quest, Submission, TimeLog } from "./types";

export interface Repository {
  getData(): AppData;
  saveData(data: AppData): void;
  addQuest(quest: Quest): Quest;
  addTimeLog(log: TimeLog): TimeLog;
  addSubmission(submission: Submission): Submission;
  addApproval(approval: Approval): Approval;
}
