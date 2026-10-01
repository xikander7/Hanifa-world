import { createHmac, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { EMPTY_META, merge3, syncOnce } from "@/domain/cloudSync";
import type { CloudMeta, Transport } from "@/domain/cloudSync";
import { KEYS, SYNCED_KEYS } from "@/lib/data";

// The real Apps Script file, run against fake Google services.
const server = createRequire(import.meta.url)("../apps-script/Code.js");
const roundTrip = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

function fakeGoogle(pin = "2468") {
  const rows = new Map<string, { rev: number; value: unknown }>();
  const props = new Map<string, string>([["MENTOR_PIN", pin]]);
  const cache = new Map<string, string>();
  let journal: unknown[][] = [];
  const mail: { to: string; subject: string; body: string }[] = [];
  const appColumns: Record<string, { header: string[]; byRow: Record<string, unknown[]> }> = {};
  const backend = {
    prop: (name: string) => props.get(name) ?? null,
    setProp: (name: string, value: string) => { props.set(name, value); },
    cacheGet: (name: string) => cache.get(name) ?? null,
    cachePut: (name: string, value: string) => { cache.set(name, value); },
    uuid: () => randomUUID(),
    now: () => "2026-09-30T10:00:00.000Z",
    sign: (value: string, secret: string) => createHmac("sha256", secret).update(value).digest("base64url"),
    withLock: (fn: () => unknown) => fn(),
    revs: () => Object.fromEntries([...rows].map(([key, row]) => [key, row.rev])),
    load: (key: string) => (rows.has(key) ? roundTrip(rows.get(key)!) : null),
    save: (key: string, rev: number, value: unknown) => { rows.set(key, { rev, value: roundTrip(value) }); },
    journalReplies: () => Object.fromEntries(journal.slice(1).filter(r => String(r[10]).trim()).map(r => [String(r[11]).replace(/^'/, ""), String(r[10])])),
    writeJournal: (next: unknown[][]) => { journal = next; },
    writeAppColumns: (tab: string, header: string[], byRow: Record<string, unknown[]>) => { appColumns[tab] = { header, byRow: roundTrip(byRow) }; },
    ownerEmail: () => "mentor@example.com",
    sendMail: (to: string, subject: string, body: string) => { mail.push({ to, subject, body }); },
  };
  return {
    backend, rows, mail, appColumns,
    journal: () => journal,
    typeReply: (entryId: string, reply: string) => { journal = journal.map(r => (String(r[11]) === `'${entryId}` ? r.map((c, i) => (i === 10 ? reply : c)) : r)); cache.clear(); },
    call: (req: Record<string, unknown>) => roundTrip(server.handle(roundTrip(req), backend)),
  };
}

type Google = ReturnType<typeof fakeGoogle>;
type Device = { data: Map<string, unknown>; meta: CloudMeta; token: string };
const device = (data: Record<string, unknown> = {}, firstTime = false): Device => ({
  data: new Map(Object.entries(data)),
  // A device connecting for the first time offers everything it has (like startCloud does).
  meta: { ...EMPTY_META, dirty: firstTime ? Object.fromEntries(Object.keys(data).map(k => [k, true as const])) : {} },
  token: "",
});
/** A change made in the app: marks the key dirty and remembers the last synced value, like the store's write hook. */
function edit<T>(d: Device, key: string, change: (previous: T) => T) {
  const previous = d.data.get(key) as T;
  if (!d.meta.dirty[key]) { d.meta = { ...d.meta, dirty: { ...d.meta.dirty, [key]: true } }; if (previous !== undefined) d.meta.base = { ...d.meta.base, [key]: roundTrip(previous) }; }
  d.data.set(key, change(roundTrip(previous)));
}
async function sync(d: Device, google: Google) {
  const transport: Transport = {
    pull: async revs => google.call({ action: "pull", revs: JSON.stringify(revs) }).keys,
    push: async changes => google.call({ action: "push", changes, token: d.token }).results,
  };
  const local = { read: (key: string) => (d.data.has(key) ? roundTrip(d.data.get(key)) : undefined), write: (key: string, value: unknown) => { d.data.set(key, roundTrip(value)); } };
  const outcome = await syncOnce(SYNCED_KEYS, local, d.meta, transport);
  d.meta = outcome.meta;
  return outcome;
}
const entry = (id: string, extra: Record<string, unknown> = {}) => ({ id, date: "2026-09-29", kind: "Learning update", topic: "Python", minutes: 30, did: `did ${id}`, practiced: "", feeling: "✨", blocker: "", proof: "", ...extra });
const ids = (d: Device) => (d.data.get(KEYS.activity) as { id: string }[]).map(a => a.id);

describe("merge3", () => {
  it("keeps additions from both sides in lists of items", () => {
    expect(merge3([{ id: "a" }], [{ id: "a" }, { id: "b" }], [{ id: "a" }, { id: "c" }])).toEqual([{ id: "a" }, { id: "c" }, { id: "b" }]);
  });
  it("respects a deletion on either side", () => {
    expect(merge3([{ id: "a" }, { id: "b" }], [{ id: "a" }], [{ id: "a" }, { id: "b" }, { id: "c" }])).toEqual([{ id: "a" }, { id: "c" }]);
  });
  it("merges inside an item: her edit and his comment both survive", () => {
    const base = [{ id: "a", did: "x", comments: [] }];
    const hers = [{ id: "a", did: "x, fixed typo", comments: [] }];
    const his = [{ id: "a", did: "x", comments: [{ id: "c1", by: "mentor", text: "Nice" }] }];
    expect(merge3(base, hers, his)).toEqual([{ id: "a", did: "x, fixed typo", comments: [{ id: "c1", by: "mentor", text: "Nice" }] }]);
  });
  it("merges maps and sets (flashcards, days studied)", () => {
    const base = { cards: { c1: { box: 1 } }, days: ["d1"] };
    expect(merge3(base, { cards: { c1: { box: 2 } }, days: ["d1", "d2"] }, { cards: { c1: { box: 1 }, c2: { box: 1 } }, days: ["d1", "d3"] }))
      .toEqual({ cards: { c1: { box: 2 }, c2: { box: 1 } }, days: ["d1", "d3", "d2"] });
  });
  it("with no base, keeps everything from both", () => {
    expect(merge3(undefined, [{ id: "a", n: 1 }], [{ id: "b" }])).toEqual([{ id: "b" }, { id: "a", n: 1 }]);
  });
  it("lets this device win a clash on one value", () => { expect(merge3(5, 6, 7)).toBe(6); });
});

describe("two devices, one cloud", () => {
  it("shares a phone entry and a laptop comment made at the same time", async () => {
    const google = fakeGoogle();
    const phone = device({ [KEYS.activity]: [entry("old")] }, true);
    await sync(phone, google);
    const laptop = device();
    await sync(laptop, google);
    expect(ids(laptop)).toEqual(["old"]);

    laptop.token = google.call({ action: "login", pin: "2468" }).token;
    edit<ReturnType<typeof entry>[]>(phone, KEYS.activity, list => [...list, entry("new")]);
    edit<Record<string, unknown>[]>(laptop, KEYS.activity, list => list.map(a => ({ ...a, comments: [{ id: "c1", by: "mentor", text: "Great start!", at: "x" }] })));
    await sync(phone, google);
    const laptopRound = await sync(laptop, google); // gets a conflict, merges, pushes again
    expect(laptopRound.refused).toEqual([]);
    await sync(phone, google);

    for (const d of [phone, laptop]) {
      expect(ids(d)).toEqual(["old", "new"]);
      expect((d.data.get(KEYS.activity) as { comments?: { text: string }[] }[])[0].comments?.[0].text).toBe("Great start!");
    }
    expect(phone.meta.dirty).toEqual({});
  });

  it("merges two devices that were both used before Cloud save was turned on", async () => {
    const google = fakeGoogle();
    const phone = device({ [KEYS.activity]: [entry("p")], [KEYS.goal]: 5 }, true), laptop = device({ [KEYS.activity]: [entry("l")] }, true);
    await sync(phone, google); await sync(laptop, google); await sync(phone, google);
    expect(ids(phone).sort()).toEqual(["l", "p"]);
    expect(ids(laptop).sort()).toEqual(["l", "p"]);
    expect(laptop.data.get(KEYS.goal)).toBe(5);
  });

  it("passes a deletion on to the other device", async () => {
    const google = fakeGoogle();
    const phone = device({ [KEYS.activity]: [entry("a"), entry("b")] }, true), laptop = device();
    await sync(phone, google); await sync(laptop, google);
    edit<{ id: string }[]>(phone, KEYS.activity, list => list.filter(a => a.id !== "a"));
    await sync(phone, google); await sync(laptop, google);
    expect(ids(laptop)).toEqual(["b"]);
  });
});

describe("Mentor-only changes", () => {
  it("checks the PIN on the server and pauses after 5 wrong tries", () => {
    const google = fakeGoogle();
    expect(google.call({ action: "login", pin: "1234" })).toEqual({ ok: false, error: "wrong-pin" });
    expect(google.call({ action: "login", pin: "2468" }).token).toMatch(/^[\w-]{40,}$/);
    for (let i = 0; i < 5; i++) google.call({ action: "login", pin: "0000" });
    expect(google.call({ action: "login", pin: "2468" }).error).toBe("too-many-tries");
  });

  it("refuses them from a device that isn't signed in, and puts the server's copy back", async () => {
    const google = fakeGoogle();
    const phone = device({ [KEYS.activity]: [entry("a")], [KEYS.skillProof]: { s1: { verified: false } } }, true);
    await sync(phone, google);
    edit<Record<string, unknown>[]>(phone, KEYS.activity, list => list.map(a => ({ ...a, comments: [{ id: "fake", by: "mentor", text: "I approve myself", at: "x" }] })));
    edit<Record<string, unknown>>(phone, KEYS.skillProof, () => ({ s1: { verified: true } }));
    const outcome = await sync(phone, google);
    expect(outcome.refused.sort()).toEqual([KEYS.activity, KEYS.skillProof].sort());
    expect((phone.data.get(KEYS.activity) as { comments?: unknown[] }[])[0].comments).toBeUndefined();
    expect(phone.data.get(KEYS.skillProof)).toEqual({ s1: { verified: false } });
  });

  it("allows Hanifa's own changes, and Sikander's review imported from the sheet", () => {
    const sheetEntry = { ...entry("sheet-weekly-2"), source: "sheet", comments: [{ id: "sheet-weekly-2-mentor", by: "mentor", text: "Good" }] };
    expect(server.mentorOnlyChanges(KEYS.activity, [], [entry("a", { blocker: "why?" }), sheetEntry])).toEqual([]);
    expect(server.mentorOnlyChanges(KEYS.inbox, [{ id: "m", text: "hi", kind: "cheer", at: "t" }], [{ id: "m", text: "hi", kind: "cheer", at: "t", reply: "thanks" }])).toEqual([]);
    expect(server.mentorOnlyChanges(KEYS.quests, [{ id: "q", status: "Today", requiresApproval: true }], [{ id: "q", status: "Waiting for Mentor", requiresApproval: true }])).toEqual([]);
    expect(server.mentorOnlyChanges(KEYS.quests, [{ id: "q", status: "Waiting for Mentor", requiresApproval: true }], [{ id: "q", status: "Completed", requiresApproval: true }])).toEqual(["mission approval"]);
  });
});

describe("the App Journal tab in the working sheet", () => {
  it("lists her app entries, and turns a reply typed in the sheet into Sikander's comment", async () => {
    const google = fakeGoogle();
    const phone = device({ [KEYS.activity]: [{ ...entry("import-0") }, { ...entry("sheet-time-2026-09-29"), source: "sheet" }, entry("mine", { did: "=SUM(A1)" })] }, true);
    await sync(phone, google);
    const rows = google.journal();
    expect(rows).toHaveLength(2); // header + her one app entry (sample week and sheet rows are left out)
    expect(rows[1][4]).toBe("'=SUM(A1)"); // can't become a formula
    expect(rows[1][11]).toBe("'mine");

    google.typeReply("mine", "Well done! Try the next video.");
    await sync(phone, google);
    const comments = (phone.data.get(KEYS.activity) as { id: string; comments?: { by: string; text: string }[] }[]).find(a => a.id === "mine")?.comments;
    expect(comments).toEqual([expect.objectContaining({ by: "mentor", text: "Well done! Try the next video." })]);
  });
});

describe("Emails to Sikander", () => {
  const push = (google: Google, key: string, value: unknown, token = "") => {
    const rev = google.rows.get(key)?.rev ?? 0;
    return google.call({ action: "push", token, changes: [{ key, baseRev: rev, value }] });
  };

  it("emails when Hanifa asks for help, but not when a device first joins", () => {
    const google = fakeGoogle();
    push(google, KEYS.asks, [{ id: "a1", at: "", module: 1, topic: "Old question", mode: "explain", question: "" }]);
    expect(google.mail).toHaveLength(0);
    push(google, KEYS.asks, [{ id: "a1", at: "", module: 1, topic: "Old question", mode: "explain", question: "" }, { id: "a2", at: "", module: 2, topic: "RAM", mode: "error", question: "What is RAM?" }]);
    expect(google.mail).toHaveLength(1);
    expect(google.mail[0].to).toBe("mentor@example.com");
    expect(google.mail[0].body).toContain("What is RAM?");
    expect(google.mail[0].body).not.toContain("Old question");
  });

  it("emails for diary questions, missions to review, levels to verify and replies, in one email per push", () => {
    const google = fakeGoogle();
    const entry = { id: "e1", date: "2026-09-30", kind: "Time log", topic: "Python", minutes: 20, did: "", practiced: "", feeling: "", blocker: "", proof: "", comments: [] };
    push(google, KEYS.activity, [entry]);
    push(google, KEYS.quests, [{ id: "q1", title: "Zip a folder", status: "In Progress" }]);
    push(google, KEYS.skillProof, { "module-1": { completed: [], note: "", proof: "", sent: false } });
    // Only Sikander can send a message, so it goes up with his token.
    push(google, KEYS.inbox, [{ id: "m1", at: "", kind: "note", text: "Well done!" }], google.call({ action: "login", pin: "2468" }).token);
    expect(google.mail).toHaveLength(0);

    google.call({ action: "push", token: "", changes: [
      { key: KEYS.activity, baseRev: 1, value: [{ ...entry, blocker: "Why is my loop stuck?", comments: [{ id: "c1", by: "hanifa", text: "Thanks!", at: "" }] }] },
      { key: KEYS.quests, baseRev: 1, value: [{ id: "q1", title: "Zip a folder", status: "Waiting for Mentor", comment: "Done it" }] },
      { key: KEYS.skillProof, baseRev: 1, value: { "module-1": { completed: [], note: "", proof: "my link", sent: true, sentAt: "x" } } },
      { key: KEYS.inbox, baseRev: 1, value: [{ id: "m1", at: "", kind: "note", text: "Well done!", reply: "Thank you" }] },
    ] });
    expect(google.mail).toHaveLength(1);
    const { subject, body } = google.mail[0];
    expect(subject).toBe("Hanifa has 5 updates for you");
    for (const bit of ["Why is my loop stuck?", "Thanks!", "Zip a folder", "Level 1", "Thank you"]) expect(body).toContain(bit);
  });

  it("does not email Sikander about his own changes, and sends to MENTOR_EMAIL when set", () => {
    const google = fakeGoogle();
    const token = google.call({ action: "login", pin: "2468" }).token;
    push(google, KEYS.inbox, [{ id: "m1", at: "", kind: "note", text: "Hi" }], token);
    push(google, KEYS.inbox, [{ id: "m1", at: "", kind: "note", text: "Hi", reply: "Hello" }], token);
    expect(google.mail).toHaveLength(0);
    google.backend.setProp("MENTOR_EMAIL", "sikander@example.com");
    push(google, KEYS.inbox, [{ id: "m1", at: "", kind: "note", text: "Hi", reply: "Hello again" }]);
    expect(google.mail.map(m => m.to)).toEqual(["sikander@example.com"]);
  });
});

describe("Writing the app's work into the sheet's main tabs", () => {
  const entry = (over: Record<string, unknown>) => ({ date: "2026-09-30", kind: "Time log", topic: "Python", minutes: 0, did: "", practiced: "", feeling: "", blocker: "", proof: "", comments: [], ...over });

  it("adds up a day's app time and notes, and keeps chat on sheet rows, leaving sheet-typed time out", () => {
    const columns = server.timeAppColumns([
      entry({ id: "a1", minutes: 30, did: "Loops", source: "manual" }),
      entry({ id: "a2", minutes: 15, source: "focus", blocker: "What is a list?" }),
      entry({ id: "sheet-time-2026-09-29", date: "2026-09-29", minutes: 180, source: "sheet", did: "Typed in the sheet",
        comments: [{ id: "sheet-time-2026-09-29-hanifa", by: "hanifa", text: "from the sheet", at: "" }, { id: "c9", by: "mentor", text: "Great work", at: "" }] }),
      entry({ id: "import-1", minutes: 60, source: "manual" }),
    ]);
    expect(columns["2026-09-30"]).toEqual([0.75, "Python (30m): Loops\nPython (15m): ❓ What is a list?", ""]);
    expect(columns["2026-09-29"]).toEqual(["", "", "Sikander: Great work"]);
    expect(Object.keys(columns)).toHaveLength(2);
  });

  it("puts app chat on the right weekly row", () => {
    const columns = server.weeklyAppColumns([
      entry({ id: "sheet-weekly-1", sourceWeek: "Week 1", kind: "Weekly reflection", source: "sheet", comments: [{ id: "x", by: "hanifa", text: "Can we go over RAM?", at: "" }] }),
      entry({ id: "sheet-weekly-2", sourceWeek: "Week 2", kind: "Weekly reflection", source: "sheet", comments: [{ id: "sheet-weekly-2-mentor", by: "mentor", text: "sheet review", at: "" }] }),
    ]);
    expect(columns).toEqual({ "Week 1": ["Hanifa: Can we go over RAM?"] });
  });

  it("updates the main tabs whenever the journal is saved", () => {
    const google = fakeGoogle();
    google.call({ action: "push", token: "", changes: [{ key: KEYS.activity, baseRev: 0, value: [entry({ id: "a1", minutes: 45, did: "Git", source: "manual" })] }] });
    expect(google.appColumns["Time Tracking Daily"].header).toEqual(["📱 App hours", "📱 App notes", "📱 App chat"]);
    expect(google.appColumns["Time Tracking Daily"].byRow["2026-09-30"][0]).toBe(0.75);
    expect(google.appColumns["Weekly Learning Updates"].byRow).toEqual({});
  });
});

describe("Hanifa's daily reminder", () => {
  const day = (id: string, date: string, minutes = 20) => ({ id, date, kind: "Time log", topic: "Python", minutes, did: "", practiced: "", feeling: "", blocker: "", proof: "" });

  it("is skipped when she already studied today", () => {
    expect(server.reminderFor([day("a", "2026-10-01")], "2026-10-01")).toBeNull();
  });

  it("cheers her streak on when she hasn't studied yet today", () => {
    const reminder = server.reminderFor([day("a", "2026-09-28"), day("b", "2026-09-29"), day("c", "2026-09-30")], "2026-10-01");
    expect(reminder.subject).toContain("3-day streak");
    expect(reminder.body).toContain("/home");
  });

  it("is gentle when there is no streak, and ignores the sample week", () => {
    const reminder = server.reminderFor([day("import-1", "2026-09-30")], "2026-10-01");
    expect(reminder.subject).toContain("Nova misses you");
  });
});
