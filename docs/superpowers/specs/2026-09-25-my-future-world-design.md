# My Future World Design Specification

## Purpose

My Future World is a private, mobile-first mentoring application for exactly two primary users: Sikander as Mentor/Admin and Hanifa as Student/Learner. It turns the existing Excel workflow into a daily product for learning, quests, time tracking, evidence, university choices, scholarships, and mentor verification.

The first milestone is a complete local MVP that is useful without cloud credentials. It uses the supplied workbook as initial source data, preserves source values and provenance, and leaves clear adapters for Supabase, Google OAuth, and Vercel deployment.

## Scope and staged delivery

The local MVP includes:

- responsive app shell with Home, Journey, Dreams, Quests, and Time navigation;
- local persistent data store backed by browser storage, with a typed repository boundary;
- import of the five workbook sheets into normalized records;
- learner activity logging, quests, time logs, evidence links, comments, and weekly updates;
- mentor review, revision requests, and approval history;
- separate learner and mentor views selected by a local demo role switch;
- normalized seed/import data derived from the supplied workbook;
- tests for import mapping, permission rules, timer behavior, and approval transitions;
- `.env.example`, database-ready types, migration notes, and deployment documentation.

The next deployment stage adds Supabase Auth/Postgres/Storage, Google sign-in restricted by `MENTOR_EMAIL` and `HANIFA_EMAIL`, and Vercel configuration. Google Calendar, push notifications, and richer gamification remain staged follow-up work after the core workflow is stable.

## Product boundaries

Activity and verified progress remain separate. Hanifa can log work, submit evidence, and request review. Only Mentor actions can approve milestones, set a skill to Proven, unlock controlled stages, import workbook data, or change permissions. Historical submissions and revision decisions are append-only in the activity history; important records are archived rather than hard-deleted.

The learner experience stays card-based and visual. Mentor Mode may use denser tables and review queues. Primary navigation remains limited to five areas, with secondary features nested inside those areas.

## Architecture

The project is a Next.js App Router TypeScript application with Tailwind CSS and lightweight component primitives. Domain logic lives in small typed modules independent of React. UI screens consume repository interfaces rather than reading storage directly.

The repository boundary has two implementations:

1. `localRepository` persists JSON in browser localStorage for immediate local use and deterministic tests.
2. `supabaseRepository` is the production adapter, enabled when Supabase configuration exists.

Import parsing is isolated in a workbook adapter. It accepts the supplied `.xlsx`, identifies sheets by expected names, normalizes headers, preserves raw values, and attaches `sourceSheet`, `sourceRow`, `sourceFileName`, and `importedAt`. Stable keys prevent duplicate imports; newer mentor edits are never silently overwritten.

## Core domain model

The MVP models profiles, worlds, skills, weekly reviews, quests, quest subtasks, time logs, daily notes, comments, evidence, submissions, approvals, universities, scholarships, scholarship rankings, notifications, and import records. Each entity has a stable ID, timestamps, and archive state where applicable.

The key workflow is:

`planned -> in_progress -> submitted -> mentor_review -> approved | needs_revision`

An approval stores reviewer, decision time, feedback, and submission ID. Skill activity percentage is calculated from completed work, while verified stage changes only after mentor approval.

## Main screens

- **Home:** learner today view with current mission, quests, time today, pending review, and next unlock; mentor view with weekly activity, pending submissions, blockers, and overdue work.
- **Journey:** roadmap worlds and skill cards derived from the training plan, with activity stage, verified stage, missions, notes, and evidence.
- **Dreams:** education goal, university cards, scholarship cards, ranking detail, status, deadlines, and mentor notes.
- **Quests:** Today, Upcoming, Completed, filters, quick creation, task detail, evidence, comments, and submission/revision state.
- **Time:** focus timer with one active timer at a time, manual entry, daily totals, category totals, and weekly/monthly summaries.
- **Mentor Mode:** review queue, approval controls, import/export entry points, and settings.

## Data import mapping

- `Weekly Learning Updates` -> `weekly_reviews` and attached evidence/comments.
- `Hanifa Training Plan` -> ordered `worlds` and `skills`, preserving topic sequence and notes.
- `Pakistan Uni Options` -> `universities`, including the stated Sindh University decision.
- `Scholarship Links` -> `scholarships` with application and official information links.
- `Scholarship Options Ranking` -> `scholarship_rankings` with country-level comparison fields.

The import preview shows detected sheets, row counts, skipped rows, and conflicts before committing. Re-importing the same source file and stable row key is idempotent.

## Security and production transition

The local demo role switch is explicitly labeled demo-only. Production authorization is enforced server-side through Supabase Auth and row-level policies. Approved email addresses are configured through environment variables; unauthorized users receive a human-readable access error. Service-role keys stay server-side, and Google Calendar tokens are never exposed to the browser.

## Error handling and accessibility

Forms validate required fields and show plain-language errors. Empty states explain the next useful action. Color is never the only status indicator; controls have labels, focus states, and touch targets suitable for mobile use. Import failures identify the sheet and row without discarding successful records.

## Verification strategy

Unit tests cover workbook mapping, stable import keys, role permissions, quest status transitions, timer exclusivity, and mentor approval. Browser-level checks cover the local navigation and the core learner/mentor workflow. A production readiness checklist documents the Supabase and Vercel setup still required after the local MVP.

