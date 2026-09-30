import seed from "@/data/seed.json";

// ---------- storage keys (first five are the original keys, kept so existing data survives) ----------
export const KEYS = {
  quests: "future-world-quests",
  activity: "future-world-activity-v2",
  roadmap: "hanifa-tech-roadmap-progress-v1",
  goal: "future-world-weekly-goal-hours",
  unis: "future-world-universities",
  scholarships: "future-world-scholarships",
  skillProof: "future-world-skill-proof-v2",
  brain: "future-world-brain-v1",
  inbox: "future-world-inbox-v1",
  inboxSeen: "future-world-inbox-seen-v1",
  focus: "future-world-focus-v1",
  vibe: "future-world-vibe",
  seenGame: "future-world-seen-game-v1",
  role: "future-world-role",
  sound: "future-world-sound",
  guideSeen: "future-world-guide-seen",
} as const;

// ---------- shared types ----------
export type Comment = { id: string; by: "mentor" | "hanifa"; text: string; at: string };

export type Activity = {
  id: string; date: string; sourceWeek?: string;
  kind: "Time log" | "Learning update" | "Weekly reflection";
  topic: string; minutes: number; did: string; practiced: string; feeling: string;
  blocker: string; proof: string; attachment?: string; mentorNote?: string;
  comments?: Comment[]; source?: "focus" | "manual";
};

export type QuestStatus = "Today" | "Upcoming" | "In Progress" | "Waiting for Mentor" | "Needs a tweak" | "Completed";
export type Quest = {
  id: string; title: string; category: string; status: QuestStatus | string;
  dueDate: string; dueTime?: string; minutes: number; priority: string; skill: string;
  description: string; proof: string; comment: string; mentorFeedback?: string;
  requiresApproval?: boolean; xp?: number; createdBy?: "mentor" | "hanifa"; completedAt?: string;
};

export type RoadmapProgress = { passed: string[]; resources: Record<string, string[]>; practice: Record<string, string[]>; notes: Record<string, string> };

export type SkillProof = { completed: string[]; note: string; proof: string; sent: boolean; sentAt?: string; verified?: boolean; mentorFeedback?: string };
export type SkillProofMap = Record<string, SkillProof>;

export type CardState = { box: number; due: string };
export type QuizResult = { best: number; total: number; attempts: number; last: string };
export type Brain = { cards: Record<string, CardState>; quiz: Record<string, QuizResult>; days: string[]; daily: Record<string, { score: number; total: number }> };

export type InboxMessage = { id: string; at: string; kind: "cheer" | "challenge" | "note"; text: string; reply?: string; repliedAt?: string };
export type FocusTimer = { endsAt: number; minutes: number; topic: string; startedAt: number } | null;

// ---------- stable defaults (must be module constants for useLocalStore) ----------
export const EMPTY_QUESTS: Quest[] = [];
export const EMPTY_INBOX: InboxMessage[] = [];
export const EMPTY_ROADMAP: RoadmapProgress = { passed: [], resources: {}, practice: {}, notes: {} };
export const EMPTY_SKILL_PROOF: SkillProofMap = {};
export const EMPTY_BRAIN: Brain = { cards: {}, quiz: {}, days: [], daily: {} };
export const NO_TIMER: FocusTimer = null;
export const NOT_SEEN = { level: 0, badges: [] as string[], init: false };

// ---------- dates ----------
export const localDate = (date = new Date()) => { const d = new Date(date); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
export const addDays = (iso: string, days: number) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + days); return localDate(d); };
export const weekStart = (iso = localDate()) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return localDate(d); };
export const fmtMinutes = (value: number) => value < 60 ? `${value}m` : `${Math.floor(value / 60)}h${value % 60 ? ` ${value % 60}m` : ""}`;
export const fmtDay = (iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }) => new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, opts);
export const uid = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

// ---------- seed-derived defaults ----------
const sampleDate = (week: string) => {
  const match = week.match(/(\d{1,2})\s*[-–]\s*\d{1,2}\s+([A-Za-z]+)\s+(\d{4})/);
  const parsedDate = match ? new Date(`${match[1]} ${match[2]} ${match[3]} 12:00`) : new Date();
  return Number.isNaN(parsedDate.getTime()) ? localDate() : localDate(parsedDate);
};

/** The workbook's sample week. Shown in the journal, but never counted toward XP or streaks. */
export const IMPORTED_ACTIVITY: Activity[] = seed.weeklyReviews.map((r, i) => ({
  id: `import-${i}`, date: sampleDate(r.week), sourceWeek: r.week, kind: "Weekly reflection", topic: r.currentTopic, minutes: 0,
  did: r.learned, practiced: r.practice, feeling: r.difficulty || "", blocker: r.blockers || "", proof: r.proofLink || "", mentorNote: r.mentorReview || "",
}));

export const isSample = (activity: Activity) => activity.id.startsWith("import-");

export const SKILLS = seed.skills;
export const skillForModule = (moduleNumber: number) => SKILLS[moduleNumber - 1];
export const blankSkillProof = (): SkillProof => ({ completed: [], note: "", proof: "", sent: false });

export const FEELINGS = [
  { emoji: "🔥", label: "On fire" }, { emoji: "✨", label: "In the zone" }, { emoji: "😊", label: "Good" },
  { emoji: "🤔", label: "Confused" }, { emoji: "😮‍💨", label: "Tough day" }, { emoji: "😴", label: "Sleepy" },
];

export const fileToCompressedDataUrl = async (file: File, max = 1000): Promise<string> => {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.src = url;
  await new Promise(resolve => { image.onload = resolve; image.onerror = resolve; });
  const scale = Math.min(1, max / Math.max(image.width || 1, image.height || 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return canvas.toDataURL("image/jpeg", 0.7);
};

export const EMPTY_LIST: never[] = [];
