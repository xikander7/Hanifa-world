# My Future World MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local-first, mobile-friendly My Future World app from the supplied workbook and approved design specification.

**Architecture:** Next.js App Router with a typed domain model, localStorage repository, workbook import adapter, and feature screens behind a small component system. Supabase and Google OAuth remain production adapters documented for the next deployment stage.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, Vitest, SheetJS (`xlsx`), Lucide icons.

**Spec:** `docs/superpowers/specs/2026-09-25-my-future-world-design.md`

## Global Constraints

- Keep the primary navigation to Home, Journey, Dreams, Quests, and Time.
- Preserve workbook values, comments, links, source sheet, source row, and import timestamp.
- Separate learner activity from mentor-verified progress.
- Only Mentor can approve, request revision, import, export, or change permissions.
- Local mode must run without cloud credentials.
- No production secrets or fake credentials in the repository.

## Review Focus

- Re-importing the same workbook must be idempotent; test stable import keys.
- Hanifa must not approve her own milestone; test role authorization.
- Only one focus timer may run; test timer exclusivity.
- Revision history must remain visible after resubmission; test append-only approvals.
- Empty or malformed workbook rows must produce useful import diagnostics; test parser resilience.

### Task 1: Application foundation and domain contracts

**Files:** Create `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/domain/types.ts`, `src/domain/permissions.ts`, `vitest.config.ts`, `tests/permissions.test.ts`.

- [ ] Write failing permission tests for learner/mentor capabilities.
- [ ] Run the focused Vitest test and confirm it fails because the contracts do not exist.
- [ ] Implement domain types, permission helpers, and minimal Next.js shell.
- [ ] Run focused and full tests.

### Task 2: Workbook importer and seed data

**Files:** Create `src/domain/importWorkbook.ts`, `src/domain/seedData.ts`, `tests/importWorkbook.test.ts`, `scripts/import-workbook.mjs`.

- [ ] Write failing tests for all five sheet mappings, provenance, duplicate keys, and malformed rows.
- [ ] Confirm the focused tests fail.
- [ ] Implement SheetJS parsing and normalized records.
- [ ] Generate checked-in local seed JSON from the supplied workbook.
- [ ] Run import tests and verify row counts against the source workbook.

### Task 3: Local repository and workflow logic

**Files:** Create `src/domain/repository.ts`, `src/domain/localRepository.ts`, `src/domain/workflows.ts`, `tests/workflows.test.ts`.

- [ ] Write failing tests for quest status transitions, timer exclusivity, submissions, revisions, and approvals.
- [ ] Confirm failure for missing repository/workflow behavior.
- [ ] Implement typed localStorage repository with in-memory fallback for tests.
- [ ] Implement append-only submission/approval history and permission checks.
- [ ] Run all unit tests.

### Task 4: App shell and shared UI

**Files:** Create `src/app/globals.css`, `src/components/AppShell.tsx`, `src/components/BottomNav.tsx`, `src/components/RoleSwitcher.tsx`, `src/components/StatCard.tsx`, `src/components/ProgressRing.tsx`, `src/components/EmptyState.tsx`.

- [ ] Add component tests for navigation labels, role switch, and empty states.
- [ ] Implement responsive shell, warm visual system, and accessible controls.
- [ ] Verify mobile and desktop layouts locally.

### Task 5: Home, Journey, and Dreams

**Files:** Create route components under `src/app/(app)/home`, `journey`, and `dreams`, plus feature components under `src/components/features/`.

- [ ] Add tests for imported roadmap and opportunity rendering.
- [ ] Implement learner and mentor Home summaries, Journey worlds/skills, university cards, scholarships, and ranking detail.
- [ ] Verify real workbook data is visible and no giant spreadsheet UI is used for learner screens.

### Task 6: Quests, Time, and mentor review

**Files:** Create routes under `src/app/(app)/quests`, `time`, and `mentor`, plus forms and cards under `src/components/features/`.

- [ ] Add tests for quick quest creation, manual time entry, timer save, and review actions.
- [ ] Implement learner quest flow, focus timer, manual logs, evidence links, comments, submissions, and mentor review queue.
- [ ] Verify approval/revision history remains visible.

### Task 7: Import UI, export, documentation, and verification

**Files:** Create `src/app/(app)/mentor/import/page.tsx`, `src/domain/exportData.ts`, `.env.example`, `README.md`, `supabase/migrations/001_initial_schema.sql`, `tests/exportData.test.ts`.

- [ ] Write failing export tests for workbook-compatible data output.
- [ ] Implement Mentor-only import preview/commit and CSV/JSON export.
- [ ] Add Supabase-ready schema and setup documentation without requiring cloud credentials locally.
- [ ] Run the full test suite, lint, typecheck, and production build.
- [ ] Commit the working MVP.

