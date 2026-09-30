import { describe, expect, it } from "vitest";
import seed from "@/data/seed.json";
import sheetSeed from "@/data/sheetSeed.json";
import { dateFromWeekLabel, detectSheet, mergeSheetActivity, parseCsv, parseMinutes, parseSheetDate, parseTimeTracking, parseWeekly, sheetCsvUrl } from "@/domain/sheetSync";
import { feelingIcon } from "@/lib/data";
import type { Activity } from "@/lib/data";

const topics = seed.skills.map(s => s.topic);
const WEEKLY_HEADER = ["Week", "Current Topic", "Progress %", "What I Learned", "Practice Completed", "Proof / Link", "Difficulty for you", "Hanifa - Blocker / Questions", "Hanifa - comments", "Sikander Review"];
const TIME_HEADER = ["Date", "Day", "Hrs", "What Worked On", "Hanifa Comments", "Sikander Comments"];

describe("reading the sheet's formats", () => {
  it("turns hours in any common format into minutes", () => {
    expect(["1.5", "1:30", "90 min", "1.5 hrs", "2h", "", "abc"].map(parseMinutes)).toEqual([90, 90, 90, 90, 120, 0, 0]);
  });
  it("reads US-style and ISO dates", () => {
    expect(parseSheetDate("09/19/2026")).toBe("2026-09-19");
    expect(parseSheetDate("9/9/26")).toBe("2026-09-09");
    expect(parseSheetDate("2026-10-01")).toBe("2026-10-01");
    expect(parseSheetDate("someday")).toBeNull();
  });
  it("dates a week label from its range, or from the training start", () => {
    expect(dateFromWeekLabel("Sample Week 1  (21 - 27 Sept 2026)")).toBe("2026-09-27");
    expect(dateFromWeekLabel("week 1")).toBe("2026-09-27");
    expect(dateFromWeekLabel("Week 3")).toBe("2026-10-11");
    expect(dateFromWeekLabel("whenever")).toBeNull();
  });
  it("tells the two sheets apart by their headers", () => {
    expect(detectSheet([WEEKLY_HEADER])).toBe("weekly");
    expect(detectSheet([TIME_HEADER])).toBe("time");
    expect(detectSheet([["Rank", "Country"]])).toBeNull();
  });
});

describe("weekly updates", () => {
  const rows = [WEEKLY_HEADER,
    ["Sample Week 1 (21 - 27 Sept 2026) - For your understanding only", "Computer Basics", "70%", "RAM, CPU", "x", "", "Easy", "", "", "Good"],
    ["week 1", "computer basics ", "70%", "Hardware and software", "watched videos", "sent on whatsapp", "easy-medium", "confused on Linux", "Linux was hard", "Good work. Let's talk on the weekend."],
    ["", "", "", "", "", "", "", "", "", ""]];
  const { entries, skipped } = parseWeekly(rows, topics);

  it("skips the sample week and empty rows, and keeps the real one", () => {
    expect(entries).toHaveLength(1);
    expect(skipped).toEqual(["Row 2: sample week"]);
  });
  it("maps every column, including both comments as chat messages", () => {
    expect(entries[0]).toMatchObject({ id: "sheet-weekly-1", date: "2026-09-27", kind: "Weekly reflection", source: "sheet", topic: "Computer Basics", did: "Hardware and software", blocker: "confused on Linux", proof: "sent on whatsapp", feeling: "🤔" });
    expect(entries[0].practiced).toBe("watched videos · Progress: 70%");
    expect(entries[0].comments?.map(c => [c.by, c.text])).toEqual([["hanifa", "Linux was hard"], ["mentor", "Good work. Let's talk on the weekend."]]);
  });
  it("matches the seed that ships with the app", () => {
    const shipped = (sheetSeed as Activity[])[0];
    expect(shipped.id).toBe("sheet-weekly-1");
    expect(shipped.topic).toBe("Computer Basics");
    expect(shipped.comments?.some(c => c.by === "mentor")).toBe(true);
  });
});

describe("daily time tracking", () => {
  const rows = [TIME_HEADER,
    ["09/19/2026", "Sat", "", "", "", ""],
    ["09/28/2026", "Mon", "1.5", "Python loops video and practice", "Fun!", "Nice, keep going"],
    ["09/29/2026", "Tue", "", "", "", ""],
    ["not a date", "Wed", "1", "Git", "", ""]];
  const { entries, skipped } = parseTimeTracking(rows, topics);

  it("ignores empty days and reports rows it can't read", () => {
    expect(entries).toHaveLength(1);
    expect(skipped).toHaveLength(1);
  });
  it("turns a filled day into a time log with minutes and comments", () => {
    expect(entries[0]).toMatchObject({ id: "sheet-time-2026-09-28", date: "2026-09-28", kind: "Time log", minutes: 90, did: "Python loops video and practice" });
    expect(entries[0].comments).toHaveLength(2);
  });
});

describe("merging into the journal", () => {
  const existing: Activity[] = [{ id: "a", date: "2026-09-01", kind: "Time log", topic: "x", minutes: 5, did: "mine", practiced: "", feeling: "", blocker: "", proof: "" }];
  const incoming = parseTimeTracking([TIME_HEADER, ["09/28/2026", "Mon", "1", "Python", "Fun", "Nice"]], topics).entries;

  it("adds new entries and leaves the rest alone", () => {
    const result = mergeSheetActivity(existing, incoming);
    expect(result).toMatchObject({ added: 1, updated: 0 });
    expect(result.merged.map(a => a.id)).toEqual(["a", "sheet-time-2026-09-28"]);
  });
  it("is safe to run twice, and keeps comments written in the app", () => {
    const first = mergeSheetActivity(existing, incoming).merged;
    const withLocal = first.map(a => a.id === "sheet-time-2026-09-28" ? { ...a, comments: [...(a.comments ?? []), { id: "local", by: "hanifa" as const, text: "thanks!", at: "2026-09-29T00:00:00Z" }] } : a);
    const again = mergeSheetActivity(withLocal, incoming);
    expect(again).toMatchObject({ added: 0, updated: 0, unchanged: 1 });
    expect(again.merged.find(a => a.id === "sheet-time-2026-09-28")?.comments?.some(c => c.id === "local")).toBe(true);
  });
  it("updates an entry when the sheet changes", () => {
    const first = mergeSheetActivity(existing, incoming).merged;
    const edited = parseTimeTracking([TIME_HEADER, ["09/28/2026", "Mon", "2", "Python and Git", "Fun", "Nice"]], topics).entries;
    const again = mergeSheetActivity(first, edited);
    expect(again.updated).toBe(1);
    expect(again.merged.find(a => a.id === "sheet-time-2026-09-28")?.minutes).toBe(120);
  });
});

describe("removing rows that left the sheet", () => {
  const sheetRows = (...rows: string[][]) => parseTimeTracking([TIME_HEADER, ...rows], topics).entries;
  const first = mergeSheetActivity([], sheetRows(["09/28/2026", "Mon", "1", "Python", "", ""], ["09/29/2026", "Tue", "1", "Git", "", ""])).merged;

  it("removes an entry whose row was cleared, when that page was read in full", () => {
    const again = mergeSheetActivity(first, sheetRows(["09/28/2026", "Mon", "1", "Python", "", ""]), ["sheet-time-"]);
    expect(again.removed).toBe(1);
    expect(again.merged.map(a => a.id)).toEqual(["sheet-time-2026-09-28"]);
  });
  it("keeps it without a prune scope, or when someone commented on it in the app", () => {
    expect(mergeSheetActivity(first, [], []).removed).toBe(0);
    const commented = first.map(a => a.id === "sheet-time-2026-09-29" ? { ...a, comments: [{ id: "local", by: "mentor" as const, text: "Nice", at: "2026-09-30T00:00:00Z" }] } : a);
    expect(mergeSheetActivity(commented, [], ["sheet-time-"]).merged.map(a => a.id)).toEqual(["sheet-time-2026-09-29"]);
  });
  it("never touches entries written in the app", () => {
    const mine: Activity = { id: "mine", date: "2026-09-28", kind: "Learning update", topic: "x", minutes: 10, did: "a", practiced: "", feeling: "", blocker: "", proof: "", source: "manual" };
    expect(mergeSheetActivity([mine], [], ["sheet-time-", "sheet-weekly-"]).merged).toEqual([mine]);
  });
});

describe("reading the live sheet as CSV", () => {
  it("handles quotes, commas and line breaks inside cells", () => {
    expect(parseCsv('"Week","What I Learned"\n"week 1","CPU, RAM\nand ""OS"""\r\n"",""')).toEqual([["Week", "What I Learned"], ["week 1", 'CPU, RAM\nand "OS"'], ["", ""]]);
  });
  it("feeds the parsers the same way the downloaded file does", () => {
    const csv = '"Date","Day","Hrs","What Worked On","Hanifa Comments","Sikander Comments"\n"09/28/2026","Mon","1.5","Python loops","",""\n"09/29/2026","Tue","","","",""';
    expect(parseTimeTracking(parseCsv(csv), topics).entries.map(e => [e.id, e.minutes])).toEqual([["sheet-time-2026-09-28", 90]]);
  });
  it("asks Google for one tab by name", () => {
    expect(sheetCsvUrl("abc", "Time Tracking Daily")).toBe("https://docs.google.com/spreadsheets/d/abc/gviz/tq?tqx=out:csv&sheet=Time%20Tracking%20Daily");
  });
});

describe("feeling icons", () => {
  it("keeps whole emojis and hides plain text", () => {
    expect(["😮‍💨", "🤔", "Easy", "", "easy-medium"].map(feelingIcon)).toEqual(["😮‍💨", "🤔", "📝", "📝", "📝"]);
  });
});
