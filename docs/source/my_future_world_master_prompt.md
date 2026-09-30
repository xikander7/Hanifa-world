# BUILD A COMPLETE WORKING WEB APP: “MY FUTURE WORLD”

Act as a senior product designer, UX designer, database architect, and full-stack engineer.

Build a complete, working, mobile-first web application called:

# My Future World

This is a private family mentoring application for exactly two primary users:

1. **Mentor / Admin** — Xander
2. **Student / Learner** — Hanifa

Both users will sign in using their own Google/Gmail accounts.

The application is NOT intended to be a generic productivity tool, project-management system, school LMS, or childish game.

Its purpose is to make Hanifa’s:

- learning,
- career preparation,
- university preparation,
- scholarship research,
- projects,
- daily work,
- time tracking,
- tasks,
- accountability,
- evidence of progress,
- and mentoring from Xander

simple, enjoyable, visual, motivating, and measurable.

The experience for Hanifa should feel like:

**“I am building my future and unlocking my next level.”**

The experience for Xander should feel like:

**“I can clearly see what Hanifa is working on, how much time she is spending, what she has learned, what needs my review, and whether she is truly progressing.”**

---

# 1. VERY IMPORTANT PRODUCT PRINCIPLES

The application must remain SIMPLE.

Do not turn this into an ERP, complicated LMS, enterprise project-management system, or analytics dashboard.

A teenage student should understand the interface within approximately five minutes.

Prioritize:

**Simple > powerful**

**Visual > text-heavy**

**Actionable > analytical**

**Encouraging > controlling**

**Proof of learning > course completion**

**Consistency > meaningless XP**

Gamification should make the application enjoyable, but the app must still be useful and serious underneath.

The application must distinguish between:

### Activity

Things Hanifa can record herself:

- studying
- practicing
- working
- completing tasks
- logging hours
- uploading proof
- writing comments

and:

### Verified Progress

Important milestones that only the Mentor can approve.

Hanifa must NEVER be able to approve her own major learning milestone.

---

# 2. INPUT FILE / EXISTING DATA

An Excel workbook will be provided together with this prompt.

The workbook is currently the working system being used to manage Hanifa’s education, learning roadmap, university choices, scholarship research, and weekly progress.

Treat the Excel workbook as the INITIAL SOURCE OF TRUTH.

Import its useful data into the application.

The workbook contains these sheets:

### 1. Weekly Learning Updates

Contains information such as:

- Week
- Current Topic
- Progress %
- What I Learned
- Practice Completed
- Proof / Link
- Difficulty
- Hanifa Blockers / Questions
- Hanifa Comments
- Mentor/Sikander Review

Import these as historical learning updates / weekly reviews.

Do NOT discard comments or proof links.

### 2. Hanifa Training Plan

This is the main career/technology learning roadmap.

It includes fields such as:

- #
- Topic
- Approximate time
- What she must learn
- Depth / comment
- Hanifa Comments
- Hanifa Notes
- Sikander Comments

This sheet should become the foundation of the **Journey / Career Learning Roadmap**.

Example topics include things such as:

Computer Basics

Internet / Networking

Excel / Google Sheets

Cloud

Linux

VS Code

Programming Logic

Python

SQL / PostgreSQL

Git / GitHub

HTML / CSS

JavaScript basics

JSON

APIs

Postman

Projects

Deployment / Vercel

Docker

Cybersecurity

AI coding tools

Automation

Preserve the sequence from Excel unless Mentor later changes it.

### 3. Pakistan Uni Options

Import the university information into the education/university section.

Preserve all meaningful columns from Excel even if not all are immediately shown in the UI.

These records should become university opportunities.

Support fields such as:

- University
- Location
- Degree/program
- estimated cost
- scholarship opportunities
- admission dates
- difficulty
- suitability
- comments
- Mentor recommendation/notes
- status

The current strategy and decisions recorded in the workbook should be preserved.

### 4. Scholarship Links

Import scholarship opportunities.

Fields include information such as:

- Rank
- Country
- University
- Scholarship application link
- University information/application link
- How to apply

Preserve links.

Each scholarship should become an interactive opportunity card.

### 5. Scholarship Options Ranking

Import country-level scholarship research.

Fields include information such as:

- Rank
- Country
- example universities
- scholarship route
- estimated tuition before scholarship
- estimated living costs
- ability to work/support oneself
- job prospects after degree
- likely application dates
- admission difficulty
- suitability for Computer Science
- comments

This information should help power scholarship targeting but should NOT overwhelm Hanifa’s normal interface.

Most detailed comparison information should be more visible in Mentor Mode.

---

# 3. EXCEL IMPORT STRATEGY

Create an Admin function:

# Import Excel

Only the Mentor can use it.

When an Excel workbook is uploaded:

1. Detect the expected sheets.
2. Show an import preview.
3. Map workbook records to the correct application entities.
4. Preserve the original imported values.
5. Import cleanly into the database.
6. Do not create duplicate records if the same workbook is imported again.
7. Use stable IDs / normalized keys when possible.
8. Never overwrite newer Mentor edits silently.
9. Show conflicts before replacing edited application data.
10. Record:
   - imported_at
   - source_sheet
   - source_row
   - source_file_name

Also support:

# Export Data

Allow Mentor to export current application data to:

- Excel
- CSV where appropriate

The web application should become the main day-to-day system after initial import.

Do NOT attempt unreliable continuous synchronization with a local `.xlsx` file.

Future Google Sheets synchronization can be added later if needed.

---

# 4. USERS AND SECURITY

There are only two approved primary users.

Use Google Sign-In.

Create environment/configuration values such as:

MENTOR_EMAIL

HANIFA_EMAIL

Only those exact approved Google email addresses should be allowed into the application.

Unauthorized Google users should receive:

“You do not have access to this Future World.”

Do not allow public registration.

---

# 5. USER ROLES

## HANIFA — Student/Learner

Hanifa can:

- view her roadmap
- view current learning focus
- view assigned tasks
- create personal tasks
- start/stop timers
- manually log time
- add comments
- record what she learned
- record what she practiced
- upload proof
- add links
- ask questions
- identify blockers
- complete task checklists
- submit tasks for review
- submit milestones for Mentor approval
- research/save scholarships
- add notes
- propose goals
- complete weekly reflections

Hanifa CANNOT:

- approve her own milestone
- change Mentor approval status
- mark a skill as “Verified”
- unlock Mentor-controlled learning levels
- delete Mentor feedback
- change system permissions
- import Excel
- change users

## XANDER — Mentor/Admin

Mentor can:

- see everything
- edit everything
- import/export Excel
- create learning milestones
- edit learning roadmap
- assign tasks
- create quests
- create challenges
- set expected completion time
- set deadlines
- create recurring tasks
- review Hanifa submissions
- approve milestones
- reject/request revision
- leave Mentor comments
- award verified achievements
- unlock next learning stages
- manage scholarship priorities
- manage university priorities
- review weekly progress
- see time reports
- see overdue work
- see blockers
- see unanswered questions
- manage allowed users
- manage system settings

---

# 6. PRIMARY NAVIGATION

Hanifa’s main navigation should contain only five simple items:

# 🌸 Home

# 🗺 Journey

# 🎓 Dreams

# ⚡ Quests

# ⏱ Time

Use a mobile bottom navigation bar.

On desktop, use an elegant sidebar or compact navigation.

Do NOT add 10–15 navigation items.

Secondary features should exist inside these five areas.

There should also be one clear floating:

# +

button.

The + button can provide:

- New Quest
- Log Learning
- Log Time
- Add Opportunity
- Add Achievement / Evidence
- Ask Mentor / Add Question

Mentor should have access to a:

# Mentor Mode

through their profile/menu.

Do not expose Mentor Mode to Hanifa.

---

# 7. VISUAL STYLE

The application should feel:

- modern
- youthful
- warm
- clean
- premium
- playful
- motivating

But NOT:

- childish
- cartoon-heavy
- cluttered
- corporate
- overly pink
- overly gamified

Think:

modern learning application + cozy game + clean productivity application.

Use:

- rounded cards
- friendly typography
- large readable headings
- subtle gradients
- progress rings
- illustrated icons
- small animations
- satisfying task-completion animation
- gentle celebratory animation when a verified milestone is approved
- plenty of whitespace

Avoid excessive charts.

Avoid giant tables in Hanifa’s interface.

Tables are acceptable in Mentor Mode where useful.

Provide several visual themes such as:

- Dreamy
- Nature
- Space
- Minimal
- Cozy

Theme should change appearance only, never functionality.

---

# 8. HOME — HANIFA VIEW

The Home screen is the most important screen.

It should answer:

### What should I do today?

### How am I progressing?

### What is coming next?

Do not fill it with analytics.

Example structure:

---

Good Morning Hanifa 🌸

Level 5 — Explorer

🔥 6 Day Streak

⭐ 1,420 XP

---

## TODAY’S MAIN MISSION

Computer Basics

8 of 11 missions complete

Progress visual

[ Continue ]

---

## TODAY’S QUESTS

☐ Watch networking lesson

☐ Practice 20 minutes

☐ Create professional AI video

Each quest can show:

- category icon
- expected time
- XP
- deadline if relevant

---

## TIME TODAY

2h 15m logged

[ Start Focus ]

[ Add Time ]

---

## WAITING FOR MENTOR

1 milestone waiting for review

Show small status card.

---

## NEXT UNLOCK

Networking World

---

## UPCOMING

Scholarship deadline — 8 days

Project due — Friday

Study session — 5:00 PM

---

Do not show more than necessary.

---

# 9. HOME — MENTOR VIEW

Mentor Home should prioritize oversight.

Example:

# Hanifa — This Week

Active Days: 5 / 7

Learning Time: 8h 20m

Project/Work Time: 4h 10m

Quests Completed: 17 / 21

Current Skill: Computer Basics

Submissions Waiting: 2

Questions Waiting: 1

Overdue Tasks: 2

---

## MENTOR INBOX

Show:

- milestone submissions
- task submissions
- scholarship readiness submissions
- questions
- blockers

Each should have:

Review

Approve

Needs Revision

Comment

---

## ATTENTION NEEDED

Examples:

Networking marked difficult

Task overdue

Scholarship deadline approaching

No learning activity for several days

Never make alerts judgmental.

---

# 10. JOURNEY — CAREER & LEARNING ROADMAP

This is one of the core features.

Convert the Excel training plan into a visual learning journey.

Do NOT display the roadmap primarily as an Excel-style table.

Organize topics into logical “Worlds” or sections.

Example:

# FOUNDATION WORLD

Computer Basics

Internet & Networking

Excel / Sheets

---

# TECH WORLD

Cloud

Linux

VS Code

---

# CODING WORLD

Programming Logic

Python

SQL / PostgreSQL

Git / GitHub

---

# BUILDER WORLD

HTML / CSS

JavaScript Basics

JSON / APIs

Postman

Projects

Vercel

---

# PROFESSIONAL WORLD

Docker

Cybersecurity

AI Coding

Automation

The exact grouping can be adjusted based on workbook contents.

---

# 11. SKILL PROGRESSION

Do not represent learning only with arbitrary percentages.

Each skill can progress through:

### 🌱 Discovering

“I know what it is.”

### 📚 Learning

“I understand the basics.”

### 🧪 Practicing

“I can complete exercises.”

### 🛠 Building

“I can use this in a practical project.”

### 🏆 Proven

“I have Mentor-approved evidence.”

Only Mentor approval can set an important skill to **Proven**.

---

# 12. SKILL DETAIL PAGE

Example:

# SQL

Current stage: Practicing

XP: 430

Learning Time: 8h 25m

---

## MISSIONS

✓ SELECT

✓ WHERE

✓ GROUP BY

◉ JOIN

○ Subqueries

○ Window Functions

---

## PRACTICE

47 exercises recorded

---

## BUILD

Student Database Project

Status: In Progress

---

## PROOF

GitHub URL

Screenshots

Project

Certificate

---

## HANIFA NOTES

Her own notes/reflections.

---

## MENTOR FEEDBACK

Mentor comments.

---

## BOSS CHALLENGE

Build a PostgreSQL database and demonstrate required queries.

[ Submit for Mentor Review ]

---

# 13. LEARNING PHILOSOPHY

Where appropriate, structure learning as:

# LEARN → PRACTICE → BUILD → PROVE

Watching videos alone must not equal mastery.

Examples:

Python:

Learn fundamentals

Practice exercises

Build useful program

Submit evidence

Mentor verifies

SQL:

Learn SQL

Practice queries

Build database

Publish/project proof

Mentor verifies

GitHub:

Learn Git concepts

Create repositories

Commit properly

Publish project

Mentor verifies

---

# 14. QUESTS — TASK MANAGEMENT

Keep Quest management almost as simple as Todoist.

Primary sections:

# Today

# Upcoming

# Completed

Optional filters:

Career

Study

Scholarship

Project/Work

Personal

Each Quest may contain:

- title
- description
- category
- due date
- scheduled date/time
- expected duration
- actual duration
- priority
- XP
- subtasks
- evidence requirement
- related skill
- related scholarship
- related university
- related project
- Mentor assigned or self-created
- status
- comments
- proof
- calendar event ID

Statuses:

Planned

In Progress

Submitted

Mentor Review

Needs Revision

Approved

Completed

A simple task that does not require Mentor verification can be completed normally.

Important milestones/tasks can require Mentor approval.

---

# 15. QUEST LANGUAGE

Gamify lightly.

Possible labels:

⚡ Quick Quest

✨ Side Quest

🎯 Main Quest

👑 Boss Quest

Do not make every task sound like an RPG.

Use these labels only when they add enjoyment.

---

# 16. TASK ASSIGNMENT BY MENTOR

Mentor should be able to create something like:

# Create Professional AI Video

Category:

Project / Real Work

Expected time:

3 hours

Due:

Friday

Instructions:

Create a professional video using the supplied images and AI video workflow.

Proof required:

Final video link/upload

Mentor approval required:

Yes

Reward:

100 XP

When Hanifa receives the task, it appears on:

Home

Quests

Calendar if scheduled

Time tracking selection list

---

# 17. DAILY TIME TRACKING

Time tracking is a CORE feature.

Create a dedicated:

# ⏱ Time

screen.

It must support two ways to record time.

## OPTION A — START FOCUS TIMER

Hanifa chooses:

Task / Quest

Category

Then presses:

# ▶ Start Focus

Show a clean running timer.

Only one timer may run at once.

When she presses:

# Stop

ask:

### What did you accomplish?

Short text field.

### Any issue or blocker?

Optional.

### Add proof?

Optional.

Save automatically as a Time Log.

## OPTION B — MANUAL TIME ENTRY

Allow:

Date

Start time

End time

or Duration

Related Quest

Category

Description

What I did

Blocker/Issue

Proof/Link

Comments

---

# 18. TIME CATEGORIES

Use simple categories:

📚 Learning

🎓 Studies

💼 Project / Real Work

💎 Scholarship

🏫 University Preparation

🧪 Practice

👤 Personal

Mentor can add/edit categories later.

---

# 19. DAILY TIME SCREEN

Show:

# Today

Total: 3h 40m

AI Video — 1h 35m

SQL — 45m

Networking — 50m

Scholarship Research — 30m

Below:

[ Start Focus ]

[ Add Time ]

[ Daily Note ]

---

# 20. TIME REPORTS

Allow:

Today

Week

Month

Show useful totals such as:

Total learning time

Total project/work time

Study time

Scholarship time

Active days

Top skill by time

Expected vs Actual task time

Example:

AI Video

Expected: 2h

Actual: 3h 45m

This teaches estimation and work planning.

Avoid complex workforce-style timesheets.

---

# 21. DAILY NOTES

Each day Hanifa may write one optional:

# Daily Update

Simple fields:

What did I accomplish today?

What was difficult?

What should I continue tomorrow?

Mentor can comment.

This should become part of the historical record.

---

# 22. COMMENTS / CONVERSATION

The application should allow Hanifa and Mentor to communicate around actual work.

Create comment threads attached to:

- Quest
- Milestone
- Skill
- Time Log if needed
- Scholarship
- University
- Weekly Review

Each comment must show:

- author
- timestamp
- message

Unread comments should produce a small notification badge.

Do not create a complicated standalone chat application.

The purpose is contextual conversation.

---

# 23. PROOF / EVIDENCE

Evidence is important.

Allow Hanifa to attach:

- URL
- GitHub URL
- Google Drive URL
- screenshot
- image
- small document
- video link
- certificate link
- project link
- text explanation

Avoid storing large video files directly if that risks exceeding free storage.

Prefer external links such as Google Drive, YouTube private/unlisted, GitHub, or other services for large media.

Store screenshots/small proof files only when necessary.

---

# 24. MENTOR APPROVAL SYSTEM

This is critical.

Major workflow:

# Planned

↓

# In Progress

↓

# Submitted by Hanifa

↓

# Mentor Review

↓

Either:

# ✅ Approved

or

# 🔄 Needs Revision

When Mentor chooses Needs Revision:

Require or encourage a feedback comment.

Example:

“Good first version. Please improve the transitions and resubmit.”

The task returns to Hanifa.

Hanifa performs the revision and may log additional time.

All revisions must remain visible in history.

Do not destroy old submissions.

---

# 25. MILESTONE APPROVAL

Important milestone example:

# SQL Basics

Requirements:

✓ Required lessons

✓ Exercises

✓ Practice minimum

✓ Mini project

✓ Reflection

✓ Proof

When requirements are satisfied, Hanifa can:

# Submit for Mentor Review

Mentor receives:

Learning time

Missions completed

Practice completed

Evidence

Hanifa reflection

Comments

Mentor can:

Approve

Needs More Work

Add Challenge

Add Comment

Only after Mentor approval should the next locked milestone become available if sequential locking is enabled.

---

# 26. ACTIVITY PROGRESS VS VERIFIED PROGRESS

Never confuse activity with skill mastery.

Show two concepts when useful:

# Activity

How much work has been done.

and:

# Mentor Verified

How much has been validated.

Example:

SQL

Activity: 90%

Verified Stage: Practicing

This prevents fake progress.

XP and time spent do NOT automatically make a skill Proven.

---

# 27. XP

Use XP only for motivation.

Award XP for meaningful activity such as:

Learning session

Practice

Completing Quest

Submitting project

Completing weekly review

Mentor-approved milestone

Do not award unlimited XP for repetitive meaningless activity.

Consider daily/repeated XP limits.

Mentor-approved milestones should earn more XP than simply logging time.

---

# 28. STREAKS

Track:

Learning streak

and preferably:

Active learning days

Do not punish Hanifa aggressively for missing one day.

A streak is motivational, not disciplinary.

Allow Rest Days if easy to implement.

---

# 29. ACHIEVEMENTS

Achievements should represent meaningful accomplishments.

Examples:

First Week Completed

First 10 Learning Hours

Computer Basics Verified

Networking Verified

First SQL Project

First Python Project

First GitHub Repository

First 30-Day Learning Streak

First Scholarship Application

First University Application

First Certificate

First Freelance/Real Work Project

100 Learning Hours

Do not create dozens of meaningless badges.

---

# 30. DREAMS — EDUCATION / UNIVERSITY / SCHOLARSHIPS

The Dreams area represents Hanifa’s future education opportunities.

Use three internal sections:

# My Education Goal

# Universities

# Scholarships

Do not make these three separate main navigation tabs.

---

# 31. EDUCATION GOAL

Show primary objective such as:

BS Computer Science

Current preferred university

Current preparation status

Major next steps

Relevant dates

Example:

# My Big Dream

BS Computer Science

Primary Path:

University of Sindh

Status:

Preparing

Readiness:

60%

Parallel Goal:

Build strong job-ready technology skills while studying.

---

# 32. UNIVERSITY CARDS

University cards should show only the most useful information initially.

Example:

# University of Sindh

BS Computer Science

Hyderabad/Jamshoro

Status: Primary Target

Estimated affordability: Strong

Admission status: Preparing

[ View Details ]

Details can include imported research.

Mentor sees more detailed comparative fields.

---

# 33. SCHOLARSHIP HUNT

Make scholarships visually engaging.

Example:

# Türkiye Scholarships 🇹🇷

Funding:

Fully Funded Opportunity

Target:

Computer Science

Status:

Watching

Readiness:

40%

Important Deadline:

Date / Expected Window

Checklist:

✓ Eligibility reviewed

☐ Academic documents

☐ Motivation letter

☐ Recommendation

☐ Application

Buttons:

View

Save

Create Quest

Add Deadline to Calendar

Submit Readiness to Mentor

---

# 34. SCHOLARSHIP PIPELINE

Use statuses:

Saved

Researching

Eligible / Not Yet Confirmed

Preparing

Mentor Review

Ready

Applied

Waiting

Interview

Accepted

Not Selected

Archived

Important eligibility confirmation should allow Mentor verification.

---

# 35. STALE SCHOLARSHIP INFORMATION

The supplied Excel workbook contains scholarship dates and research collected at particular times.

Do NOT assume old dates remain current forever.

Every scholarship/university opportunity should support:

Last Verified Date

Needs Reverification flag

Source URL

Mentor notes

If a date has passed, visually show:

Needs Update

instead of silently presenting it as current.

Do not automatically invent new scholarship dates.

---

# 36. WEEKLY REVIEW

Automatically generate a weekly summary from recorded data.

Example:

# My Week

Active Days: 5

Learning: 6h 30m

Projects: 4h 10m

Quests Completed: 16

Quests Outstanding: 3

Skills Practiced: SQL, Networking

Milestones Submitted: 1

Achievements: 1

Then ask Hanifa:

### What went well?

### What was difficult?

### What do you want to focus on next week?

Hanifa submits the weekly review.

---

# 37. MENTOR WEEKLY REVIEW

Mentor receives:

Hanifa activity summary

Learning time

Project time

Completed tasks

Missed/overdue tasks

Current skills

Milestone submissions

Blockers

Hanifa reflection

Then Mentor can:

Approve weekly plan

Modify next-week focus

Add Mentor feedback

Assign quests

---

# 38. GOOGLE CALENDAR INTEGRATION

Google Calendar integration is required but should remain optional if a user has not connected Calendar yet.

Each user can connect their own Google Calendar account.

The app should be the PRIMARY source of truth for tasks.

Calendar should handle scheduling/reminders.

Support calendar synchronization for:

Scheduled Quests

Study Sessions

Project Work Sessions

University deadlines

Scholarship deadlines

Mentor review sessions

Important milestones

---

# 39. CALENDAR EVENT CREATION

When scheduling a Quest:

Title:

SQL Practice

Date:

Tuesday

Time:

5:00–5:45 PM

Allow:

# Add to Google Calendar

Store the Google Calendar event ID in the database.

If the date/time is changed in the app, update the corresponding calendar event.

If the task is cancelled, allow deleting/cancelling its calendar event.

Avoid creating duplicate events.

---

# 40. CALENDAR SYNC STRATEGY

For V1:

App remains source of truth.

Sync app → Google Calendar automatically when an event is created/updated.

When user opens the application or presses:

# Sync Calendar

check relevant connected events and detect meaningful Google Calendar changes.

If a calendar time changed externally, allow the user to accept the calendar change into the application.

Do not build an unnecessarily complicated enterprise calendar synchronization engine.

---

# 41. GOOGLE OAUTH

Use proper Google OAuth.

Google Sign-In identity scopes and Google Calendar authorization should be handled securely.

Calendar access tokens / refresh tokens must NEVER be exposed to the browser unnecessarily.

Store sensitive tokens securely server-side.

Request the minimum calendar scopes required.

Do not request Gmail access.

Do not leave the final application dependent on an OAuth project remaining in temporary/testing mode if that causes refresh-token expiry.

Provide setup instructions for moving the OAuth configuration to an appropriate production configuration for the two approved users.

---

# 42. NOTIFICATIONS

Create simple in-app notifications.

Examples:

Mentor assigned you a new Quest.

Mentor approved SQL Basics.

Mentor requested changes to AI Video.

Scholarship deadline in 7 days.

Quest due tomorrow.

Hanifa submitted a milestone.

Hanifa asked a question.

Do not require a paid notification service.

Browser notifications can be optional.

---

# 43. DATABASE

Use a relational database.

Recommended core entities:

profiles

worlds

skills

skill_missions

quests

quest_subtasks

time_logs

daily_notes

weekly_reviews

comments

evidence

submissions

approvals

universities

scholarships

scholarship_requirements

achievements

user_achievements

notifications

calendar_connections

calendar_events

imports

import_records

settings

Keep schema normalized but not unnecessarily complex.

---

# 44. IMPORTANT DATA RELATIONSHIPS

A Quest may optionally belong to:

Skill

Project

Scholarship

University

Milestone

A Time Log may belong to:

Quest

Skill

Project

Scholarship

University

A Submission should belong to the object being reviewed.

An Approval should record:

reviewer

review date

decision

feedback

submission ID

Preserve audit history.

---

# 45. SECURITY / ROW LEVEL SECURITY

Use secure database authorization.

Hanifa should be able to access only this shared Future World and her own permitted data.

Mentor should have administrative access.

Only Mentor role may:

approve milestones

change Mentor approval fields

import Excel

manage permissions

unlock Mentor-controlled milestones

Avoid relying only on hidden UI buttons.

Enforce permissions at the database/server level.

---

# 46. FILE STORAGE

Use free-tier storage carefully.

Good for:

screenshots

small proof images

small PDFs

certificates

Avoid:

large videos

large raw project files

For large media, encourage external links.

---

# 47. SEARCH

Provide simple search for:

Quests

Skills

Scholarships

Universities

Comments

Do not build advanced enterprise search.

---

# 48. MOBILE FIRST

The application will frequently be used from a phone.

Design mobile first.

Requirements:

large touch targets

readable typography

bottom navigation

fast forms

minimal typing

responsive cards

no horizontal spreadsheet scrolling

Desktop should provide more information where useful, especially in Mentor Mode.

---

# 49. PWA

If practical, make this a Progressive Web App.

Allow:

Add to Home Screen

App-like mobile experience

Basic offline shell/caching

Do not make PWA requirements block the core application.

---

# 50. TECHNOLOGY STACK

Use a free-tier-friendly modern stack.

Preferred:

### Frontend

Latest stable Next.js

TypeScript

App Router

Tailwind CSS

shadcn/ui or similarly lightweight components

Lucide icons

### Backend / Database

Supabase

PostgreSQL

Supabase Auth

Supabase Storage

Row Level Security

### Hosting

Vercel Hobby / free personal project hosting

### Excel

Use a maintained JavaScript Excel library such as SheetJS/XLSX for import.

Do not require Microsoft Excel server APIs.

### Calendar

Google Calendar API

### Source Control

GitHub

Do not introduce paid APIs.

Do not require OpenAI/Claude/Gemini API for V1.

AI features may be added later but the application must work completely without AI.

---

# 51. COST REQUIREMENT

This is a private family/personal application for two users.

The goal is:

# $0/month infrastructure cost

Use free tiers responsibly.

No credit-card-required service should be essential to basic operation if avoidable.

If any chosen service has a free-tier limit, document the limit.

Design around two users, not thousands.

---

# 52. DO NOT BUILD THESE IN V1

Do NOT waste time implementing:

social network

public profiles

public leaderboard

complex chat

resume builder

job scraping

AI chatbot

AI API calls

financial accounting

full LMS

video hosting

advanced Pomodoro system

complex note-taking application

complex Kanban

complex Gantt chart

enterprise dashboards

Do the core application extremely well first.

---

# 53. QUICK INPUT EXPERIENCE

Entering activity must be fast.

A typical learning log should take less than approximately 30 seconds.

Example:

# Log Learning

Topic:

SQL

Duration:

45 minutes

Type:

Practice

What did you do?

Practiced INNER JOIN and LEFT JOIN.

Difficulty:

Easy / Okay / Hard

Optional Proof

Save

That is enough.

---

# 54. MENTOR CHECK AND BALANCE

The app must make this workflow extremely reliable:

# Mentor assigns / roadmap defines work

↓

# Hanifa performs work

↓

# Hanifa records time and comments

↓

# Hanifa attaches evidence

↓

# Hanifa submits

↓

# Mentor reviews

↓

# Mentor approves OR requests revision

↓

# Record is preserved

↓

# Verified progress changes

↓

# Next milestone may unlock

This workflow is one of the most important parts of the entire application.

---

# 55. REAL WORK / PROJECT TRACKING

Hanifa is also doing practical projects such as:

professional AI image creation

AI video generation

editing

prompting

creative software use

future freelance work

Treat this as a valid category:

# 💼 Project / Real Work

Example:

Quest:

Create professional video for Mentor.

Expected:

2 hours

Actual:

3h 15m

Work Log:

Image generation — 45m

Video generation — 1h

Editing — 1h

Final export — 30m

Result:

Video URL

Hanifa Comment:

Had to regenerate two clips.

Mentor Feedback:

Approved. Save the successful prompt workflow.

This history should remain available later.

---

# 56. PORTFOLIO / PROOF VAULT

Within Journey, include a simple Proof/Achievement area.

Allow the application to gradually collect:

Projects

GitHub repositories

Videos

Certificates

Screenshots

Presentations

Professional images

Web apps

Scholarship submissions

Major accomplishments

Later this can help build Hanifa’s portfolio.

Do not make it another primary navigation item.

---

# 57. FUN WITHOUT LOSING PURPOSE

The app should reward:

Consistency

Learning

Practice

Projects

Verified milestones

Applications

Achievements

not meaningless clicking.

Possible subtle rewards:

XP

Level

Streak

Badge

World unlock

New visual theme item

Celebration animation

Do not include complicated virtual currencies.

---

# 58. LEVELS

Use simple meaningful levels.

Example:

Level 1 — Explorer

Level 2 — Learner

Level 3 — Practitioner

Level 4 — Builder

Level 5 — Creator

Level 6 — Achiever

Level 7 — Future Professional

Levels may use XP thresholds, but critical career competency must still depend on verified skills.

---

# 59. AUDIT HISTORY

Important changes should be traceable.

Track:

task creation

task completion

submissions

revision requests

approvals

milestone completion

time logs

Mentor comments

scholarship status changes

Do not allow critical history to vanish accidentally.

---

# 60. SOFT DELETE

For important records such as:

Quests

Milestones

Scholarships

Universities

Time Logs

prefer archive/soft-delete where reasonable.

Mentor should be able to recover accidentally archived information.

---

# 61. EMPTY STATES

Empty pages should be friendly and useful.

Example:

“No Quests yet. Add one small mission for today.”

Not:

“No records found.”

---

# 62. ERROR STATES

Use human-readable errors.

Example:

“Calendar connection needs to be refreshed.”

instead of raw API messages.

---

# 63. DEMO / INITIAL SETUP

After database creation:

1. Import the supplied Excel workbook.
2. Build the Journey from the training plan.
3. Import historical weekly learning updates.
4. Import universities.
5. Import scholarships.
6. Import scholarship country rankings.
7. Create profiles for Mentor and Hanifa after their first approved Google login.
8. Preserve Excel notes/comments.
9. Identify the current learning topic where possible.
10. Display imported history immediately.

Do not seed fake production data when real Excel data exists.

---

# 64. FIRST LOGIN — HANIFA

Show a very short welcome:

# Welcome to Your Future World 🌸

Your learning journey, goals and opportunities are all in one place.

Then show:

Current Mission

Today’s Quests

Time Today

Next Unlock

Do not force a long onboarding tutorial.

---

# 65. FIRST LOGIN — MENTOR

Show:

# Mentor Dashboard

Current Learning Stage

Pending Reviews

This Week

Upcoming Deadlines

Then allow:

Assign Quest

Review Submission

Manage Journey

Import Data

---

# 66. ACCESSIBILITY

Ensure:

good contrast

keyboard usability where practical

visible focus states

readable font sizes

icons accompanied by understandable text

color is not the only indicator of status

---

# 67. PERFORMANCE

The app should feel fast.

Avoid huge libraries unnecessarily.

Lazy-load large screens where appropriate.

Optimize images.

Do not reload the entire page after simple actions.

Use optimistic UI carefully for non-critical actions.

Approval decisions should wait for confirmed server response.

---

# 68. BACKUPS

Provide Mentor with a simple export function.

At minimum:

Export learning data

Export tasks

Export time logs

Export scholarships/universities

Export weekly reviews

Prefer one downloadable workbook containing multiple sheets.

This provides protection if the app is ever discontinued.

---

# 69. SETTINGS

Mentor settings can include:

Approved Gmail addresses

Display names

Time zone

XP settings

Theme options

Learning streak settings

Calendar connection

Export

Excel import

Do not expose unnecessary technical settings.

---

# 70. TIMEZONE

Store timestamps in UTC.

Display according to each user’s selected timezone.

This is important because Mentor may travel between U.S. states while Hanifa may be in Pakistan.

Do not assume both users are in the same timezone.

Deadlines should clearly display the intended timezone when relevant.

---

# 71. DATABASE / CODE QUALITY

Requirements:

TypeScript strict mode where reasonable

clean components

reusable server/database layer

SQL migrations

seed/import scripts

environment variables

secure secrets handling

basic validation

clear error handling

no hard-coded credentials

no exposed service-role keys

no insecure client-side approval logic

---

# 72. REQUIRED ENVIRONMENT VARIABLES

Design configuration for values similar to:

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

MENTOR_EMAIL

HANIFA_EMAIL

GOOGLE_CLIENT_ID

GOOGLE_CLIENT_SECRET

GOOGLE_CALENDAR_REDIRECT_URI

APP_URL

Never commit secrets to Git.

Provide `.env.example`.

---

# 73. README

Create a detailed README containing:

Project purpose

Architecture

Local setup

Supabase setup

Database migration steps

Google Sign-In setup

Google Calendar API setup

How to configure the two Gmail addresses

How to import the Excel workbook

How to deploy to Vercel

How to export data

How to troubleshoot Calendar authentication

How to recover data

How Mentor permissions work

---

# 74. TEST THESE USER FLOWS

Before considering the app complete, manually test:

### Authentication

Mentor approved Gmail can login.

Hanifa approved Gmail can login.

Third Gmail account cannot access.

### Excel

Excel workbook imports successfully.

Training plan appears in Journey.

Weekly history appears.

University information appears.

Scholarship information appears.

Repeated imports do not create obvious duplicates.

### Quest

Mentor assigns Quest.

Hanifa sees Quest.

Quest appears on Home.

Hanifa starts timer.

Timer stops correctly.

Time log is attached.

Hanifa adds comment/proof.

Hanifa submits.

Mentor receives review notification.

Mentor requests revision.

Hanifa sees feedback.

Hanifa resubmits.

Mentor approves.

Final history remains visible.

### Milestone

Hanifa completes learning missions.

Hanifa submits milestone.

Mentor approves.

Skill becomes Mentor Verified.

Next locked milestone unlocks.

### Calendar

User connects Google Calendar.

Scheduled Quest creates calendar event.

Changing Quest schedule updates event.

Deleting/cancelling scheduled Quest handles event correctly.

No duplicate events occur.

Disconnected calendar does not break the app.

### Time Tracking

Timer works.

Manual time entry works.

Only one live timer at a time.

Weekly totals calculate correctly.

Monthly totals calculate correctly.

Expected vs Actual displays correctly.

### Scholarship

Scholarship imported from Excel.

Deadline can become calendar event.

Requirements can become Quests.

Status can change.

Mentor can review readiness.

Stale information can be marked Needs Update.

---

# 75. ACCEPTANCE CRITERIA

The application is successful when:

Hanifa can open the app and immediately understand what she should do today.

Logging study/work takes less than approximately one minute.

Mentor can understand weekly activity within approximately one minute.

Mentor can see pending approvals immediately.

A learning milestone cannot become verified without Mentor approval.

Every meaningful task can have time associated with it.

Time history can be reviewed by week/month.

Scholarship and university information from Excel is accessible without overwhelming Hanifa.

Calendar reminders work.

The interface feels enjoyable rather than administrative.

The application can operate for the two users using free tiers.

The app is responsive on phone and desktop.

Data can be exported.

---

# 76. PRIORITY ORDER IF DEVELOPMENT TIME IS LIMITED

If everything cannot be completed at once, prioritize in this exact order:

### PRIORITY 1

Google authentication

Two-user role security

Database

Excel import

### PRIORITY 2

Home

Quests

Time Tracking

Comments

### PRIORITY 3

Journey

Milestones

Mentor approval

Evidence

### PRIORITY 4

Dreams

Universities

Scholarships

Deadlines

### PRIORITY 5

Google Calendar

Weekly Review

Notifications

### PRIORITY 6

XP

Streaks

Achievements

Animations

Themes

Never sacrifice reliable tracking/security for decorative gamification.

---

# 77. FINAL DESIGN PHILOSOPHY

The application should feel like this to Hanifa:

# “What can I accomplish today?”

not:

“What form do I need to update?”

The application should feel like this to Mentor:

# “I can see exactly what is happening and verify progress.”

not:

“I need to inspect multiple spreadsheets.”

The system should convert:

GOALS

↓

LEARNING PATH

↓

QUESTS

↓

TIME + ACTIVITY

↓

PROOF

↓

MENTOR REVIEW

↓

VERIFIED ACHIEVEMENT

↓

NEXT UNLOCK

The app’s underlying philosophy is:

# PLAN → LEARN → PRACTICE → BUILD → PROVE → REVIEW → IMPROVE

Keep that philosophy consistent throughout the product.

---

# 78. BUILD REQUIREMENT

Do not only generate mockups.

Do not only generate static pages.

Do not return a design prototype with non-working buttons.

Build the actual working application including:

authentication

database

permissions

CRUD operations

Excel import

task management

time logging

comments

approvals

roadmap

scholarships

universities

calendar integration

responsive interface

deployment configuration

README

The final result must be capable of being deployed and used by the two real users.

Use the supplied Excel workbook as real initial application data.

Make sensible product decisions when small details are unspecified.

Prefer the simplest reliable implementation.

Do not add unnecessary features without a clear benefit.

The final product should be:

# SIMPLE + FUN FOR HANIFA

# CONTROLLED + USEFUL FOR MENTOR

# FREE OR NEAR-ZERO COST TO RUN

# ACTUALLY USABLE EVERY DAY
