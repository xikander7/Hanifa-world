# My Future World

My Future World is a local-first learning, mentoring, university, scholarship, quest, and time-tracking app for Xander and Hanifa.

## Run locally

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>. The local MVP runs without Supabase or Google credentials. Choose “Mentor sign in” in the sidebar and enter the local preview code `2468` to open Mentor Mode. This code is only a local demo gate; it is not production authentication.

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
- `/home` — Nova the mascot, daily goals, focus timer, messages from Mentor, streak calendar, badges, and a "copy my update for Xander" report
- `/adventure` — 20-level world map with playlists, missions, proof for Mentor verification, and level-clear celebrations (`/journey` redirects here)
- `/learn` — Brain Gym: 120 flashcards (spaced repetition), a 4-question quiz per level, and the Daily 3
- `/quests` — missions assigned by Mentor or added by Hanifa, with submit-for-review
- `/time` — Journal: time logs, reflections, questions for Mentor, proof, screenshots, and comment threads
- `/dreams` — Dream Board: university shortlist, scholarship hunt, country comparison, Mentor notes
- `/guide` — "How to use me": a kid-friendly, step-by-step explanation of every tab, plus a dictionary and FAQ
- `/mentor` — Mentor Hub: what needs attention, 14-day chart, reviews, journal comments, level-by-level mastery, messages and mission assignment

## How XP, streaks and badges work

Everything is **derived from stored activity** in `src/lib/game.ts`, never stored on its own, so it can't be double-counted (quiz XP only counts the best score, focus XP is capped per day, and the workbook's sample week is ignored). Teaching content lives in `src/data/lessons.ts`. Hanifa can switch colour themes and sounds from the sidebar.

## Production transition

The next deployment stage replaces the local repository with Supabase Postgres/Auth/Storage, adds Google sign-in restricted by `MENTOR_EMAIL` and `HANIFA_EMAIL`, and deploys to Vercel. Keep service-role and Google secrets server-side. Data currently lives in one browser's localStorage, so Xander and Hanifa only see each other's updates on the same device until the Supabase step is done (Home has a copy/WhatsApp update in the meantime). The local role switch is a demo convenience and must not be used as production authorization.

## Product principles

Activity is separate from Mentor-verified progress. Hanifa can record learning, time, quests, questions, and evidence. Only Mentor actions can approve milestones, request revisions, import data, or change permissions. Historical review decisions remain visible.
