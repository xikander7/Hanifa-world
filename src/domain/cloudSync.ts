// Cloud save: keeps every device's copy of Hanifa's data in step with one copy on the server (a Google Apps Script
// web app, see apps-script/Code.js). Pure functions, so the whole round trip can be tested without a browser.
//
// Each synced key has a revision number on the server. A device remembers the revision it last saw, and for a key it
// changed since then (dirty) it also keeps that last-seen value as the "base". When both sides changed a key, the
// base lets us merge three ways instead of letting one device overwrite the other.

type Json = unknown;
const isObject = (v: Json): v is Record<string, Json> => typeof v === "object" && v !== null && !Array.isArray(v);
const same = (a: Json, b: Json) => JSON.stringify(a) === JSON.stringify(b);
const hasIds = (list: Json[]) => list.length > 0 && list.every(item => isObject(item) && typeof item.id === "string");

/**
 * Three-way merge of JSON values. Changes from both sides survive: lists of `{ id }` items merge item by item (so a
 * new journal entry on one phone and a comment from Xander on another both stay), lists of plain values merge as sets,
 * objects merge key by key, and when both sides changed the same single value, the local one wins.
 * With no base (a device connecting for the first time) it degrades to a union that keeps everything.
 */
export function merge3(base: Json, local: Json, remote: Json): Json {
  if (same(local, remote)) return local;
  if (base !== undefined && same(base, local)) return remote;
  if (base !== undefined && same(base, remote)) return local;

  if (Array.isArray(local) && Array.isArray(remote)) {
    const baseList = Array.isArray(base) ? base : [];
    if ((hasIds(local) || local.length === 0) && (hasIds(remote) || remote.length === 0) && (hasIds(baseList) || baseList.length === 0) && (local.length || remote.length)) {
      const byId = (list: Json[]) => new Map(list.map(item => [(item as { id: string }).id, item]));
      const b = byId(baseList), l = byId(local), r = byId(remote);
      const ids = [...r.keys(), ...[...l.keys()].filter(id => !r.has(id))];
      const out: Json[] = [];
      for (const id of ids) {
        const inBase = b.has(id), lv = l.get(id), rv = r.get(id);
        if (l.has(id) && r.has(id)) out.push(merge3(b.get(id), lv, rv));
        else if (l.has(id)) { if (!(inBase && same(b.get(id), lv))) out.push(lv); } // else: deleted on the server
        else if (!(inBase && same(b.get(id), rv))) out.push(rv); // else: deleted here
      }
      return out;
    }
    if ([...local, ...remote].every(item => !isObject(item) && !Array.isArray(item))) {
      const key = (v: Json) => JSON.stringify(v);
      const baseKeys = new Set(baseList.map(key)), localKeys = new Set(local.map(key)), remoteKeys = new Set(remote.map(key));
      const removed = (k: string) => baseKeys.has(k) && (!localKeys.has(k) || !remoteKeys.has(k));
      const seen = new Set<string>(), out: Json[] = [];
      for (const item of [...remote, ...local]) { const k = key(item); if (!seen.has(k) && !removed(k)) { seen.add(k); out.push(item); } }
      return out;
    }
    return local;
  }

  if (isObject(local) && isObject(remote)) {
    const b = isObject(base) ? base : {};
    const out: Record<string, Json> = {};
    for (const k of new Set([...Object.keys(remote), ...Object.keys(local)])) {
      const inL = k in local, inR = k in remote;
      if (inL && inR) out[k] = merge3(b[k], local[k], remote[k]);
      else if (inL) { if (!(k in b && same(b[k], local[k]))) out[k] = local[k]; }
      else if (!(k in b && same(b[k], remote[k]))) out[k] = remote[k];
    }
    return out;
  }
  return local;
}

// ---------- one sync round ----------
export type CloudMeta = { revs: Record<string, number>; dirty: Record<string, true>; base: Record<string, Json>; connected?: string };
export const EMPTY_META: CloudMeta = { revs: {}, dirty: {}, base: {} };

export type Remote = { rev: number; value: Json };
export type PushResult = { status: "ok"; rev: number } | { status: "conflict" | "forbidden"; rev: number; value: Json; reason?: string };
export type Transport = {
  pull: (revs: Record<string, number>) => Promise<Record<string, Remote>>;
  push: (changes: { key: string; baseRev: number; value: Json }[]) => Promise<Record<string, PushResult>>;
};
/** How the sync reads this device's data and writes the server's changes into it (without marking them dirty). */
export type LocalData = { read: (key: string) => Json | undefined; write: (key: string, value: Json) => void };

export type SyncOutcome = { meta: CloudMeta; received: string[]; sent: string[]; refused: string[] };

const clone = (meta: CloudMeta): CloudMeta => ({ ...meta, revs: { ...meta.revs }, dirty: { ...meta.dirty }, base: { ...meta.base } });

/** Folds the server's copy into this device: taken as is when nothing changed here, merged when both changed. */
function absorb(meta: CloudMeta, local: LocalData, key: string, remote: Remote) {
  if (meta.dirty[key]) {
    local.write(key, merge3(meta.base[key], local.read(key), remote.value));
    meta.base[key] = remote.value; // the merge now contains everything up to this revision
  } else local.write(key, remote.value);
  meta.revs[key] = remote.rev;
}

/** Pull what changed on the server, merge, then push what changed here. Retries a key a few times if another device got in first. */
export async function syncOnce(keys: string[], local: LocalData, start: CloudMeta, transport: Transport): Promise<SyncOutcome> {
  const meta = clone(start);
  const received: string[] = [], sent: string[] = [], refused: string[] = [];
  const pulled = await transport.pull(meta.revs);
  for (const [key, remote] of Object.entries(pulled)) {
    if (!keys.includes(key)) continue;
    absorb(meta, local, key, remote);
    received.push(key);
  }
  for (let round = 0; round < 3; round++) {
    const changes = keys.filter(key => meta.dirty[key] && local.read(key) !== undefined).map(key => ({ key, baseRev: meta.revs[key] ?? 0, value: local.read(key) }));
    if (!changes.length) break;
    const results = await transport.push(changes);
    for (const { key } of changes) {
      const result = results[key];
      if (!result) continue;
      if (result.status === "ok") { meta.revs[key] = result.rev; delete meta.dirty[key]; delete meta.base[key]; if (!sent.includes(key)) sent.push(key); }
      else if (result.status === "conflict") { absorb(meta, local, key, result); if (!received.includes(key)) received.push(key); }
      else { local.write(key, result.value); meta.revs[key] = result.rev; delete meta.dirty[key]; delete meta.base[key]; refused.push(key); }
    }
  }
  return { meta, received, sent, refused };
}
