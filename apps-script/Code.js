/**
 * My Future World: Cloud save + two-way sheet sync.
 *
 * Paste this whole file into a NEW, standalone Apps Script project at https://script.google.com (not one opened from
 * the working sheet: anyone with that sheet's link could read a script attached to it). Setup steps: docs/cloud-setup.md.
 *
 * What it does
 *  - Keeps one copy of Hanifa's app data in a private spreadsheet only you can open ("My Future World: app data").
 *    Every device syncs with it, so her phone, her laptop and your laptop all see the same thing.
 *  - Writes every journal entry she makes in the app to an "App Journal" tab in the working sheet. Anything you type in
 *    that tab's "Xander's reply" column shows up in the app as your comment.
 *  - Checks the Mentor PIN here, on Google's side, so it is never inside the app. Changes only a mentor may make
 *    (approving, verifying, messages, mentor comments) are refused unless they come from a device signed in as Mentor.
 *
 * Script Properties (Project Settings → Script Properties):
 *  - MENTOR_PIN   required, your PIN
 *  - TOKEN_SECRET created automatically; delete it to sign every Mentor device out
 *  - DATA_SHEET_ID created automatically on first run
 */

const WORKING_SHEET_ID = "1U-4tJ5tJGLne0uCzxhKHlO9aBvm9DsfIOvV94VDXYfE";
const JOURNAL_TAB = "App Journal";
const ACTIVITY_KEY = "future-world-activity-v2";
const SYNCED_KEYS = [
  "future-world-quests", ACTIVITY_KEY, "hanifa-tech-roadmap-progress-v1", "future-world-weekly-goal-hours",
  "future-world-universities", "future-world-scholarships", "future-world-skill-proof-v2", "future-world-brain-v1",
  "future-world-inbox-v1", "future-world-inbox-seen-v1", "future-world-asks-v1",
];
const CHUNK = 45000; // a Sheets cell holds 50,000 characters
const MAX_VALUE_CHARS = 20000000;
const MAX_PIN_TRIES = 5; // then a 15-minute pause
const REPLY_CHECK_SECONDS = 30;

// ------------------------------------------------------------------ web app entry points
function doGet(e) { return respond(handle(e.parameter || {}, sheetsBackend())); }
function doPost(e) {
  let body;
  try { body = JSON.parse((e.postData && e.postData.contents) || "{}"); } catch (err) { return respond({ ok: false, error: "bad-json" }); }
  return respond(handle(body, sheetsBackend()));
}
function respond(result) { return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON); }

// ------------------------------------------------------------------ request handling (no Google services in here, so it can be tested)
function handle(req, backend) {
  try {
    if (req.action === "ping") return { ok: true, app: "my-future-world", version: 1 };
    if (req.action === "login") return login(String(req.pin || ""), backend);
    if (req.action === "pull") return pull(req, backend);
    if (req.action === "push") return push(req, backend);
    return { ok: false, error: "unknown-action" };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
}

function login(pin, backend) {
  const expected = backend.prop("MENTOR_PIN");
  if (!expected) return { ok: false, error: "MENTOR_PIN is not set in Script Properties" };
  const tries = Number(backend.cacheGet("pin-fails") || 0);
  if (tries >= MAX_PIN_TRIES) return { ok: false, error: "too-many-tries" };
  if (pin !== String(expected)) { backend.cachePut("pin-fails", String(tries + 1), 900); return { ok: false, error: "wrong-pin" }; }
  backend.cachePut("pin-fails", "0", 1);
  return { ok: true, token: mentorToken(backend) };
}

function mentorToken(backend) {
  let secret = backend.prop("TOKEN_SECRET");
  if (!secret) { secret = backend.uuid() + backend.uuid(); backend.setProp("TOKEN_SECRET", secret); }
  return backend.sign("mentor", secret);
}
const isMentor = (token, backend) => Boolean(token) && Boolean(backend.prop("TOKEN_SECRET")) && token === mentorToken(backend);

function pull(req, backend) {
  let known = {};
  try { known = JSON.parse(req.revs || "{}"); } catch (err) { known = {}; }
  if (backend.cacheGet("replies-checked") !== "1") {
    backend.cachePut("replies-checked", "1", REPLY_CHECK_SECONDS);
    importJournalReplies(backend);
  }
  const revs = backend.revs();
  const keys = {};
  for (const key of SYNCED_KEYS) if (revs[key] && revs[key] !== known[key]) keys[key] = backend.load(key);
  return { ok: true, keys };
}

function push(req, backend) {
  const mentor = isMentor(req.token, backend);
  const results = {};
  const changes = Array.isArray(req.changes) ? req.changes : [];
  backend.withLock(() => {
    for (const change of changes) {
      const key = change.key;
      if (SYNCED_KEYS.indexOf(key) < 0) continue;
      if (JSON.stringify(change.value).length > MAX_VALUE_CHARS) { results[key] = { status: "forbidden", rev: 0, value: null, reason: "too-big" }; continue; }
      const current = backend.load(key) || { rev: 0, value: null };
      if (Number(change.baseRev) !== current.rev) { results[key] = { status: "conflict", rev: current.rev, value: current.value }; continue; }
      const problems = mentor ? [] : mentorOnlyChanges(key, current.value, change.value);
      if (problems.length) { results[key] = { status: "forbidden", rev: current.rev, value: current.value, reason: problems.join("; ") }; continue; }
      backend.save(key, current.rev + 1, change.value);
      results[key] = { status: "ok", rev: current.rev + 1 };
      if (key === ACTIVITY_KEY) backend.writeJournal(journalRows(change.value, backend.journalReplies()));
    }
  });
  return { ok: true, mentor, results };
}

// ------------------------------------------------------------------ what only Xander may change
const list = value => (Array.isArray(value) ? value : []);
const byId = value => { const map = {}; list(value).forEach(item => { if (item && item.id) map[item.id] = item; }); return map; };
const text = value => (value === undefined || value === null ? "" : String(value));
// Comments that came from the working sheet's review columns are the sheet's, not a device's.
const fromSheet = (entry, comment) => entry.source === "sheet" && /-(mentor|hanifa)$/.test(comment.id) && comment.id.indexOf(entry.id) === 0;

function mentorOnlyChanges(key, before, after) {
  const problems = [];
  if (key === ACTIVITY_KEY) {
    const old = byId(before);
    list(after).forEach(entry => {
      const was = old[entry.id] || {};
      const oldComments = byId(was.comments);
      list(entry.comments).forEach(c => {
        if (c.by === "mentor" && !fromSheet(entry, c) && (!oldComments[c.id] || text(oldComments[c.id].text) !== text(c.text))) problems.push("mentor comment");
      });
      if (text(entry.mentorNote) !== text(was.mentorNote)) problems.push("mentor note");
    });
  }
  if (key === "future-world-quests") {
    const old = byId(before);
    list(after).forEach(q => {
      const was = old[q.id];
      if (!was && q.createdBy === "mentor") problems.push("mission from Xander");
      if (text(q.mentorFeedback) !== text(was && was.mentorFeedback)) problems.push("mission feedback");
      if (q.status === "Needs a tweak" && (!was || was.status !== "Needs a tweak")) problems.push("mission review");
      if (q.status === "Completed" && q.requiresApproval && (!was || was.status !== "Completed")) problems.push("mission approval");
    });
  }
  if (key === "future-world-skill-proof-v2") {
    const old = before && typeof before === "object" ? before : {};
    Object.keys(after || {}).forEach(id => {
      const now = after[id] || {}, was = old[id] || {};
      if (now.verified && !was.verified) problems.push("level verification");
      if (text(now.mentorFeedback) !== text(was.mentorFeedback)) problems.push("level feedback");
    });
  }
  if (key === "future-world-inbox-v1") {
    const old = byId(before);
    list(after).forEach(m => {
      const was = old[m.id];
      if (!was || text(was.text) !== text(m.text) || was.kind !== m.kind || was.at !== m.at) problems.push("message from Xander");
    });
  }
  if (key === "future-world-universities" || key === "future-world-scholarships") {
    const old = byId(before);
    list(after).forEach(item => { if (text(item.mentorNote) !== text(old[item.id] && old[item.id].mentorNote)) problems.push("note from Xander"); });
  }
  return problems.filter((p, i) => problems.indexOf(p) === i);
}

// ------------------------------------------------------------------ the "App Journal" tab
const JOURNAL_HEADER = ["Date", "Type", "Topic", "Minutes", "What I learned / did", "Practised", "Feeling", "Question for Xander", "Proof", "Chat in the app", "✍️ Xander's reply (type here)", "Entry id (don't edit)"];
const REPLY_COL = 10, ID_COL = 11; // zero-based
const replyId = entryId => entryId + "-sheetreply";
// Text that starts with = + - @ would become a formula in Sheets.
const safeCell = value => { const s = text(value); return /^[=+\-@]/.test(s) ? "'" + s : s; };

/** One row per entry Hanifa wrote in the app (the sheet's own rows and the sample week are left out), newest first. */
function journalRows(activity, replies) {
  const rows = list(activity)
    .filter(a => a && a.source !== "sheet" && String(a.id).indexOf("import-") !== 0)
    .sort((a, b) => text(b.date).localeCompare(text(a.date)))
    .map(a => [
      a.date, a.kind, safeCell(a.topic), a.minutes || "", safeCell(a.did), safeCell(a.practiced), text(a.feeling),
      safeCell(a.blocker), safeCell(a.proof) + (a.attachment ? (a.proof ? " · " : "") + "📸 screenshot in the app" : ""),
      safeCell(list(a.comments).filter(c => c.id !== replyId(a.id)).map(c => (c.by === "mentor" ? "Xander: " : "Hanifa: ") + c.text).join("\n")),
      safeCell(replies[a.id] || ""), "'" + a.id,
    ]);
  return [JOURNAL_HEADER].concat(rows);
}

/** Turns replies typed in the App Journal tab into Xander's comments on those entries. Returns null when nothing changed. */
function applyJournalReplies(activity, replies, nowIso) {
  let changed = false;
  const next = list(activity).map(entry => {
    const reply = text(replies[entry.id]).trim(), id = replyId(entry.id);
    const comments = list(entry.comments), existing = comments.filter(c => c.id === id)[0];
    if (!reply && !existing) return entry;
    if (existing && text(existing.text) === reply) return entry;
    changed = true;
    const others = comments.filter(c => c.id !== id);
    return Object.assign({}, entry, { comments: reply ? others.concat([{ id: id, by: "mentor", text: reply, at: existing ? existing.at : nowIso }]) : others });
  });
  return changed ? next : null;
}

function importJournalReplies(backend) {
  const replies = backend.journalReplies();
  backend.withLock(() => {
    const current = backend.load(ACTIVITY_KEY);
    if (!current) return;
    const next = applyJournalReplies(current.value, replies, backend.now());
    if (next) { backend.save(ACTIVITY_KEY, current.rev + 1, next); backend.writeJournal(journalRows(next, replies)); }
  });
}

// ------------------------------------------------------------------ Google services
function sheetsBackend() {
  const props = PropertiesService.getScriptProperties();
  const cache = CacheService.getScriptCache();
  let data = null;
  const dataSheet = () => {
    if (data) return data;
    let id = props.getProperty("DATA_SHEET_ID"), book;
    if (id) book = SpreadsheetApp.openById(id);
    else { book = SpreadsheetApp.create("My Future World: app data (private)"); props.setProperty("DATA_SHEET_ID", book.getId()); }
    data = book.getSheets()[0];
    if (data.getRange(1, 1).getValue() !== "key") data.getRange(1, 1, 1, 4).setValues([["key", "rev", "updated", "chunks"]]);
    return data;
  };
  const rowOf = key => {
    const sheet = dataSheet(), last = sheet.getLastRow();
    if (last < 2) return 0;
    const keys = sheet.getRange(2, 1, last - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) if (keys[i][0] === key) return i + 2;
    return 0;
  };
  const journalTab = () => {
    const book = SpreadsheetApp.openById(WORKING_SHEET_ID);
    return book.getSheetByName(JOURNAL_TAB) || book.insertSheet(JOURNAL_TAB);
  };
  return {
    prop: name => props.getProperty(name),
    setProp: (name, value) => props.setProperty(name, value),
    cacheGet: name => cache.get(name),
    cachePut: (name, value, seconds) => cache.put(name, value, seconds),
    uuid: () => Utilities.getUuid(),
    now: () => new Date().toISOString(),
    sign: (value, secret) => Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(value, secret)),
    withLock: fn => { const lock = LockService.getScriptLock(); lock.waitLock(30000); try { return fn(); } finally { lock.releaseLock(); } },
    revs: () => {
      const sheet = dataSheet(), last = sheet.getLastRow(), out = {};
      if (last >= 2) sheet.getRange(2, 1, last - 1, 2).getValues().forEach(r => { if (r[0]) out[r[0]] = Number(r[1]); });
      return out;
    },
    load: key => {
      const row = rowOf(key);
      if (!row) return null;
      const sheet = dataSheet(), head = sheet.getRange(row, 1, 1, 4).getValues()[0], count = Number(head[3]) || 0;
      const chunks = count ? sheet.getRange(row, 5, 1, count).getValues()[0] : [];
      // Every chunk starts with "~" so Sheets never reads it as a number, date or formula.
      const json = chunks.map(c => String(c).slice(1)).join("");
      return { rev: Number(head[1]), value: json ? JSON.parse(json) : null };
    },
    save: (key, rev, value) => {
      const sheet = dataSheet(), json = JSON.stringify(value), chunks = [];
      for (let i = 0; i < json.length; i += CHUNK) chunks.push("~" + json.slice(i, i + CHUNK));
      const row = rowOf(key) || sheet.getLastRow() + 1;
      const width = 4 + chunks.length;
      if (sheet.getMaxColumns() < width) sheet.insertColumnsAfter(sheet.getMaxColumns(), width - sheet.getMaxColumns());
      const old = sheet.getLastColumn();
      if (old > 4) sheet.getRange(row, 5, 1, old - 4).clearContent();
      sheet.getRange(row, 1, 1, width).setValues([[key, rev, new Date(), chunks.length].concat(chunks)]);
    },
    journalReplies: () => {
      const sheet = journalTab(), last = sheet.getLastRow(), out = {};
      if (last < 2 || sheet.getLastColumn() < ID_COL + 1) return out;
      sheet.getRange(2, 1, last - 1, ID_COL + 1).getValues().forEach(r => { const id = String(r[ID_COL]).replace(/^'/, ""); if (id && String(r[REPLY_COL]).trim()) out[id] = String(r[REPLY_COL]); });
      return out;
    },
    writeJournal: rows => {
      const sheet = journalTab();
      sheet.clearContents();
      sheet.getRange(1, 1, rows.length, JOURNAL_HEADER.length).setValues(rows);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, JOURNAL_HEADER.length).setFontWeight("bold");
      sheet.getRange(1, REPLY_COL + 1, Math.max(rows.length, 2), 1).setBackground("#fff7d6");
      sheet.getRange(2, 1, Math.max(rows.length - 1, 1), JOURNAL_HEADER.length).setWrap(true).setVerticalAlignment("top");
    },
  };
}

/** Run once from the editor (select "setup", press Run) to grant access and create the private data spreadsheet. */
function setup() {
  const backend = sheetsBackend();
  backend.revs();
  SpreadsheetApp.openById(WORKING_SHEET_ID).getName();
  if (!backend.prop("MENTOR_PIN")) throw new Error("Add MENTOR_PIN in Project Settings → Script Properties, then run setup again.");
  Logger.log("All set. Private data spreadsheet: https://docs.google.com/spreadsheets/d/" + backend.prop("DATA_SHEET_ID"));
}

// Lets the app's tests load this file. Apps Script has no `module`, so this line does nothing there.
if (typeof module !== "undefined") module.exports = { handle, mentorOnlyChanges, journalRows, applyJournalReplies, SYNCED_KEYS, CHUNK };
