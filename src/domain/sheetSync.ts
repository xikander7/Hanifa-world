import type { Activity, Comment } from "@/lib/data";

// Turns rows from Hanifa's Google Sheet ("Weekly Learning Updates" and "Time Tracking Daily") into journal entries.
// Pure functions so they can be tested and re-run safely: every entry gets a stable id, so importing the same
// sheet twice updates entries instead of duplicating them.

export type SheetRows = string[][];
export type SheetKind = "weekly" | "time" | null;
export type ParseResult = { entries: Activity[]; skipped: string[] };

/** Monday of the week the training plan started (the sheet's sample week is 21 to 27 Sept 2026). */
export const TRAINING_START = "2026-09-21";

const norm = (value: unknown) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "");
const clean = (value: unknown) => String(value ?? "").replace(/\r/g, "").trim();
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const isoDate = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
const addDaysIso = (iso: string, days: number) => { const [y, m, d] = iso.split("-").map(Number); return isoDate(y, m - 1, d + days); };

/** The two pages of the Google Sheet that become journal entries, by their tab names. */
export const SYNCED_TABS = { weekly: "Weekly Learning Updates", time: "Time Tracking Daily" } as const;

/** A link-shared Google Sheet serves each tab as CSV (with CORS), so the browser can read it without signing in. */
export const sheetCsvUrl = (sheetId: string, tab: string) =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;

/** RFC 4180 CSV: quoted fields, doubled quotes, and newlines inside quotes. */
export function parseCsv(text: string): SheetRows {
  const rows: SheetRows = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

export function detectSheet(rows: SheetRows): SheetKind {
  const header = (rows[0] ?? []).map(norm).join("|");
  if (header.includes("whatilearned")) return "weekly";
  if (header.includes("whatworkedon")) return "time";
  return null;
}

const findCol = (header: string[], ...needles: string[]) => header.findIndex(h => needles.some(n => h.includes(n)));
const cell = (row: string[], index: number) => (index >= 0 ? clean(row[index]) : "");

/** "week 1" gives the end of week 1. A label with a date range like "21 - 27 Sept 2026" gives the range's end. */
export function dateFromWeekLabel(label: string): string | null {
  const range = label.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+)\.?,?\s+(\d{4})/);
  if (range) {
    const month = MONTHS.indexOf(range[3].slice(0, 3).toLowerCase());
    if (month >= 0) return isoDate(Number(range[4]), month, Number(range[2]));
  }
  const week = label.match(/week\s*(\d+)/i);
  return week ? addDaysIso(TRAINING_START, 7 * (Number(week[1]) - 1) + 6) : null;
}

/** Sheet dates are US style (09/19/2026). ISO dates are also accepted. */
export function parseSheetDate(text: string): string | null {
  const t = clean(text);
  const us = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (us) return isoDate(us[3].length === 2 ? 2000 + Number(us[3]) : Number(us[3]), Number(us[1]) - 1, Number(us[2]));
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : null;
}

/** "1.5", "1:30", "90 min" and "2 hrs" all become minutes. */
export function parseMinutes(text: string): number {
  const t = clean(text).toLowerCase();
  if (!t) return 0;
  const clock = t.match(/^(\d+):(\d{1,2})$/);
  if (clock) return Number(clock[1]) * 60 + Number(clock[2]);
  const minutes = t.match(/^(\d+(?:\.\d+)?)\s*(?:m|min|mins|minutes?)$/);
  if (minutes) return Math.round(Number(minutes[1]));
  const hours = t.match(/^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?)?$/);
  return hours ? Math.round(Number(hours[1]) * 60) : 0;
}

const feelingFor = (difficulty: string) => {
  const d = difficulty.toLowerCase();
  if (!d) return "✨";
  if (/hard|difficult|tough/.test(d)) return "😮‍💨";
  if (/medium|confus/.test(d)) return "🤔";
  return "😊";
};

const matchTopic = (text: string, topics: string[]) => {
  const t = text.toLowerCase().trim();
  return topics.find(topic => topic.toLowerCase() === t) ?? topics.find(topic => t.length > 2 && t.includes(topic.toLowerCase()));
};
const titleCase = (text: string) => text.trim().replace(/\b\w/g, c => c.toUpperCase());

const comment = (id: string, by: Comment["by"], text: string, date: string): Comment => ({ id, by, text, at: `${date}T12:00:00.000Z` });

export function parseWeekly(rows: SheetRows, topics: string[]): ParseResult {
  const header = (rows[0] ?? []).map(norm);
  const col = {
    week: header.findIndex(h => h === "week"), topic: findCol(header, "currenttopic"), progress: findCol(header, "progress"),
    learned: findCol(header, "whatilearned"), practice: findCol(header, "practicecompleted"), proof: findCol(header, "prooflink"),
    difficulty: findCol(header, "difficulty"), blocker: findCol(header, "blocker"), hanifa: findCol(header, "hanifacomments"), review: findCol(header, "review"),
  };
  const entries: Activity[] = [], skipped: string[] = [];
  rows.slice(1).forEach((row, i) => {
    const label = cell(row, col.week), learned = cell(row, col.learned);
    if (!label && !learned) return;
    if (/sample|for your understanding/i.test(label)) { skipped.push(`Row ${i + 2}: sample week`); return; }
    const date = dateFromWeekLabel(label);
    if (!date) { skipped.push(`Row ${i + 2}: couldn't work out a date from "${label}"`); return; }
    const weekNumber = label.match(/week\s*(\d+)/i)?.[1];
    const id = `sheet-weekly-${weekNumber ?? norm(label).slice(0, 40)}`;
    const topicText = cell(row, col.topic);
    const progress = cell(row, col.progress), practice = cell(row, col.practice);
    const hanifa = cell(row, col.hanifa), review = cell(row, col.review);
    const comments: Comment[] = [];
    if (hanifa) comments.push(comment(`${id}-hanifa`, "hanifa", hanifa, date));
    if (review) comments.push(comment(`${id}-mentor`, "mentor", review, date));
    entries.push({
      id, date, sourceWeek: label, kind: "Weekly reflection", source: "sheet",
      topic: matchTopic(topicText, topics) ?? (titleCase(topicText) || "Weekly update"), minutes: 0,
      did: learned, practiced: [practice, progress && `Progress: ${progress}`].filter(Boolean).join(" · "),
      feeling: feelingFor(cell(row, col.difficulty)), blocker: cell(row, col.blocker), proof: cell(row, col.proof), comments,
    });
  });
  return { entries, skipped };
}

export function parseTimeTracking(rows: SheetRows, topics: string[]): ParseResult {
  const header = (rows[0] ?? []).map(norm);
  const col = { date: findCol(header, "date"), hours: findCol(header, "hrs", "hours"), what: findCol(header, "whatworkedon"), hanifa: findCol(header, "hanifacomments"), mentor: findCol(header, "sikandercomments", "mentorcomments") };
  const entries: Activity[] = [], skipped: string[] = [];
  rows.slice(1).forEach((row, i) => {
    const minutes = parseMinutes(cell(row, col.hours)), what = cell(row, col.what);
    const hanifa = cell(row, col.hanifa), mentor = cell(row, col.mentor);
    if (!minutes && !what && !hanifa && !mentor) return; // an empty day in the sheet
    const date = parseSheetDate(cell(row, col.date));
    if (!date) { skipped.push(`Row ${i + 2}: couldn't read the date "${cell(row, col.date)}"`); return; }
    const id = `sheet-time-${date}`;
    const comments: Comment[] = [];
    if (hanifa) comments.push(comment(`${id}-hanifa`, "hanifa", hanifa, date));
    if (mentor) comments.push(comment(`${id}-mentor`, "mentor", mentor, date));
    entries.push({
      id, date, kind: "Time log", source: "sheet", topic: topics.find(t => what.toLowerCase().includes(t.toLowerCase())) ?? "General study",
      minutes, did: what, practiced: "", feeling: "✨", blocker: "", proof: "", comments,
    });
  });
  return { entries, skipped };
}

export type MergeResult = { merged: Activity[]; added: number; updated: number; unchanged: number; removed: number };

/**
 * Adds new entries and refreshes ones with the same id. Comments written in the app are kept.
 * `prunePrefixes` names the sheet pages that were read in full: an entry from one of those pages that is no longer
 * in the sheet (a row was deleted or its date fixed) is removed, unless someone commented on it in the app.
 */
export function mergeSheetActivity(existing: Activity[], incoming: Activity[], prunePrefixes: string[] = []): MergeResult {
  const incomingIds = new Set(incoming.map(a => a.id));
  const hasAppComments = (a: Activity) => (a.comments ?? []).some(c => !c.id.startsWith(`${a.id}-`));
  const stale = (a: Activity) => a.source === "sheet" && !incomingIds.has(a.id) && prunePrefixes.some(p => a.id.startsWith(p)) && !hasAppComments(a);
  const removed = existing.filter(stale).length;
  const byId = new Map(existing.filter(a => !stale(a)).map(a => [a.id, a]));
  let added = 0, updated = 0, unchanged = 0;
  for (const entry of incoming) {
    const old = byId.get(entry.id);
    if (!old) { byId.set(entry.id, entry); added += 1; continue; }
    const incomingIds = new Set((entry.comments ?? []).map(c => c.id));
    const localComments = (old.comments ?? []).filter(c => !incomingIds.has(c.id));
    const next: Activity = { ...old, ...entry, attachment: old.attachment, comments: [...(entry.comments ?? []), ...localComments] };
    if (JSON.stringify(next) === JSON.stringify(old)) unchanged += 1; else { byId.set(entry.id, next); updated += 1; }
  }
  const order = new Map(existing.map((a, i) => [a.id, i]));
  const merged = [...byId.values()].sort((a, b) => (order.get(a.id) ?? 1e9) - (order.get(b.id) ?? 1e9));
  return { merged, added, updated, unchanged, removed };
}
