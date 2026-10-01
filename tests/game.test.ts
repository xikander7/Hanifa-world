import { describe, expect, it } from "vitest";
import { computeGame, levelFromXp, rankForLevel, streakInfo, xpForLevel } from "@/lib/game";
import { EMPTY_BRAIN, EMPTY_ROADMAP, IMPORTED_ACTIVITY, type Activity } from "@/lib/data";

const entry = (date: string, minutes: number, did = "worked on it"): Activity => ({
  id: `a-${date}-${minutes}`, date, kind: "Time log", topic: "Python", minutes, did, practiced: "", feeling: "", blocker: "", proof: "",
});
const base = { activity: [] as Activity[], brain: EMPTY_BRAIN, quests: [], roadmap: EMPTY_ROADMAP, skills: {}, today: "2026-10-10" };

describe("levels", () => {
  it("climbs on a smooth curve", () => {
    expect([0, 49, 50, 199, 200, 450].map(levelFromXp)).toEqual([1, 1, 2, 2, 3, 4]);
    expect(xpForLevel(3)).toBe(200);
    expect(rankForLevel(1).title).toBe("Stargazer");
    expect(rankForLevel(12).title).toBe("Legend");
  });
});

describe("streaks", () => {
  it("counts consecutive days and keeps today's streak alive until midnight", () => {
    const days = new Set(["2026-10-07", "2026-10-08", "2026-10-09"]);
    expect(streakInfo(days, "2026-10-10")).toMatchObject({ current: 3, aliveToday: false });
    expect(streakInfo(new Set([...days, "2026-10-10"]), "2026-10-10")).toMatchObject({ current: 4, aliveToday: true });
  });
  it("resets after a missed day but remembers the best run", () => {
    const days = new Set(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-09"]);
    expect(streakInfo(days, "2026-10-10")).toMatchObject({ current: 1, best: 3 });
  });
});

describe("xp", () => {
  it("never counts the workbook's sample week", () => {
    expect(computeGame({ ...base, activity: IMPORTED_ACTIVITY }).xp).toBe(0);
  });
  it("caps focus XP per day and limits journal XP", () => {
    const game = computeGame({ ...base, activity: [entry("2026-10-10", 600), entry("2026-10-10", 10), entry("2026-10-10", 10)] });
    expect(game.xp).toBe(180 + 30);
  });
  it("only rewards a quiz's best score so retaking can't farm XP", () => {
    const brain = { ...EMPTY_BRAIN, quiz: { "1": { best: 3, total: 4, attempts: 9, last: "2026-10-10" } } };
    expect(computeGame({ ...base, brain }).xp).toBe(30);
  });
  it("pays more per right answer on harder quizzes", () => {
    const result = (best: number, total: number) => ({ best, total, attempts: 1, last: "2026-10-10" });
    const brain = { ...EMPTY_BRAIN, quiz: { "1": result(4, 4), "1:medium": result(5, 6), "1:hard": result(3, 6) } };
    expect(computeGame({ ...base, brain }).xp).toBe(4 * 10 + 5 * 15 + 3 * 20);
  });
  it("awards the Medium and Hard quiz badges only for a perfect score on that tier", () => {
    const result = (best: number, total: number) => ({ best, total, attempts: 1, last: "2026-10-10" });
    const ids = (quiz: Record<string, ReturnType<typeof result>>) => computeGame({ ...base, brain: { ...EMPTY_BRAIN, quiz } }).earnedBadges.map(b => b.id);
    expect(ids({ "2:medium": result(6, 6) })).toContain("heating-up");
    expect(ids({ "2:medium": result(6, 6) })).not.toContain("diamond-mind");
    expect(ids({ "2:hard": result(5, 6) })).not.toContain("diamond-mind");
    expect(ids({ "2:hard": result(6, 6) })).toContain("diamond-mind");
  });
  it("awards a perfect-day bonus when all three daily goals are done", () => {
    const brain = { ...EMPTY_BRAIN, days: ["2026-10-10"], daily: { "2026-10-10": { score: 3, total: 3 } } };
    const game = computeGame({ ...base, brain, activity: [entry("2026-10-10", 30)] });
    expect(game.today.perfect).toBe(true);
    expect(game.xp).toBe(30 + 15 + 30 + 50);
  });
  it("unlocks badges from real activity", () => {
    const game = computeGame({ ...base, activity: [entry("2026-10-08", 20), entry("2026-10-09", 20), entry("2026-10-10", 20)] });
    const ids = game.earnedBadges.map(b => b.id);
    expect(ids).toContain("first-spark");
    expect(ids).toContain("streak-3");
    expect(ids).not.toContain("streak-7");
  });
});
