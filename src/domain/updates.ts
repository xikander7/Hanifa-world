export type LearningUpdate = {
  id: string;
  date: string;
  cadence: "Daily note" | "Weekly reflection" | "Learning update";
  topic: string;
  learned: string;
  practice: string;
  minutes: number;
  mood: string;
  blocker: string;
  comment: string;
  proof: string;
  attachment?: string;
  mentorComment?: string;
};

export const UPDATE_STORAGE_KEY = "future-world-learning-updates";
