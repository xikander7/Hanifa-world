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

- `/home` — learner and mentor overview
- `/journey` — Skill Adventure roadmap with learning steps, notes, proof links, and Mentor guidance
- `/dreams` — Dream Board with a ranked university shortlist, editable notes, and scholarship checklist
- `/quests` — quick quests and completion state
- `/time` — Updates & Time journal with dated learning reflections, manual time logs, screenshots, and Mentor feedback
- `/mentor` — Mentor dashboard with quest review, activity notes, roadmap guidance, and university status controls

## Production transition

The next deployment stage replaces the local repository with Supabase Postgres/Auth/Storage, adds Google sign-in restricted by `MENTOR_EMAIL` and `HANIFA_EMAIL`, and deploys to Vercel. Keep service-role and Google secrets server-side. The local role switch is a demo convenience and must not be used as production authorization.

## Product principles

Activity is separate from Mentor-verified progress. Hanifa can record learning, time, quests, questions, and evidence. Only Mentor actions can approve milestones, request revisions, import data, or change permissions. Historical review decisions remain visible.
