"use client";

import { useCallback } from "react";
import { IMPORTED_ACTIVITY, KEYS, NO_TIMER, localDate, uid } from "./data";
import type { Activity, FocusTimer } from "./data";
import { useLocalStore, writeStore, readStore } from "./store";

export function useFocusTimer() {
  const [timer, setTimer] = useLocalStore<FocusTimer>(KEYS.focus, NO_TIMER);
  const start = useCallback((minutes: number, topic: string) => { const now = Date.now(); setTimer({ startedAt: now, endsAt: now + minutes * 60_000, minutes, topic }); }, [setTimer]);
  return { timer, start };
}

/** Saves a finished (or ended-early) focus session to the journal and clears the timer. Returns minutes logged. */
export function finishFocus(minutesOverride?: number): number {
  const timer = readStore<FocusTimer>(KEYS.focus, NO_TIMER);
  if (!timer) return 0;
  const elapsed = Math.round((Math.min(Date.now(), timer.endsAt) - timer.startedAt) / 60_000);
  const minutes = Math.max(0, minutesOverride ?? Math.min(timer.minutes, elapsed));
  writeStore<FocusTimer>(KEYS.focus, null);
  if (minutes < 1) return 0;
  const entry: Activity = {
    id: uid(), date: localDate(), kind: "Time log", topic: timer.topic, minutes, did: `Focus session on ${timer.topic}`,
    practiced: "", feeling: "✨", blocker: "", proof: "", source: "focus",
  };
  writeStore<Activity[]>(KEYS.activity, [...readStore<Activity[]>(KEYS.activity, IMPORTED_ACTIVITY), entry]);
  return minutes;
}
