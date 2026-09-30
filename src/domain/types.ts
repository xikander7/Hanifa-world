export type Role = "mentor" | "learner";
export type Permission =
  | "submit_work"
  | "approve_milestone"
  | "import_workbook"
  | "manage_settings"
  | "log_activity"
  | "create_quest";

export type QuestStatus =
  | "planned"
  | "in_progress"
  | "submitted"
  | "mentor_review"
  | "approved"
  | "needs_revision"
  | "completed";

export type SkillStage = "discovering" | "learning" | "practicing" | "building" | "proven";

export interface Profile {
  id: string;
  name: string;
  role: Role;
  email?: string;
}

export interface Skill {
  id: string;
  sequence: number;
  topic: string;
  approximateTime?: string;
  whatToLearn?: string;
  depthComment?: string;
  hanifaComments?: string;
  hanifaNotes?: string;
  mentorComments?: string;
  world: string;
  activityPercent: number;
  verifiedStage: SkillStage;
}

export interface WeeklyReview {
  id: string;
  week: string;
  currentTopic: string;
  progressPercent: number;
  learned: string;
  practice: string;
  proofLink?: string;
  difficulty?: string;
  blockers?: string;
  learnerComments?: string;
  mentorReview?: string;
  sourceSheet: string;
  sourceRow: number;
}

export interface University {
  id: string;
  rank: number;
  name: string;
  cityMode?: string;
  bestIf?: string;
  cost?: string;
  extraCost?: string;
  admissionTiming?: string;
  ease?: string;
  supportSelf?: string;
  futureValue?: string;
  verdict?: string;
  status?: string;
}

export interface Scholarship {
  id: string;
  rank: number;
  country: string;
  university: string;
  applyLink?: string;
  infoLink?: string;
  howToApply?: string;
}

export interface ScholarshipRanking {
  id: string;
  rank: number;
  country: string;
  universities?: string;
  route?: string;
  studyCost?: string;
  livingCost?: string;
  canSupportSelf?: string;
  jobChance?: string;
  admissionDates?: string;
  ease?: string;
  bestForCs?: string;
  comments?: string;
}

export interface Quest {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: QuestStatus;
  dueDate?: string;
  expectedMinutes?: number;
  actualMinutes?: number;
  xp?: number;
  relatedSkillId?: string;
  requiresApproval: boolean;
  createdBy: Role;
}

export interface TimeLog {
  id: string;
  date: string;
  durationMinutes: number;
  category: string;
  questId?: string;
  skillId?: string;
  description?: string;
  blocker?: string;
}

export interface Submission {
  id: string;
  questId: string;
  submittedAt: string;
  submittedBy: string;
  reflection?: string;
  evidenceUrls: string[];
}

export interface Approval {
  id: string;
  submissionId: string;
  reviewerId: string;
  decision: "approved" | "needs_revision";
  feedback?: string;
  reviewedAt: string;
}

export interface ImportRecord {
  id: string;
  sourceFileName: string;
  sourceSheet: string;
  sourceRow: number;
  stableKey: string;
  importedAt: string;
}

export interface AppData {
  profiles: Profile[];
  skills: Skill[];
  weeklyReviews: WeeklyReview[];
  universities: University[];
  scholarships: Scholarship[];
  scholarshipRankings: ScholarshipRanking[];
  quests: Quest[];
  timeLogs: TimeLog[];
  submissions: Submission[];
  approvals: Approval[];
  importRecords: ImportRecord[];
}
