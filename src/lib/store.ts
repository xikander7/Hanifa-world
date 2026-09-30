"use client";

import { useCallback, useSyncExternalStore } from "react";

// A tiny localStorage-backed store. Every component that reads the same key
// re-renders when any of them writes (same tab via our own event, other tabs via "storage").

const listeners = new Map<string, Set<() => void>>();
const parsed = new Map<string, { raw: string | null; initial: unknown; value: unknown }>();

const safeGet = (key: string) => { try { return window.localStorage.getItem(key); } catch { return null; } };
/** Fired on window when a save fails (usually storage is full of screenshots), so the app can say so instead of losing work quietly. */
export const STORE_ERROR_EVENT = "future-world-store-error";
const safeSet = (key: string, value: string) => {
  try { window.localStorage.setItem(key, value); return true; }
  catch { window.dispatchEvent(new CustomEvent(STORE_ERROR_EVENT, { detail: key })); return false; }
};

function snapshot<T>(key: string, initial: T): T {
  const raw = safeGet(key);
  const hit = parsed.get(key);
  if (hit && hit.raw === raw && (raw !== null || hit.initial === initial)) return hit.value as T;
  let value = initial;
  if (raw !== null) { try { value = JSON.parse(raw) as T; } catch { value = initial; } }
  parsed.set(key, { raw, initial, value });
  return value;
}

function subscribe(key: string, callback: () => void) {
  let set = listeners.get(key);
  if (!set) { set = new Set(); listeners.set(key, set); }
  set.add(callback);
  const onStorage = (event: StorageEvent) => { if (event.key === key || event.key === null) callback(); };
  window.addEventListener("storage", onStorage);
  return () => { set?.delete(callback); window.removeEventListener("storage", onStorage); };
}

type WriteHook = (key: string, previousRaw: string | null) => void;
const writeHooks = new Set<WriteHook>();
/** Cloud save listens here to learn which keys changed on this device. */
export function onLocalWrite(hook: WriteHook) { writeHooks.add(hook); return () => { writeHooks.delete(hook); }; }

/** Returns false if the browser refused to save. `fromCloud` writes (changes from another device) skip the write hooks. */
export function writeStore<T>(key: string, value: T, options?: { fromCloud?: boolean }): boolean {
  if (!options?.fromCloud && writeHooks.size) { const previous = safeGet(key); writeHooks.forEach(hook => hook(key, previous)); }
  const saved = safeSet(key, JSON.stringify(value));
  listeners.get(key)?.forEach(callback => callback());
  return saved;
}

export function readStore<T>(key: string, initial: T): T {
  return typeof window === "undefined" ? initial : snapshot(key, initial);
}

/** `initial` must be a stable reference (module constant) so snapshots stay referentially equal. */
export function useLocalStore<T>(key: string, initial: T): [T, (next: T | ((previous: T) => T)) => void] {
  const value = useSyncExternalStore(
    useCallback(callback => subscribe(key, callback), [key]),
    () => snapshot(key, initial),
    () => initial,
  );
  const set = useCallback((next: T | ((previous: T) => T)) => {
    const current = snapshot(key, initial);
    writeStore(key, typeof next === "function" ? (next as (previous: T) => T)(current) : next);
  }, [key, initial]);
  return [value, set];
}

const noopSubscribe = () => () => {};
/** false during SSR/hydration, true afterwards. */
export function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
