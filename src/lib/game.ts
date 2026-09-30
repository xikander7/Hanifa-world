import { addDays, isSample, localDate, weekStart } from "./data";
import type { Activity, Brain, Quest, RoadmapProgress, SkillProofMap } from "./data";

// Everything here is derived from stored data, never stored itself, so XP can't be double-counted
// and Xander and Hanifa always see the same numbers.

export const XP = {
  perMinute: 1, minuteCapPerDay: 180, journalEntry: 15, journalCapPerDay: 2,
  masteredCard: 5, quizCorrect: 10, dailyThree: 30, levelCleared: 150, perfectDay: 50, verifiedSkill: 100, defaultQuest: 40,
} as const;

export const DAILY_FOCUS_GOAL_MINUTES = 25;
export const MASTERED_BOX = 3;

export type Rank = { title: string; emoji: string };
const RANKS: { from: number; title: string; emoji: string }[] = [
  { from: 1, title: "Stargazer", emoji: "🔭" }, { from: 3, title: "Explorer", emoji: "🧭" }, { from: 5, title: "Maker", emoji: "🛠️" },
  { from: 7, title: "Innovator", emoji: "💡" }, { from: 9, title: "Architect", emoji: "🏛️" }, { from: 12, title: "Legend", emoji: "👑" },
];

export const levelFromXp = (xp: number) => Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1;
export const xpForLevel = (level: number) => 50 * (level - 1) ** 2;
export const rankForLevel = (level: number): Rank => { const hit = [...RANKS].reverse().find(r => level >= r.from) ?? RANKS[0]; return { title: hit.title, emoji: hit.emoji }; };

// ---------- daily goals ----------
export type DailyGoals = { brain: boolean; focus: boolean; journal: boolean; done: number; perfect: boolean };

const realActivity = (activity: Activity[]) => activity.filter(a => !isSample(a));

export function minutesOn(activity: Activity[], date: string) {
  return realActivity(activity).filter(a => a.date === date).reduce((sum, a) => sum + (a.minutes || 0), 0);
}

export function dailyGoals(date: string, activity: Activity[], brain: Brain): DailyGoals {
  const real = realActivity(activity);
  const goals = {
    brain: Boolean(brain.daily[date]),
    focus: minutesOn(real, date) >= DAILY_FOCUS_GOAL_MINUTES,
    journal: real.some(a => a.date === date && a.did.trim().length > 0),
  };
  const done = Number(goals.brain) + Number(goals.focus) + Number(goals.journal);
  return { ...goals, done, perfect: done === 3 };
}

// ---------- streaks ----------
export function activeDays(activity: Activity[], brain: Brain): Set<string> {
  const days = new Set<string>(brain.days);
  realActivity(activity).forEach(a => { if (a.minutes > 0 || a.did.trim()) days.add(a.date); });
  return days;
}

export function streakInfo(days: Set<string>, today: string) {
  let current = 0;
  let cursor = days.has(today) ? today : addDays(today, -1);
  const aliveToday = days.has(today);
  while (days.has(cursor)) { current += 1; cursor = addDays(cursor, -1); }
  const sorted = [...days].sort();
  let best = 0, run = 0, previous = "";
  for (const day of sorted) { run = previous && addDays(previous, 1) === day ? run + 1 : 1; best = Math.max(best, run); previous = day; }
  return { current, best: Math.max(best, current), aliveToday };
}

// ---------- badges ----------
export type BadgeContext = {
  activity: Activity[]; brain: Brain; quests: Quest[]; roadmap: RoadmapProgress; skills: SkillProofMap;
  streakBest: number; masteredCards: number; savedDreams: number; mentorNotes: number;
};
export type Badge = { id: string; emoji: string; name: string; hint: string; earned: (c: BadgeContext) => boolean };

const maxDay = (activity: Activity[]) => {
  const totals: Record<string, number> = {};
  realActivity(activity).forEach(a => { totals[a.date] = (totals[a.date] || 0) + a.minutes; });
  return Math.max(0, ...Object.values(totals));
};

export const BADGES: Badge[] = [
  { id: "first-spark", emoji: "✨", name: "First Spark", hint: "Log your very first learning moment", earned: c => realActivity(c.activity).length > 0 },
  { id: "streak-3", emoji: "🔥", name: "Warming Up", hint: "Learn 3 days in a row", earned: c => c.streakBest >= 3 },
  { id: "streak-7", emoji: "🌋", name: "Unstoppable", hint: "Learn 7 days in a row", earned: c => c.streakBest >= 7 },
  { id: "streak-21", emoji: "☄️", name: "Habit Hero", hint: "Learn 21 days in a row", earned: c => c.streakBest >= 21 },
  { id: "quiz-whiz", emoji: "🧠", name: "Quiz Whiz", hint: "Score 100% on any quiz", earned: c => Object.values(c.brain.quiz).some(q => q.total > 0 && q.best === q.total) },
  { id: "card-shark", emoji: "🃏", name: "Card Shark", hint: "Master 20 flashcards", earned: c => c.masteredCards >= 20 },
  { id: "brain-builder", emoji: "🧬", name: "Brain Builder", hint: "Master 60 flashcards", earned: c => c.masteredCards >= 60 },
  { id: "level-1", emoji: "🚀", name: "Lift Off", hint: "Clear your first adventure level", earned: c => c.roadmap.passed.length >= 1 },
  { id: "foundation", emoji: "🌍", name: "Foundation Built", hint: "Clear levels 1, 2 and 3", earned: c => ["module-1", "module-2", "module-3"].every(id => c.roadmap.passed.includes(id)) },
  { id: "halfway", emoji: "🏔️", name: "Halfway Hero", hint: "Clear 10 adventure levels", earned: c => c.roadmap.passed.length >= 10 },
  { id: "deep-diver", emoji: "🤿", name: "Deep Diver", hint: "Focus for 2 hours in one day", earned: c => maxDay(c.activity) >= 120 },
  { id: "proof-pro", emoji: "📸", name: "Proof Pro", hint: "Add proof to 3 journal entries", earned: c => realActivity(c.activity).filter(a => a.proof.trim() || a.attachment).length >= 3 },
  { id: "brave-asker", emoji: "🙋‍♀️", name: "Brave Asker", hint: "Ask Xander 3 questions", earned: c => realActivity(c.activity).filter(a => a.blocker.trim()).length >= 3 },
  { id: "finisher", emoji: "🏁", name: "Finisher", hint: "Complete a mission", earned: c => c.quests.some(q => q.status === "Completed") },
  { id: "mentors-pick", emoji: "💌", name: "Mentor's Pick", hint: "Get a verified skill from Xander", earned: c => Object.values(c.skills).some(s => s.verified) || c.mentorNotes > 0 && c.quests.some(q => q.mentorFeedback) },
  { id: "dream-chaser", emoji: "🎓", name: "Dream Chaser", hint: "Save a scholarship or pick a favourite uni", earned: c => c.savedDreams > 0 },
  { id: "sheet-star", emoji: "📊", name: "Sheet Star", hint: "Fill in your Working Excel Sheet on 3 different days", earned: c => new Set(realActivity(c.activity).filter(a => a.source === "sheet").map(a => a.date)).size >= 3 },
  { id: "weekly-reporter", emoji: "🗞️", name: "Weekly Reporter", hint: "Write 4 weekly updates (in the sheet or the Journal)", earned: c => realActivity(c.activity).filter(a => a.kind === "Weekly reflection" && a.did.trim()).length >= 4 },
];

// ---------- the whole picture ----------
export type GameInput = {
  activity: Activity[]; brain: Brain; quests: Quest[]; roadmap: RoadmapProgress; skills: SkillProofMap;
  savedDreams?: number; mentorNotes?: number; today?: string;
};

export function computeGame(input: GameInput) {
  const today = input.today ?? localDate();
  const { brain, quests, roadmap, skills } = input;
  const real = realActivity(input.activity);

  const perDay: Record<string, number> = {};
  const journalPerDay: Record<string, number> = {};
  real.forEach(a => {
    perDay[a.date] = (perDay[a.date] || 0) + (a.minutes || 0);
    if (a.did.trim()) journalPerDay[a.date] = (journalPerDay[a.date] || 0) + 1;
  });
  const minuteXp = Object.values(perDay).reduce((sum, m) => sum + Math.min(m, XP.minuteCapPerDay) * XP.perMinute, 0);
  const journalXp = Object.values(journalPerDay).reduce((sum, n) => sum + Math.min(n, XP.journalCapPerDay) * XP.journalEntry, 0);
  const masteredCards = Object.values(brain.cards).filter(c => c.box >= MASTERED_BOX).length;
  const quizXp = Object.values(brain.quiz).reduce((sum, q) => sum + q.best * XP.quizCorrect, 0);
  const dailyXp = Object.keys(brain.daily).length * XP.dailyThree;
  const levelsCleared = roadmap.passed.length;
  const questXp = quests.filter(q => q.status === "Completed").reduce((sum, q) => sum + (q.xp ?? XP.defaultQuest), 0);
  const verifiedCount = Object.values(skills).filter(s => s.verified).length;

  const dates = new Set([...Object.keys(perDay), ...Object.keys(brain.daily)]);
  const perfectDays = [...dates].filter(d => dailyGoals(d, input.activity, brain).perfect).length;

  const breakdown = [
    { label: "Focus time", emoji: "⏱️", xp: minuteXp }, { label: "Journal", emoji: "📝", xp: journalXp },
    { label: "Flashcards", emoji: "🃏", xp: masteredCards * XP.masteredCard }, { label: "Quizzes", emoji: "🧠", xp: quizXp },
    { label: "Daily 3", emoji: "⚡", xp: dailyXp }, { label: "Levels cleared", emoji: "🚀", xp: levelsCleared * XP.levelCleared },
    { label: "Missions", emoji: "🎯", xp: questXp }, { label: "Perfect days", emoji: "🌟", xp: perfectDays * XP.perfectDay },
    { label: "Verified skills", emoji: "✅", xp: verifiedCount * XP.verifiedSkill },
  ];
  const xp = breakdown.reduce((sum, row) => sum + row.xp, 0);
  const level = levelFromXp(xp);
  const floor = xpForLevel(level), ceiling = xpForLevel(level + 1);

  const days = activeDays(input.activity, brain);
  const streak = streakInfo(days, today);

  const week = weekStart(today);
  const weekMinutes = Object.entries(perDay).filter(([d]) => d >= week && d <= today).reduce((sum, [, m]) => sum + m, 0);

  const context: BadgeContext = {
    activity: input.activity, brain, quests, roadmap, skills, streakBest: streak.best, masteredCards,
    savedDreams: input.savedDreams ?? 0, mentorNotes: input.mentorNotes ?? 0,
  };
  const badges = BADGES.map(b => ({ ...b, isEarned: b.earned(context) }));

  return {
    xp, breakdown, level, rank: rankForLevel(level), levelFloor: floor, levelCeiling: ceiling,
    levelProgress: Math.round(((xp - floor) / (ceiling - floor)) * 100), xpToNext: ceiling - xp,
    streak, today: dailyGoals(today, input.activity, brain), todayMinutes: perDay[today] || 0, weekMinutes,
    masteredCards, levelsCleared, verifiedCount, badges, earnedBadges: badges.filter(b => b.isEarned),
    totalMinutes: Object.values(perDay).reduce((a, b) => a + b, 0), perDay, activeDays: days,
  };
}
export type Game = ReturnType<typeof computeGame>;
