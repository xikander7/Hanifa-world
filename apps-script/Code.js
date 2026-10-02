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
 *    that tab's "Sikander's reply" column shows up in the app as your comment.
 *  - Fills "App ..." columns on the sheet's main tabs (Time Tracking Daily, Weekly Learning Updates) with the time,
 *    notes and chat from the app. Only those columns are written; what anyone types in the other columns is never touched,
 *    and the app ignores the columns when it reads the sheet, so nothing is counted twice.
 *  - Checks the Mentor PIN here, on Google's side, so it is never inside the app. Changes only a mentor may make
 *    (approving, verifying, messages, mentor comments) are refused unless they come from a device signed in as Mentor.
 *
 *  - Emails Sikander when Hanifa needs him: a question, a help request, a mission or level to review, or a reply.
 *  - Keeps screenshots in an "images" tab of the private data spreadsheet, apart from the diary, so the diary stays small.
 *
 * Script Properties (Project Settings > Script Properties):
 *  - MENTOR_PIN   required, your PIN
 *  - MENTOR_EMAIL optional; alerts go here. Without it they go to the Google account that runs this script
 *  - HANIFA_EMAIL optional; her daily reminder goes here (several addresses can be separated with commas)
 *  - REMINDER_HOUR optional, 0-23 (default 17); REMINDER_TIMEZONE optional (default Asia/Karachi). Run setup again after changing them
 *  - TOKEN_SECRET created automatically; delete it to sign every Mentor device out
 *  - DATA_SHEET_ID created automatically on first run
 */

const WORKING_SHEET_ID = "1U-4tJ5tJGLne0uCzxhKHlO9aBvm9DsfIOvV94VDXYfE";
const JOURNAL_TAB = "App Journal";
const TIME_TAB = "Time Tracking Daily";
const WEEKLY_TAB = "Weekly Learning Updates";
const TIME_APP_HEADER = ["App hours", "App notes", "App chat"];
const WEEKLY_APP_HEADER = ["App chat"];
const ACTIVITY_KEY = "future-world-activity-v2";
const SYNCED_KEYS = [
  "future-world-quests", ACTIVITY_KEY, "hanifa-tech-roadmap-progress-v1", "future-world-weekly-goal-hours",
  "future-world-universities", "future-world-scholarships", "future-world-skill-proof-v2", "future-world-brain-v1",
  "future-world-inbox-v1", "future-world-inbox-seen-v1", "future-world-asks-v1",
];
const CHUNK = 45000; // a Sheets cell holds 50,000 characters
const MAX_VALUE_CHARS = 20000000;
const MAX_PIN_TRIES = 5; // then a 15-minute pause
// Screenshots are stored apart from the diary (an "images" tab in the private data spreadsheet), so syncing a comment
// never re-sends them. Each is saved once under a random id and fetched only by devices that show it.
const IMAGE_ID = /^[A-Za-z0-9_-]{8,80}$/;
const IMAGE_DATA = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_IMAGE_CHARS = 1500000; // about 1.1 MB; the app shrinks screenshots well below this
const REPLY_CHECK_SECONDS = 30;
const APP_URL = "https://hanifa-world-vercel-xikander7s-projects.vercel.app";

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
    if (req.action === "putImage") return putImage(req, backend);
    if (req.action === "getImage") return getImage(req, backend);
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

function putImage(req, backend) {
  const id = String(req.id || ""), data = String(req.data || "");
  if (!IMAGE_ID.test(id)) return { ok: false, error: "bad-image-id" };
  if (data.length > MAX_IMAGE_CHARS) return { ok: false, error: "image-too-big" };
  if (!IMAGE_DATA.test(data)) return { ok: false, error: "not-an-image" };
  // An id is only ever used for one picture, so saving it again changes nothing.
  backend.withLock(() => { if (!backend.hasImage(id)) backend.saveImage(id, data); });
  return { ok: true };
}

function getImage(req, backend) {
  const id = String(req.id || "");
  if (!IMAGE_ID.test(id)) return { ok: false, error: "bad-image-id" };
  const data = backend.loadImage(id);
  return data ? { ok: true, data } : { ok: false, error: "no-such-image" };
}

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
  const alerts = [];
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
      // A key's first save is a device joining, not news: only later changes can send an email.
      if (!mentor && current.rev > 0) mentorAlerts(key, current.value, change.value).forEach(a => alerts.push(a));
      results[key] = { status: "ok", rev: current.rev + 1 };
      if (key === ACTIVITY_KEY) { backend.writeJournal(journalRows(change.value, backend.journalReplies())); writeMainSheet(change.value, backend); }
    }
  });
  if (alerts.length) {
    try { sendAlertEmail(alerts, backend); } catch (err) { /* a failed email must never lose Hanifa's work */ }
  }
  return { ok: true, mentor, results };
}

// ------------------------------------------------------------------ what only Sikander may change
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
      if (!was && q.createdBy === "mentor") problems.push("mission from Sikander");
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
      if (!was || text(was.text) !== text(m.text) || was.kind !== m.kind || was.at !== m.at) problems.push("message from Sikander");
    });
  }
  if (key === "future-world-universities" || key === "future-world-scholarships") {
    const old = byId(before);
    list(after).forEach(item => { if (text(item.mentorNote) !== text(old[item.id] && old[item.id].mentorNote)) problems.push("note from Sikander"); });
  }
  return problems.filter((p, i) => problems.indexOf(p) === i);
}

// ------------------------------------------------------------------ emails to Sikander
/** What Hanifa did in this change that Sikander should hear about, as short lines of text. */
function mentorAlerts(key, before, after) {
  const alerts = [];
  if (key === "future-world-asks-v1") {
    const old = byId(before);
    list(after).forEach(a => { if (!old[a.id]) alerts.push("\u{1F4AC} She asked for help with " + text(a.topic) + (text(a.question).trim() ? ": \"" + text(a.question).trim() + "\"" : "") + " (" + text(a.mode) + ")"); });
  }
  if (key === ACTIVITY_KEY) {
    const old = byId(before);
    list(after).forEach(entry => {
      const was = old[entry.id] || {};
      const question = text(entry.blocker).trim();
      if (question && question !== text(was.blocker).trim()) alerts.push("\u{2753} Question in her diary (" + text(entry.topic) + "): \"" + question + "\"");
      const oldComments = byId(was.comments);
      list(entry.comments).forEach(c => {
        if (c.by === "hanifa" && !fromSheet(entry, c) && !oldComments[c.id]) alerts.push("\u{270D}\u{FE0F} She commented on her diary (" + text(entry.topic) + "): \"" + text(c.text) + "\"");
      });
    });
  }
  if (key === "future-world-quests") {
    const old = byId(before);
    list(after).forEach(q => { if (q.status === "Waiting for Mentor" && (!old[q.id] || old[q.id].status !== "Waiting for Mentor")) alerts.push("\u{1F3AF} Mission ready for your review: " + text(q.title) + (text(q.comment).trim() ? " - \"" + text(q.comment).trim() + "\"" : "")); });
  }
  if (key === "future-world-skill-proof-v2") {
    const old = before && typeof before === "object" ? before : {};
    Object.keys(after || {}).forEach(id => {
      const now = after[id] || {}, was = old[id] || {};
      if (now.sent && (!was.sent || text(now.sentAt) !== text(was.sentAt))) alerts.push("\u{1F5FA}\u{FE0F} Level " + id.replace("module-", "") + " sent for you to verify" + (text(now.proof).trim() ? ": " + text(now.proof).trim() : ""));
    });
  }
  if (key === "future-world-inbox-v1") {
    const old = byId(before);
    list(after).forEach(m => { if (text(m.reply).trim() && text(m.reply) !== text(old[m.id] && old[m.id].reply)) alerts.push("\u{1F48C} She replied to your message \"" + text(m.text) + "\": \"" + text(m.reply) + "\""); });
  }
  return alerts;
}

function sendAlertEmail(alerts, backend) {
  const to = backend.prop("MENTOR_EMAIL") || backend.ownerEmail();
  if (!to) return;
  const subject = alerts.length === 1 ? "Hanifa: " + alerts[0].replace(/^\S+\s/, "").slice(0, 90) : "Hanifa has " + alerts.length + " updates for you";
  const body = "Hi Sikander,\n\n" + alerts.map(a => "- " + a).join("\n") + "\n\nOpen Mentor Hub: " + APP_URL + "/mentor\n\n- My Future World";
  backend.sendMail(to, subject, body);
}

// ------------------------------------------------------------------ the "App Journal" tab
const JOURNAL_HEADER = ["Date", "Type", "Topic", "Minutes", "What I learned / did", "Practised", "Feeling", "Question for Sikander", "Proof", "Chat in the app", "Sikander's reply (type here)", "Entry id (don't edit)"];
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
      safeCell(a.blocker), safeCell(a.proof) + (a.attachment ? (a.proof ? " - " : "") + "\u{1F4F8} screenshot in the app" : ""),
      safeCell(list(a.comments).filter(c => c.id !== replyId(a.id)).map(c => (c.by === "mentor" ? "Sikander: " : "Hanifa: ") + c.text).join("\n")),
      safeCell(replies[a.id] || ""), "'" + a.id,
    ]);
  return [JOURNAL_HEADER].concat(rows);
}

/** Turns replies typed in the App Journal tab into Sikander's comments on those entries. Returns null when nothing changed. */
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
    if (next) { backend.save(ACTIVITY_KEY, current.rev + 1, next); backend.writeJournal(journalRows(next, replies)); writeMainSheet(next, backend); }
  });
}

// ------------------------------------------------------------------ the sheet's main tabs
const isAppEntry = a => a && a.source !== "sheet" && String(a.id).indexOf("import-") !== 0;
const isAppComment = (entry, c) => String(c.id).indexOf(entry.id + "-") !== 0;
const chatLine = c => (c.by === "mentor" ? "Sikander: " : "Hanifa: ") + text(c.text);
const hours = minutes => Math.round((minutes / 60) * 100) / 100;

/** Per day: the minutes, notes and chat from the app, for the columns of Time Tracking Daily. */
function timeAppColumns(activity) {
  const days = {};
  const day = date => (days[date] = days[date] || { minutes: 0, notes: [], chat: [] });
  list(activity).forEach(a => {
    if (!a || !a.date) return;
    if (isAppEntry(a)) {
      const d = day(a.date);
      d.minutes += Number(a.minutes) || 0;
      const note = [text(a.did).trim(), text(a.blocker).trim() && "\u{2753} " + text(a.blocker).trim()].filter(Boolean).join(" ");
      if (note || a.minutes) d.notes.push(text(a.topic) + (a.minutes ? " (" + a.minutes + "m)" : "") + (note ? ": " + note : ""));
      list(a.comments).forEach(c => { if (String(c.id) !== replyId(a.id)) d.chat.push(chatLine(c)); });
    } else if (String(a.id).indexOf("sheet-time-") === 0) {
      list(a.comments).filter(c => isAppComment(a, c)).forEach(c => day(a.date).chat.push(chatLine(c)));
    }
  });
  const out = {};
  Object.keys(days).forEach(date => {
    const d = days[date];
    out[date] = [d.minutes ? hours(d.minutes) : "", safeCell(d.notes.join("\n")), safeCell(d.chat.join("\n"))];
  });
  return out;
}

/** Per week label: the chat from the app on that week's sheet entry, for the column of Weekly Learning Updates. */
function weeklyAppColumns(activity) {
  const out = {};
  list(activity).forEach(a => {
    if (!a || String(a.id).indexOf("sheet-weekly-") !== 0 || !a.sourceWeek) return;
    const chat = list(a.comments).filter(c => isAppComment(a, c)).map(chatLine);
    if (chat.length) out[a.sourceWeek] = [safeCell(chat.join("\n"))];
  });
  return out;
}

function writeMainSheet(activity, backend) {
  // The sheet is a bonus copy: a problem writing it must never stop Hanifa's work from saving.
  try { backend.writeAppColumns(TIME_TAB, TIME_APP_HEADER, timeAppColumns(activity), "date"); } catch (err) { /* see above */ }
  try { backend.writeAppColumns(WEEKLY_TAB, WEEKLY_APP_HEADER, weeklyAppColumns(activity), "week"); } catch (err) { /* see above */ }
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
  let images = null;
  const imageTab = () => {
    if (images) return images;
    const book = dataSheet().getParent();
    images = book.getSheetByName("images") || book.insertSheet("images");
    return images;
  };
  const imageRow = id => {
    const sheet = imageTab(), last = sheet.getLastRow();
    if (last < 1) return 0;
    const ids = sheet.getRange(1, 1, last, 1).getValues();
    for (let i = 0; i < ids.length; i++) if (ids[i][0] === id) return i + 1;
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
    ownerEmail: () => Session.getEffectiveUser().getEmail(),
    sendMail: (to, subject, body) => MailApp.sendEmail({ to: to, subject: subject, body: body, name: "My Future World" }),
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
    /**
     * Writes the columns of a main tab. `byRow` maps a row's key (its date as yyyy-MM-dd, or its week label) to the
     * values for those columns. Rows without app data get empty cells; days the tab doesn't have yet are added.
     */
    writeAppColumns: (tabName, header, byRow, keyType) => {
      const sheet = SpreadsheetApp.openById(WORKING_SHEET_ID).getSheetByName(tabName);
      if (!sheet) return;
      const width = Math.max(sheet.getLastColumn(), 1);
      const top = sheet.getRange(1, 1, 1, width).getValues()[0].map(String);
      // Also finds a header an older version wrote with an emoji prefix (possibly garbled), and rewrites it cleanly.
      const ends = (h, want) => h === want || h.slice(-want.length - 1) === " " + want;
      let first = top.findIndex(h => ends(h, header[0]));
      if (first >= 0) {
        sheet.getRange(1, first + 1, 1, header.length).setValues([header]);
      } else {
        let last = top.length - 1;
        while (last >= 0 && !top[last].trim()) last--;
        first = last + 1;
        if (sheet.getMaxColumns() < first + header.length) sheet.insertColumnsAfter(sheet.getMaxColumns(), first + header.length - sheet.getMaxColumns());
        sheet.getRange(1, first + 1, 1, header.length).setValues([header]).setFontWeight("bold").setBackground("#e8f0fe");
      }
      const tz = Session.getScriptTimeZone();
      const keyOf = value => {
        if (keyType === "week") return String(value).trim();
        if (value instanceof Date) return Utilities.formatDate(value, tz, "yyyy-MM-dd");
        const us = String(value).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        return us ? us[3] + "-" + ("0" + us[1]).slice(-2) + "-" + ("0" + us[2]).slice(-2) : String(value).trim();
      };
      const lastRow = sheet.getLastRow();
      const keys = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, 1).getValues().map(r => keyOf(r[0])) : [];
      const blank = header.map(() => "");
      const values = keys.map(k => byRow[k] || blank);
      if (values.length) sheet.getRange(2, first + 1, values.length, header.length).setValues(values);
      if (keyType !== "date") return;
      const missing = Object.keys(byRow).filter(k => keys.indexOf(k) < 0).sort();
      missing.forEach(k => {
        const parts = k.split("-"), when = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const row = new Array(first + header.length).fill("");
        row[0] = when; row[1] = Utilities.formatDate(when, tz, "EEE");
        byRow[k].forEach((v, i) => { row[first + i] = v; });
        sheet.appendRow(row);
      });
    },
    hasImage: id => imageRow(id) > 0,
    saveImage: (id, data) => {
      const sheet = imageTab(), chunks = [];
      for (let i = 0; i < data.length; i += CHUNK) chunks.push("~" + data.slice(i, i + CHUNK));
      const width = 3 + chunks.length;
      if (sheet.getMaxColumns() < width) sheet.insertColumnsAfter(sheet.getMaxColumns(), width - sheet.getMaxColumns());
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, width).setValues([[id, new Date(), chunks.length].concat(chunks)]);
    },
    loadImage: id => {
      const row = imageRow(id);
      if (!row) return null;
      const sheet = imageTab(), count = Number(sheet.getRange(row, 3).getValue()) || 0;
      return count ? sheet.getRange(row, 4, 1, count).getValues()[0].map(c => String(c).slice(1)).join("") : null;
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

// ------------------------------------------------------------------ Hanifa's daily reminder
/** The reminder for `today` (yyyy-MM-dd), or null when she has already studied today (unless `always`, for a test send). */
function reminderFor(activity, today, always) {
  const days = {};
  list(activity).forEach(a => { if (a && a.date && String(a.id).indexOf("import-") !== 0 && (Number(a.minutes) > 0 || text(a.did).trim())) days[a.date] = true; });
  if (days[today] && !always) return null;
  let streak = 0;
  for (let d = new Date(today + "T12:00:00Z"); ; ) {
    d.setUTCDate(d.getUTCDate() - 1);
    if (!days[d.toISOString().slice(0, 10)]) break;
    streak++;
  }
  const subject = streak > 0 ? "\u{1F525} Keep your " + streak + "-day streak going, Hanifa!" : "\u{1F49B} Nova misses you! 5 minutes of learning today?";
  const body = [
    "Hi Hanifa! \u{1F44B}",
    "",
    streak > 0 ? "You learned " + streak + " day" + (streak > 1 ? "s" : "") + " in a row. Do a little today and your streak keeps growing! \u{1F525}" : "A tiny bit of learning today is a great start. Even 5 minutes counts! \u{1F331}",
    "",
    "Pick one:",
    "\u{26A1} Do the Daily 3 (2 minutes)",
    "\u{25B6}\u{FE0F} Press \"Your next quest\" on My Day",
    "\u{270D}\u{FE0F} Write one line in My Diary",
    "",
    "Open your app: " + APP_URL + "/home",
    "",
    "You've got this! \u{1F496}",
    "- Nova and Sikander",
  ].join("\n");
  return { subject: subject, body: body };
}

const reminderZone = backend => backend.prop("REMINDER_TIMEZONE") || "Asia/Karachi";

/** Runs every day from the timer that setup creates. Sends nothing if she already studied today. */
function dailyReminder(force) {
  const backend = sheetsBackend();
  const to = backend.prop("HANIFA_EMAIL");
  if (!to) return;
  const today = Utilities.formatDate(new Date(), reminderZone(backend), "yyyy-MM-dd");
  const saved = backend.load(ACTIVITY_KEY);
  const reminder = reminderFor(saved ? saved.value : [], today, force === true);
  if (reminder) backend.sendMail(to, reminder.subject, reminder.body);
}

/** Run from the editor to send Hanifa a reminder right now, to see what it looks like. */
function sendTestReminder() { dailyReminder(true); }

/** Run once from the editor (select "setup", press Run) to grant access and create the private data spreadsheet. */
function setup() {
  const backend = sheetsBackend();
  backend.revs();
  SpreadsheetApp.openById(WORKING_SHEET_ID).getName();
  MailApp.getRemainingDailyQuota(); // asks for permission to send the alert emails
  if (!backend.prop("MENTOR_PIN")) throw new Error("Add MENTOR_PIN in Project Settings \u{2192} Script Properties, then run setup again.");
  // The daily reminder timer (free): one per day at REMINDER_HOUR in REMINDER_TIMEZONE. Re-running setup replaces it.
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === "dailyReminder").forEach(t => ScriptApp.deleteTrigger(t));
  const hour = Math.min(23, Math.max(0, Number(backend.prop("REMINDER_HOUR") || 17)));
  ScriptApp.newTrigger("dailyReminder").timeBased().everyDays(1).atHour(hour).inTimezone(reminderZone(backend)).create();
  Logger.log(backend.prop("HANIFA_EMAIL") ? "Daily reminder: every day around " + hour + ":00 (" + reminderZone(backend) + ") to " + backend.prop("HANIFA_EMAIL") : "Daily reminder is off: add HANIFA_EMAIL in Script Properties to turn it on.");
  Logger.log("All set. Private data spreadsheet: https://docs.google.com/spreadsheets/d/" + backend.prop("DATA_SHEET_ID"));
}

// Lets the app's tests load this file. Apps Script has no `module`, so this line does nothing there.
if (typeof module !== "undefined") module.exports = { handle, MAX_IMAGE_CHARS, mentorOnlyChanges, mentorAlerts, reminderFor, timeAppColumns, weeklyAppColumns, journalRows, applyJournalReplies, SYNCED_KEYS, CHUNK };
