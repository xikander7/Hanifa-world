import sheetSeed from "@/data/sheetSeed.json";
import { EMPTY_IDS, IMPORTED_ACTIVITY, KEYS } from "./data";
import type { Activity } from "./data";
import { readStore, writeStore } from "./store";

/**
 * Adds Hanifa's entries from the Google Sheet that ship with the app (see src/data/sheetSeed.json).
 * Each seeded id is remembered, so an entry she deletes doesn't keep coming back.
 */
export function seedSheetEntries() {
  const seeded = readStore<string[]>(KEYS.sheetSeeded, EMPTY_IDS);
  const fresh = (sheetSeed as Activity[]).filter(entry => !seeded.includes(entry.id));
  if (!fresh.length) return;
  const current = readStore<Activity[]>(KEYS.activity, IMPORTED_ACTIVITY);
  const have = new Set(current.map(a => a.id));
  writeStore<Activity[]>(KEYS.activity, [...current, ...fresh.filter(entry => !have.has(entry.id))]);
  writeStore<string[]>(KEYS.sheetSeeded, [...seeded, ...fresh.map(entry => entry.id)]);
}
