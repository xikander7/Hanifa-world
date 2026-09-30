"use client";

import { mergeSheetActivity, parseCsv, parseTimeTracking, parseWeekly, sheetCsvUrl, SYNCED_TABS } from "@/domain/sheetSync";
import type { MergeResult } from "@/domain/sheetSync";
import { EMPTY_IDS, IMPORTED_ACTIVITY, KEYS, SKILLS, WORKING_SHEET_ID } from "./data";
import type { Activity } from "./data";
import { readStore, writeStore } from "./store";

/** Don't re-read the sheet on every page load; a few minutes old is fresh enough. */
export const AUTO_SYNC_EVERY_MS = 5 * 60_000;

export type LiveSyncResult = MergeResult & { entries: number; skipped: string[] };

async function fetchTab(tab: string) {
  const response = await fetch(sheetCsvUrl(WORKING_SHEET_ID, tab), { cache: "no-store" });
  if (!response.ok) throw new Error(`The sheet answered ${response.status} for "${tab}"`);
  const text = await response.text();
  // A sheet that isn't shared returns Google's sign-in page instead of CSV.
  if (/^\s*<(!doctype|html)/i.test(text)) throw new Error("The sheet isn't shared with “Anyone with the link”");
  return parseCsv(text);
}

/**
 * Reads the Weekly Learning Updates and Time Tracking Daily pages straight from the live Google Sheet and merges them
 * into the journal. Safe to repeat: entries have stable ids, and comments written in the app are kept.
 */
export async function syncFromLiveSheet(): Promise<LiveSyncResult> {
  const topics = SKILLS.map(s => s.topic);
  const [weeklyRows, timeRows] = await Promise.all([fetchTab(SYNCED_TABS.weekly), fetchTab(SYNCED_TABS.time)]);
  const weekly = parseWeekly(weeklyRows, topics), time = parseTimeTracking(timeRows, topics);
  const incoming = [...weekly.entries, ...time.entries];
  const current = readStore<Activity[]>(KEYS.activity, IMPORTED_ACTIVITY);
  const merge = mergeSheetActivity(current, incoming, ["sheet-weekly-", "sheet-time-"]);
  if (merge.added + merge.updated + merge.removed > 0 && !writeStore(KEYS.activity, merge.merged)) throw new Error("This browser's storage is full");
  // Remember the entries shipped in sheetSeed.json as handled, so they aren't added back after the sheet drops them.
  writeStore(KEYS.sheetSeeded, [...new Set([...readStore<string[]>(KEYS.sheetSeeded, EMPTY_IDS), ...incoming.map(e => e.id)])]);
  writeStore(KEYS.lastSheetSync, new Date().toISOString());
  return { ...merge, entries: incoming.length, skipped: [...weekly.skipped, ...time.skipped].filter(s => !/sample week/.test(s)) };
}

export const syncIsDue = () => {
  const last = readStore<string>(KEYS.lastSheetSync, "");
  return !last || Date.now() - new Date(last).getTime() > AUTO_SYNC_EVERY_MS;
};
