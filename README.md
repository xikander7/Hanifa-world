# My Future World

My Future World is a local-first learning, mentoring, university, scholarship, quest, and time-tracking app for Sikander and Hanifa.

## Live site

https://hanifa-world-vercel-xikander7s-projects.vercel.app

Hosted on Vercel (project `hanifa-world-vercel`). Cloud save is connected through the `NEXT_PUBLIC_CLOUD_URL` environment variable in Vercel's project settings. The project is not linked to GitHub, so a new version has to be deployed by uploading the code.

## Run locally

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>. It runs without any credentials. Mentor sign-in needs Cloud save: put the web app address in `.env.local` as `NEXT_PUBLIC_CLOUD_URL` (see `docs/cloud-setup.md`), then choose “Mentor sign in” and enter the Mentor PIN.

To share progress between devices, turn on **Cloud save**: follow [docs/cloud-setup.md](docs/cloud-setup.md) (about 10 minutes, once).

## Source data

The original Excel workbook and master prompt are in `docs/source/`. The importer maps the five workbook sheets into `src/data/seed.json`:

```bash
node --experimental-strip-types scripts/import-workbook.mjs
```

The importer preserves the workbook’s useful text, links, comments, sequence, and source-sheet diagnostics. Re-importing the same source is designed to use stable keys when the production repository adapter is enabled.

## Checks

```bash
pnpm test
pnpm typecheck
pnpm build
```

The bundled runtime in this environment can run the checks directly when the shell has no `node` on PATH:

```bash
/Users/xandershah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/vitest/vitest.mjs run
```

## Local MVP routes

- `/` — animated landing page
- `/home` — Nova the mascot, daily goals, focus timer, messages from Mentor, streak calendar, badges, and a "copy my update for Sikander" report
- `/adventure` — 20-level world map with playlists, missions, proof for Mentor verification, and level-clear celebrations (`/journey` redirects here)
- `/learn` — Brain Gym: 120 flashcards (spaced repetition), a 4-question quiz per level, and the Daily 3
- `/ask` — Ask a Helper: a 3-step form that writes a clear, teacher-style question (with her current level) and opens ChatGPT with it already typed in. No API key or cost; `src/lib/askPrompt.ts` builds the message, and Mentor Hub shows what she asked. A server-side API chat can replace this once the app is deployed
- `/quests` — missions assigned by Mentor or added by Hanifa, with submit-for-review
- `/time` — Journal: time logs, reflections, questions for Mentor, proof, screenshots, and comment threads
- `/dreams` — Dream Board: university shortlist, scholarship hunt, country comparison, Mentor notes
- `/guide` — "How to use this app" (first in the menu): a kid-friendly, step-by-step explanation of every tab, plus a dictionary and FAQ
- `/sheet` — Working Excel Sheet: opens Hanifa's shared Google Sheet, syncs it on demand, and explains each of its pages in plain words
- `/mentor` — Mentor Hub (Sync & devices: Cloud save setup, device links, sheet sync): what needs attention, 14-day chart, reviews, journal comments, level-by-level mastery, messages and mission assignment

## Syncing Hanifa's Google Sheet

Her **Weekly Learning Updates** and **Time Tracking Daily** pages sync into the journal automatically. The sheet is shared as "Anyone with the link", so the browser reads each page as CSV from Google (`/gviz/tq?tqx=out:csv`, which allows cross-origin requests) — no sign-in or server needed. The app syncs when it opens and when the tab comes back into view, at most every 5 minutes (`src/lib/liveSheet.ts`), and there is a **Sync now** button on the Working Excel Sheet page and in Mentor Hub → Sync from sheet.

- Entries get stable ids (`sheet-weekly-N`, `sheet-time-YYYY-MM-DD`), so re-syncing updates instead of duplicating.
- Hanifa's comments and Sikander's review column become chat messages; comments written in the app are kept.
- Rows deleted from the sheet (or whose date changed) are removed from the app, unless someone commented on them in the app.
- The sheet is the source of truth for these entries: in the Journal they show "Edit in sheet" instead of edit/delete.
- If the sheet stops being link-shared, sync shows an error; Mentor Hub still accepts a downloaded .xlsx/.csv.
- Her entries up to 29 Sept 2026 also ship in `src/data/sheetSeed.json`, so it shows up offline.

Going the other way (app → sheet) is part of Cloud save: see below.

## How XP, streaks and badges work

Everything is **derived from stored activity** in `src/lib/game.ts`, never stored on its own, so it can't be double-counted (quiz XP only counts the best score, focus XP is capped per day, and the workbook's sample week is ignored). Teaching content lives in `src/data/lessons.ts`. Hanifa can switch colour themes and sounds from the sidebar.

## Cloud save and security

Cloud save is a Google Apps Script web app (`apps-script/Code.js`) that runs in Sikander's Google account. It is free and needs no other service:

- **Every device:** the synced keys (`SYNCED_KEYS` in `src/lib/data.ts`) are stored in a private spreadsheet in Sikander's Drive. Each key has a revision; devices pull changes every minute and whenever the app comes back into view, and push their own changes 1.5 seconds after they happen. When two devices changed the same key, `merge3` in `src/domain/cloudSync.ts` merges them (item by item for lists, key by key for objects), so a journal entry on her phone and a comment from Sikander on his laptop both survive. Offline changes are kept and sent later.
- **Two-way sheet sync:** the sheet's own tabs flow into the app (see above), and journal entries written in the app are copied to an **App Journal** tab in the working sheet. A reply typed in its "Sikander's reply" column becomes Sikander's comment in the app.
- **Mentor PIN:** with Cloud save on, the PIN is checked by the web app (Script Property `MENTOR_PIN`) and is never in the app's code. Five wrong tries lock sign-in for 15 minutes. A successful sign-in gives that device a signed token; switching back to Hanifa removes it.
- **Mentor-only changes are enforced on the server:** mentor comments, messages, mission approvals and feedback, level verification and Dream notes are refused unless the push carries a valid Mentor token (`mentorOnlyChanges` in `apps-script/Code.js`, tested in `tests/cloudSync.test.ts`).
- Without Cloud save there is no Mentor sign-in: the PIN only exists in the web app's Script Properties, never in the app's code or its history.
- The web app's address is the key to the data: anyone who has it can read the synced data. Only share it through the Mentor Hub link.

## Product principles

Activity is separate from Mentor-verified progress. Hanifa can record learning, time, quests, questions, and evidence. Only Mentor actions can approve milestones, request revisions or send messages, and with Cloud save on, the server enforces that. Historical review decisions remain visible.
