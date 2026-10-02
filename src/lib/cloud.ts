"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_META, syncOnce } from "@/domain/cloudSync";
import type { CloudMeta, PushResult, Remote, Transport } from "@/domain/cloudSync";
import { KEYS, SYNCED_KEYS } from "./data";
import { onLocalWrite, writeStore } from "./store";

// Cloud save in the browser: works out when to sync, talks to the Apps Script web app, and reports status.
// The merge rules live in src/domain/cloudSync.ts; the server is apps-script/Code.js.

const PUSH_DELAY_MS = 800;
// Check for changes from other devices every 15 seconds while the app is on screen (nothing runs in a hidden tab).
const POLL_MS = 15_000;
/** Only Google Apps Script web apps are accepted as a cloud address (also from a ?cloud= link). */
export const isCloudUrl = (url: string) => /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url.trim());

// ---------- raw localStorage (these keys are per device, and must not trigger the write hooks or save warnings) ----------
const rawGet = (key: string) => { try { return window.localStorage.getItem(key); } catch { return null; } };
const rawSet = (key: string, value: string | null) => { try { if (value === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, value); } catch { /* full or blocked */ } };
const parse = (raw: string | null): unknown => { if (raw === null) return undefined; try { return JSON.parse(raw); } catch { return undefined; } };

export const cloudUrl = () => {
  const built = process.env.NEXT_PUBLIC_CLOUD_URL ?? "";
  if (isCloudUrl(built)) return built.trim();
  const saved = parse(rawGet(KEYS.cloudUrl));
  return typeof saved === "string" && isCloudUrl(saved) ? saved : "";
};
export const cloudUrlIsBuiltIn = () => isCloudUrl(process.env.NEXT_PUBLIC_CLOUD_URL ?? "");
export const setCloudUrl = (url: string) => { rawSet(KEYS.cloudUrl, url ? JSON.stringify(url.trim()) : null); restart(); };

const loadMeta = (): CloudMeta => ({ ...EMPTY_META, ...(parse(rawGet(KEYS.cloudMeta)) as CloudMeta | undefined) });
const saveMeta = (meta: CloudMeta) => {
  try { window.localStorage.setItem(KEYS.cloudMeta, JSON.stringify(meta)); }
  // No room for the "base" copies: drop them. Sync still works, a conflict just merges by keeping both sides.
  catch { rawSet(KEYS.cloudMeta, JSON.stringify({ ...meta, base: {} })); }
};
export const mentorToken = () => rawGet(KEYS.mentorToken) ?? "";
const setMentorToken = (token: string) => rawSet(KEYS.mentorToken, token || null);

// ---------- status, for the little cloud in the top bar ----------
export type CloudStatus = { state: "off" | "syncing" | "synced" | "offline" | "error"; at?: number; message?: string; refused?: boolean };
let status: CloudStatus = { state: "off" };
const statusListeners = new Set<() => void>();
const setStatus = (next: CloudStatus) => { status = next; statusListeners.forEach(fn => fn()); };
const OFF: CloudStatus = { state: "off" };
export function useCloudStatus() {
  return useSyncExternalStore(fn => { statusListeners.add(fn); return () => { statusListeners.delete(fn); }; }, () => status, () => OFF);
}

// ---------- talking to the web app ----------
export async function cloudCall<T>(url: string, body: Record<string, unknown>): Promise<T> {
  // text/plain keeps this a "simple" request, which Apps Script answers without a CORS preflight.
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body), redirect: "follow" });
  if (!response.ok) throw new Error(`Cloud save answered ${response.status}`);
  const result = await response.json() as T & { ok: boolean; error?: string };
  if (!result.ok) throw new Error(result.error || "Cloud save said no");
  return result;
}

const transport = (url: string): Transport => ({
  pull: async revs => {
    const response = await fetch(`${url}?action=pull&revs=${encodeURIComponent(JSON.stringify(revs))}`, { redirect: "follow", cache: "no-store" });
    if (!response.ok) throw new Error(`Cloud save answered ${response.status}`);
    const result = await response.json() as { ok: boolean; error?: string; keys: Record<string, Remote> };
    if (!result.ok) throw new Error(result.error || "Cloud save said no");
    return result.keys;
  },
  push: async changes => (await cloudCall<{ results: Record<string, PushResult> }>(url, { action: "push", changes, token: mentorToken() })).results,
});

export async function pingCloud(url: string) { await cloudCall(url, { action: "ping" }); }

/** Asks the web app to check the PIN. Returns an error message, or "" when signed in. */
export async function mentorSignIn(pin: string): Promise<string> {
  const url = cloudUrl();
  if (!url) return "";
  try { setMentorToken((await cloudCall<{ token: string }>(url, { action: "login", pin })).token); return ""; }
  catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "wrong-pin") return "That code didn’t work. Try again.";
    if (message === "too-many-tries") return "Too many tries. Wait 15 minutes, then try again.";
    return "Couldn't reach Cloud save to check the code. Check the internet and try again.";
  }
}
/** Sends any unsaved Mentor changes first, so they aren't refused once the token is gone. */
export async function mentorSignOut() { if (cloudUrl()) await syncNow().catch(() => undefined); setMentorToken(""); }

// ---------- the sync loop ----------
/** Work to do with the cloud before each sync (screenshots go up first, so the entries that show them never arrive before them). */
const beforeSync = new Set<(url: string) => Promise<void>>();
export function onBeforeSync(fn: (url: string) => Promise<void>) { beforeSync.add(fn); return () => { beforeSync.delete(fn); }; }

let running: Promise<void> | null = null, again = false;
let pushTimer: number | undefined;
/** Keys saved on this device while a sync was on the wire; they go out in the next round. */
const touchedDuringSync = new Set<string>();

async function runOnce() {
  const url = cloudUrl();
  if (!url) { setStatus(OFF); return; }
  setStatus({ ...status, state: "syncing" });
  try {
    const local = {
      read: (key: string) => parse(rawGet(key)),
      write: (key: string, value: unknown) => { if (value === undefined || value === null) return; writeStore(key, value, { fromCloud: true }); },
    };
    for (const fn of beforeSync) await fn(url).catch(() => undefined); // a stuck screenshot must never hold up the diary
    touchedDuringSync.clear();
    const outcome = await syncOnce(SYNCED_KEYS, local, loadMeta(), transport(url));
    touchedDuringSync.forEach(key => { outcome.meta.dirty[key] = true; again = true; });
    saveMeta(outcome.meta);
    setStatus({ state: "synced", at: Date.now(), refused: outcome.refused.length > 0, message: outcome.refused.length ? "Some changes need Mentor sign-in and were undone." : undefined });
  } catch (error) {
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    setStatus({ state: offline ? "offline" : "error", at: status.at, message: error instanceof Error ? error.message : String(error) });
  }
}

/** Runs a sync now (or right after the one in progress). */
export function syncNow(): Promise<void> {
  if (running) { again = true; return running; }
  running = (async () => {
    do { again = false; await runOnce(); } while (again);
  })().finally(() => { running = null; });
  return running;
}

const schedulePush = () => { window.clearTimeout(pushTimer); pushTimer = window.setTimeout(() => { syncNow(); }, PUSH_DELAY_MS); };

let stop: (() => void) | null = null;
let restart = () => {};

/** Starts Cloud save for this device (once). Safe to call when no cloud address is set: it just stays off. */
export function startCloud() {
  if (stop) return stop;
  const url = cloudUrl();
  if (!url) { setStatus(OFF); restart = () => { stop = null; startCloud(); }; return () => {}; }

  // First time this device meets this cloud: everything already here is offered to it, merged with what's there.
  const meta = loadMeta();
  if (meta.connected !== url) {
    const dirty: CloudMeta["dirty"] = {};
    SYNCED_KEYS.forEach(key => { if (rawGet(key) !== null) dirty[key] = true; });
    saveMeta({ revs: {}, dirty, base: {}, connected: url });
  }

  const offWrite = onLocalWrite((key, previousRaw) => {
    if (!SYNCED_KEYS.includes(key)) return;
    if (running) touchedDuringSync.add(key);
    const current = loadMeta();
    if (!current.dirty[key]) {
      current.dirty[key] = true;
      const previous = parse(previousRaw);
      if (previous !== undefined) current.base[key] = previous;
      saveMeta(current);
    }
    schedulePush();
  });
  const onVisible = () => { if (document.visibilityState === "visible") syncNow(); };
  const timer = window.setInterval(() => { if (document.visibilityState === "visible") syncNow(); }, POLL_MS);
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", onVisible);
  syncNow();

  stop = () => { offWrite(); window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); window.removeEventListener("online", onVisible); stop = null; };
  restart = () => { stop?.(); startCloud(); };
  return stop;
}
