import type { AppData, Approval, Quest, Submission, TimeLog } from "./types";
import type { Repository } from "./repository";

export const emptyData = (): AppData => ({ profiles: [], skills: [], weeklyReviews: [], universities: [], scholarships: [], scholarshipRankings: [], quests: [], timeLogs: [], submissions: [], approvals: [], importRecords: [] });

export class LocalRepository implements Repository {
  private data: AppData;
  private storage?: Storage;
  constructor(initial: Partial<AppData> = {}, storage?: Storage) { this.data = { ...emptyData(), ...initial }; this.storage = storage; this.load(); }
  private load() { if (!this.storage) return; const raw = this.storage.getItem("my-future-world-data"); if (raw) this.data = { ...emptyData(), ...JSON.parse(raw) }; }
  getData() { return structuredClone(this.data); }
  saveData(data: AppData) { this.data = structuredClone(data); this.storage?.setItem("my-future-world-data", JSON.stringify(this.data)); }
  addQuest(quest: Quest) { this.data.quests.push(quest); this.saveData(this.data); return quest; }
  addTimeLog(log: TimeLog) { this.data.timeLogs.push(log); this.saveData(this.data); return log; }
  addSubmission(submission: Submission) { this.data.submissions.push(submission); this.saveData(this.data); return submission; }
  addApproval(approval: Approval) { this.data.approvals.push(approval); this.saveData(this.data); return approval; }
}
