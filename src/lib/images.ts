"use client";

import { useEffect, useState } from "react";
import { cloudCall, cloudUrl, onBeforeSync } from "./cloud";
import { IMPORTED_ACTIVITY, KEYS, uid } from "./data";
import type { Activity } from "./data";
import { readStore, writeStore } from "./store";

// Screenshots live apart from the diary, so the diary stays small however many there are:
//  - on this device in IndexedDB (hundreds of MB, where localStorage has about 5 MB for everything),
//  - in the cloud in their own tab of the private data spreadsheet, uploaded once (apps-script/Code.js),
//  - and in the diary entry only as a short reference, "img:<id>".
// Other devices fetch a screenshot the first time they show it and keep a copy.
// Old entries that still hold the picture itself ("data:image/…") keep working, and are moved out on start-up.

const PREFIX = "img:";
const DB = "future-world-images", STORE = "images";
export const isImageRef = (value?: string) => Boolean(value?.startsWith(PREFIX));

let dbPromise: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("no IndexedDB")); return; }
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}
async function idb<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const store = (await db()).transaction(STORE, mode).objectStore(STORE);
  return new Promise((resolve, reject) => { const req = run(store); req.onsuccess = () => resolve(req.result as T); req.onerror = () => reject(req.error); });
}
const getLocal = (id: string) => idb<string | undefined>("readonly", s => s.get(id)).catch(() => undefined);
const putLocal = (id: string, data: string) => idb<unknown>("readwrite", s => s.put(data, id));
/** How many screenshots this device keeps. */
export const localImageCount = () => idb<number>("readonly", s => s.count()).catch(() => 0);

// Screenshots saved here that the cloud doesn't have yet (per device, never synced).
const pending = (): string[] => { try { return JSON.parse(localStorage.getItem(KEYS.imagesPending) || "[]"); } catch { return []; } };
const setPending = (ids: string[]) => { try { localStorage.setItem(KEYS.imagesPending, JSON.stringify(ids)); } catch { /* full: retried next start */ } };
export const pendingImageCount = () => pending().length;

// An older Cloud save script (before screenshots got their own tab) answers "unknown-action". Then pictures go back
// inside the diary entries, the way they always used to, and the app tries again a day later (after the script is updated).
const OLD_SERVER_RETRY_MS = 24 * 60 * 60 * 1000;
const serverIsOld = () => { try { return Date.now() - Number(localStorage.getItem(KEYS.imagesOldServer) || 0) < OLD_SERVER_RETRY_MS; } catch { return false; } };
async function putBackInline(ids: string[]) {
  try { localStorage.setItem(KEYS.imagesOldServer, String(Date.now())); } catch { /* ignore */ }
  const inline: Record<string, string> = {};
  for (const id of ids) { const data = await getLocal(id); if (data) inline[PREFIX + id] = data; }
  const activity = readStore<Activity[]>(KEYS.activity, IMPORTED_ACTIVITY);
  if (activity.some(a => a.attachment && inline[a.attachment])) writeStore(KEYS.activity, activity.map(a => a.attachment && inline[a.attachment] ? { ...a, attachment: inline[a.attachment] } : a));
}

/**
 * Keeps a screenshot (a data URL from fileToCompressedDataUrl) and returns the reference to store in the entry.
 * Without IndexedDB (some private windows) it returns the picture itself, the way the app always used to.
 */
export async function storeImage(dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith("data:image/") || (cloudUrl() && serverIsOld())) return dataUrl;
  const id = `img_${uid().replace(/[^A-Za-z0-9_-]/g, "")}`;
  try { await putLocal(id, dataUrl); } catch { return dataUrl; }
  setPending([...pending(), id]);
  return PREFIX + id;
}

/** Uploads the screenshots the cloud doesn't have yet. Runs before every sync. */
async function uploadPending(url: string) {
  for (const id of pending()) {
    if (!pending().includes(id)) continue;
    const data = await getLocal(id);
    // A picture that can't be sent (lost, or refused by the server) is dropped from the queue rather than retried forever.
    if (data) {
      try { await cloudCall(url, { action: "putImage", id, data }); }
      catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message === "unknown-action") { const all = pending(); await putBackInline(all); setPending(pending().filter(x => !all.includes(x))); return; }
        if (!["bad-image-id", "not-an-image", "image-too-big"].includes(message)) throw error; // offline: try again later
      }
    }
    setPending(pending().filter(x => x !== id));
  }
}
if (typeof window !== "undefined") onBeforeSync(uploadPending);

const memory = new Map<string, string>();
/** The picture for an attachment: a data URL, or "" while it isn't available (yet). */
export async function loadImage(ref: string): Promise<string> {
  if (!isImageRef(ref)) return ref;
  const id = ref.slice(PREFIX.length);
  if (memory.has(id)) return memory.get(id)!;
  let data = await getLocal(id);
  const url = cloudUrl();
  if (!data && url) {
    try {
      data = (await cloudCall<{ data: string }>(url, { action: "getImage", id })).data;
      await putLocal(id, data).catch(() => undefined);
    } catch { data = undefined; }
  }
  if (data) memory.set(id, data);
  return data ?? "";
}

/** A screenshot for showing: `src` is "" while loading or when this device can't get it (yet). Retries every 30 s. */
export function useImage(ref?: string) {
  const [state, setState] = useState<{ ref?: string; src: string; done: boolean }>({ src: "", done: false });
  useEffect(() => {
    if (!ref) return;
    let alive = true, timer: number | undefined;
    const tryLoad = async () => {
      const src = await loadImage(ref);
      if (!alive) return;
      setState({ ref, src, done: true });
      if (!src) timer = window.setTimeout(tryLoad, 30_000);
    };
    tryLoad();
    return () => { alive = false; window.clearTimeout(timer); };
  }, [ref]);
  return state.ref === ref ? state : { ref, src: isImageRef(ref) ? "" : ref ?? "", done: !isImageRef(ref) };
}

/** Moves pictures still stored inside diary entries out to the screenshot store. Safe to run on every start. */
export async function moveInlineImages() {
  if (cloudUrl() && serverIsOld()) return 0;
  const activity = readStore<Activity[]>(KEYS.activity, IMPORTED_ACTIVITY);
  const inline = activity.filter(a => a.attachment?.startsWith("data:image/"));
  if (!inline.length) return 0;
  const moved: Record<string, string> = {};
  for (const a of inline) { const ref = await storeImage(a.attachment!); if (isImageRef(ref)) moved[a.id] = ref; }
  if (!Object.keys(moved).length) return 0;
  // Read again: the diary may have changed while the pictures were being saved.
  const latest = readStore<Activity[]>(KEYS.activity, IMPORTED_ACTIVITY);
  writeStore(KEYS.activity, latest.map(a => moved[a.id] && a.attachment?.startsWith("data:image/") ? { ...a, attachment: moved[a.id] } : a));
  return Object.keys(moved).length;
}

/** Every screenshot this device keeps, by id (for a backup file). */
export async function allLocalImages(): Promise<Record<string, string>> {
  try {
    const store = (await db()).transaction(STORE, "readonly").objectStore(STORE);
    const [keys, values] = await Promise.all([
      new Promise<IDBValidKey[]>((resolve, reject) => { const r = store.getAllKeys(); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); }),
      new Promise<string[]>((resolve, reject) => { const r = store.getAll(); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); }),
    ]);
    return Object.fromEntries(keys.map((k, i) => [String(k), values[i]]));
  } catch { return {}; }
}
