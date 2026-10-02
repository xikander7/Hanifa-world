# My Future World

My Future World is a learning app made for Hanifa, with her mentor Sikander helping along the way. It helps her learn
tech skills level by level, keep a diary of what she studied, play quizzes and flashcards, earn trophies, plan for
university and scholarships, and ask for help when she's stuck. Calm focus music plays in the background (with a volume
control), and Sikander can fix or remove anything he adds as mentor.

This README has two parts:

1. **[Learn how this app is built](#part-1-learn-how-this-app-is-built)**: explained from zero, like you're 10 years old.
   Read this if you want to understand the technologies and ideas behind the app.
2. **[Technical notes](#part-2-technical-notes)**: exact commands and details for whoever works on the code.

## Live site

<https://hanifa-world-vercel-xikander7s-projects.vercel.app>

---

## Part 1: Learn how this app is built

## 1. What is a web app, really?

A **website** is a set of pages you look at. A **web app** is a website you can *do things* with: type, save, click
buttons, play games. Gmail, YouTube and Canva are web apps. My Future World is one too.

Every web app has the same three jobs:

| Job | Simple meaning | In this app |
| --- | --- | --- |
| **Show things** | Draw buttons, text, colours and pictures on the screen | React, Next.js, Tailwind CSS |
| **Remember things** | Keep your diary, quiz scores and trophies so they're still there tomorrow | Your browser's storage + a Google spreadsheet |
| **Share things** | Let Hanifa's phone, her laptop and Sikander's laptop see the same data | A small Google Apps Script program ("Cloud save") |

Think of the app like a **school notebook**:

- The **pages and drawings** are the part you see (the *frontend*).
- The **notebook in your bag** is where your work is kept (the *storage*).
- A **photocopy in the teacher's cupboard** is the backup the teacher can also read (the *cloud*).

## 2. The big picture

```text
   Hanifa's phone           Hanifa's laptop          Sikander's laptop
  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
  │  The app     │         │  The app     │         │  The app     │
  │  (React)     │         │  (React)     │         │  (Mentor)    │
  │  + browser   │         │  + browser   │         │  + browser   │
  │    storage   │         │    storage   │         │    storage   │
  └──────┬───────┘         └──────┬───────┘         └──────┬───────┘
         │  sends changes in about a second, fetches every 15 s │
         └──────────────────┬──────────────────────────────┘
                            ▼
              ┌──────────────────────────────┐
              │  Cloud save                  │
              │  (Google Apps Script)        │──── checks the Mentor PIN
              │                              │──── emails Sikander when needed
              └──────────────┬───────────────┘
                             ▼
       ┌───────────────────────────┐   ┌─────────────────────────────┐
       │ Private data spreadsheet  │   │ Hanifa's working Google     │
       │ (the app's saved data)    │   │ Sheet (her study notes)     │
       └───────────────────────────┘   └─────────────────────────────┘

  The website itself (the code that draws the pages) is stored and served by  ►  Vercel
```

In words:

1. **Vercel** is where the website lives on the internet. When you type the web address, Vercel sends the app to your
   browser.
2. The app runs **inside your browser** (Chrome, Safari…). It saves your work straight away in the browser's own little
   storage box, so it works even with no internet. Screenshots go in a second, much bigger box (see "Browser storage"
   below).
3. If **Cloud save** is turned on, the app also sends changes to a small program running in Sikander's Google account.
   That program keeps a copy in a private Google spreadsheet, so every device can get the same data.
4. The app also **reads Hanifa's Google Sheet** (the spreadsheet where she already writes weekly updates and hours) and
   shows those entries in her diary.

## 3. The programming languages used

A programming language is a way to write instructions a computer can follow. Different languages are good at
different jobs, just like you'd use a pencil to write and a paintbrush to paint.

| Language | What it's for | Where you'll find it |
| --- | --- | --- |
| **TypeScript** (`.ts`, `.tsx`) | The main language of the app. All the logic and all the pages are written in it. | Almost everything in [src/](src/) and [tests/](tests/) |
| **JavaScript** (`.js`, `.mjs`) | TypeScript's "parent". Browsers only understand JavaScript, so TypeScript is turned into JavaScript before it runs. | [apps-script/Code.js](apps-script/Code.js), [scripts/import-workbook.mjs](scripts/import-workbook.mjs) |
| **JSX / TSX** | A way to write HTML-looking tags *inside* TypeScript, so you can describe a page and its logic in one place. | Every file ending in `.tsx` |
| **CSS** | Tells the browser how things *look*: colours, sizes, spacing, animations. | [src/app/globals.css](src/app/globals.css) and Tailwind classes |
| **HTML** | The skeleton of every web page (headings, buttons, boxes). Here it is written through JSX, not by hand. | Produced by the `.tsx` files |
| **JSON** | Not a programming language, but a way to write data neatly, like a labelled list. | [src/data/](src/data/) (`seed.json`, `roadmap.json`…) |
| **SQL** | The language databases understand. Used here only in a plan for the future (see Supabase below). | [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql) |
| **Markdown** (`.md`) | Simple text with `#` for headings and `**` for bold. This README is written in it! | `README.md`, [docs/](docs/) |

### Why TypeScript instead of plain JavaScript?

JavaScript lets you make mistakes quietly. Imagine a recipe that says "add sugar" but doesn't say how much. TypeScript
adds **types**, which are labels that say what kind of thing each value is: a number, some text, a list, true/false.

```ts
// A "type" is like a form with labelled boxes. Every Comment must fill in all of these:
type Comment = { id: string; by: "mentor" | "hanifa"; text: string; at: string };
```

If someone tries to make a comment with `by: "teacher"`, TypeScript shows a red line **before** the app even runs,
because only `"mentor"` or `"hanifa"` are allowed. It catches spelling mistakes and mix-ups early. You can see real
types in [src/lib/data.ts](src/lib/data.ts) and [src/domain/types.ts](src/domain/types.ts).

## 4. Every technology used, one by one

### React: building pages out of LEGO bricks

**What it is:** A JavaScript library (a ready-made toolbox of code) made by Meta (Facebook) for building screens.

**The big idea:** You build a page out of small reusable pieces called **components**, like LEGO bricks. A
`ProgressBar` brick, a `StatCard` brick, a `Nova` (mascot) brick. You then snap them together to build a whole page.

```tsx
// A component is a function that returns what should appear on screen.
function Hello({ name }: { name: string }) {
  return <p>Hi {name}! Ready to learn?</p>;
}
// Use it like an HTML tag:  <Hello name="Hanifa" />
```

**The second big idea, "state":** State is anything that can *change* while you use the app, like the number of
minutes on the focus timer. When state changes, React redraws only the parts of the screen that need it. You don't
have to repaint the page yourself.

**Where:** All the bricks are in [src/components/](src/components/) (for example
[ProgressBar.tsx](src/components/ProgressBar.tsx), [Nova.tsx](src/components/Nova.tsx),
[Celebrate.tsx](src/components/Celebrate.tsx)).

### Next.js: the frame that holds the React house together

**What it is:** A *framework* built on top of React, made by the company Vercel. If React gives you bricks, Next.js
gives you the plan for the whole house: rooms, doors between rooms, and the wiring.

**What it does for this app:**

- **Pages from folders (routing).** Every folder inside [src/app/](src/app/) with a `page.tsx` file becomes a page. The
  folder `src/app/(app)/learn/` becomes the address `/learn`. No extra setup needed. (The `(app)` in brackets is a
  "group": it shares one layout, the menu and top bar, without adding `/app` to the address.)
- **Layouts.** [src/app/layout.tsx](src/app/layout.tsx) is the frame around every page. It loads fonts, sets the page
  title, and tells search engines not to list this private app.
- **Building.** `pnpm build` squeezes all the code into small, fast files ready for the internet.
- **Fonts.** `next/font/google` downloads the Google Fonts *Bricolage Grotesque* (headings) and *Plus Jakarta Sans*
  (body text) and serves them from the app itself.
- **Redirects.** In [next.config.ts](next.config.ts), the old address `/journey` sends you on to `/adventure`.

**"use client":** Many files start with `"use client"`. That line tells Next.js "this code runs in the browser", which
it needs to because it uses the browser's storage, sounds and clicks.

### Tailwind CSS: styling with tiny labels

**What it is:** A CSS tool. Normally you write CSS rules in a separate file. With Tailwind you put short class names
right on the element:

```tsx
<button className="rounded-full bg-brand px-4 py-2 font-bold text-white">Start</button>
```

`rounded-full` = round corners, `bg-brand` = the theme colour, `px-4` = padding left and right, `font-bold` = thick text.
Tailwind turns those names into real CSS for you.

**Where:** The settings are in [tailwind.config.ts](tailwind.config.ts). That's where the app's custom colours
(`brand`, `ink`), fonts, shadows and fun **animations** (float, wiggle, pop, twinkle, flame…) are defined.

**Colour themes ("worlds"):** Hanifa can pick Candy Land, Space Adventure or Ocean World. Each theme is a set of **CSS
variables** (named colours) plus its own things drifting in the background, in [src/app/globals.css](src/app/globals.css).
Switching the theme swaps the variables, and every button and card changes colour at once.

**Helpers:** **PostCSS** and **Autoprefixer** ([postcss.config.mjs](postcss.config.mjs)) run behind the scenes.
Autoprefixer adds extra lines so the styles also work in older browsers.

### Lucide icons

**What it is:** A free set of simple line icons (the little house, trophy, book and compass pictures in the menu),
used through the `lucide-react` package.

### Browser storage (localStorage): the app's pocket notebook

**What it is:** Every browser gives each website a small private storage box called **localStorage**. It holds text
under a name (a "key"), like labelled jars on a shelf. It stays there after you close the tab.

**How the app uses it:** Everything Hanifa does is saved here first, the moment she does it. The list of jar names
(keys) is in [src/lib/data.ts](src/lib/data.ts) (for example `future-world-quests`). The little tool that reads and
writes the jars, and tells every part of the screen to update, is [src/lib/store.ts](src/lib/store.ts).

**Why this matters:** This is called **local-first**. The app works instantly and even offline, because it never has to
wait for the internet to save. The internet is only used to *share* the data.

**The second, bigger box: IndexedDB.** localStorage only holds about 5 MB for the whole app. That's plenty for words:
six months of diary entries and comments is about 1–2 MB. But one screenshot is about 300 KB, so a couple of dozen would
fill it. So screenshots are kept in **IndexedDB**, another storage box every browser has, which can hold hundreds of MB.
The diary entry only keeps a short label for its screenshot, like `img:img_3c80381…`, the way a library card points to
a book on a shelf. Code: [src/lib/images.ts](src/lib/images.ts).

### Google Apps Script: "Cloud save" (the app's backend)

**What it is:** A free way to write small JavaScript programs that run on Google's computers, inside your own Google
account. They can read and write Google Sheets and send Gmail.

**Why it's used:** A **backend** is the part of an app that runs on a server, not on your device. It is needed for two
things here: keeping one shared copy of the data, and keeping secrets (like the Mentor PIN) out of the app's code,
where anyone could read them. Apps Script does both for free, without renting a server.

**Where:** [apps-script/Code.js](apps-script/Code.js). It is published as a **web app**: a web address that the app sends
messages to. It understands six requests:

| Request | Meaning |
| --- | --- |
| `ping` | "Are you there?" |
| `login` | "Here's the Mentor PIN, am I allowed in?" If yes, it hands back a signed **token** (like a wristband at a theme park). |
| `pull` | "What changed since I last asked?" |
| `push` | "Here are my changes, please save them." Mentor-only changes are refused without a valid token. |
| `putImage` | "Please keep this screenshot." It goes into its own **images** tab, once. |
| `getImage` | "Please send me that screenshot." Devices ask only when they need to show it, then keep a copy. |

It also emails Sikander when Hanifa asks a question or sends work to review, and can send Hanifa a friendly daily
reminder if she hasn't studied yet that day. How to set it up: [docs/cloud-setup.md](docs/cloud-setup.md).

### Google Sheets

Google Sheets is used in two ways:

1. **As a simple database.** Cloud save stores the app's data in a private spreadsheet. A **database** is just an
   organised place to keep data. A spreadsheet is a simple one. Screenshots have their own **images** tab in it.
2. **As Hanifa's study notebook.** She already records her weekly updates and hours in a Google Sheet. The app reads
   those pages as **CSV** (plain text where commas separate the columns) straight from Google, and turns each row into a
   diary entry. Code: [src/lib/liveSheet.ts](src/lib/liveSheet.ts) and [src/domain/sheetSync.ts](src/domain/sheetSync.ts).

### Vercel: where the website lives

**What it is:** A **hosting** company. Hosting means keeping your website on computers that are always on and connected
to the internet, so anyone can open it with a web address. Vercel is made by the same people who make Next.js, so
they fit together nicely.

**Deploying** means uploading a new version of the app so the live site updates. This project isn't linked to GitHub,
so pushing code to GitHub does **not** change the website. A new version is deployed by uploading the code with the
`vercel` command (see [Hosting](#hosting)).

**Environment variables:** Some settings shouldn't be written inside the code, like the Cloud save address. They are
put in Vercel's project settings instead, as **environment variables** (named settings the app reads when it's built).
This app uses `NEXT_PUBLIC_CLOUD_URL`. Locally, the same setting goes in a file called `.env.local`, and
[.env.example](.env.example) shows what names exist.

### Supabase: planned, not used yet

**What it is:** Supabase is an online **database** service (built on a database called PostgreSQL). It stores data in
proper tables and also handles logins.

**Is it used?** **Not yet.** The project contains a plan for it:

- [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql) describes the tables a real
  database would have (`profiles`, `skills`, `quests`, `time_logs`, `submissions`, `approvals`). A **migration** is a
  file of instructions that builds or changes a database's tables. A **schema** is the plan of those tables, like the
  column headings of a spreadsheet.
- [.env.example](.env.example) has empty `SUPABASE_...` settings waiting to be filled in.
- [src/domain/repository.ts](src/domain/repository.ts) describes *what* saving and loading must do, without saying
  *where*. [src/domain/localRepository.ts](src/domain/localRepository.ts) is one version of it. A Supabase version could
  be added later without rewriting the rest of the app. This idea is called an **interface**: a promise about what
  something can do, like "any charger that fits this plug will work".

The app chose Google Apps Script instead for now because it's free, needs no extra account, and already sits next to
Hanifa's Google Sheet.

### Node.js and pnpm: the workshop tools

- **Node.js** lets JavaScript run on your own computer, outside a browser. All the building and testing tools need it.
- **pnpm** is a **package manager**. A **package** is code someone else wrote that you can reuse (React is a package,
  Tailwind is a package). pnpm downloads the packages listed in [package.json](package.json) into a folder called
  `node_modules`. [pnpm-lock.yaml](pnpm-lock.yaml) records the exact versions, so everyone gets the same ones.
- **Scripts** in `package.json` are shortcuts: `pnpm dev` starts the app, `pnpm test` runs the tests, and so on.

### Vitest: robot checkers (tests)

**What it is:** A **testing** tool. A **test** is a little program that checks another program gives the right answer.

```ts
it("climbs on a smooth curve", () => {
  expect(xpForLevel(3)).toBe(200);   // "Level 3 should need exactly 200 XP"
});
```

If someone later changes the XP rules by mistake, the test fails and shows exactly what broke. There are tests for
the game points, flashcards, sheet syncing, Cloud save merging and Mentor permissions in [tests/](tests/). Run them with
`pnpm test`. Settings are in [vitest.config.ts](vitest.config.ts).

### SheetJS (`xlsx`): reading Excel files

The app started from an Excel workbook ([docs/source/Hanifa Admission Working.xlsx](docs/source/)). The `xlsx` package
reads Excel files. [scripts/import-workbook.mjs](scripts/import-workbook.mjs) uses it to turn the workbook's five sheets
into [src/data/seed.json](src/data/seed.json), the starting data for the app. Mentor Hub can also accept a downloaded
`.xlsx` or `.csv` file.

### Web Audio API: sounds and music with no sound files

The "pop", "correct" and "level up" sounds aren't recordings. [src/lib/sfx.ts](src/lib/sfx.ts) makes them by asking the
browser to play musical notes at certain frequencies (a frequency is how high or low a note is). An **API** is a set of
buttons a program is allowed to press on another program; here, the browser's sound system.

The **background music** is made the same way, live, by [src/lib/music.ts](src/lib/music.ts): calm focus music with soft
chords, a gentle bass and a quiet beat, played in a loop. A little **scheduler** plans the next notes a moment ahead,
like a conductor reading the next bar. Browsers don't allow sound until you tap the page, so the music starts on the
first tap. The top bar (and the side menu) has 🎵 to switch it on or off and − / + buttons for the volume. It pauses
when the tab is hidden.

### ChatGPT link (Ask for Help)

The Ask for Help page doesn't talk to an AI itself. [src/lib/askPrompt.ts](src/lib/askPrompt.ts) builds a clear,
well-written question from a 3-step form, then opens ChatGPT with it already typed in. That keeps it free: no AI account
or API key is needed.

### Git: a time machine for code

**Git** saves snapshots of the code called **commits**, each with a message saying what changed ("Simpler, playful
layout: 5 tabs…"). You can see what changed, when, and go back if something breaks. Try `git log` in the project folder.

## 5. Important ideas (concepts) you can learn from this app

| Idea | Simple meaning | Where to see it |
| --- | --- | --- |
| **Frontend vs backend** | Frontend = what runs on your device and what you see. Backend = what runs on a server. | Frontend: [src/](src/). Backend: [apps-script/Code.js](apps-script/Code.js) |
| **Components** | Reusable screen pieces, like LEGO bricks. | [src/components/](src/components/) |
| **State** | Data that changes while you use the app; the screen follows it. | `useLocalStore` in [src/lib/store.ts](src/lib/store.ts) |
| **Hooks** | React functions starting with `use` that give a component a superpower (remember something, tick every second…). | [useGame.ts](src/lib/useGame.ts), [useNow.ts](src/lib/useNow.ts), [useFocus.ts](src/lib/useFocus.ts) |
| **Routing** | Which page shows for which web address. | Folders in [src/app/(app)/](src/app/(app)/) |
| **Local-first** | Save on the device first, share later. Works offline. | [src/lib/store.ts](src/lib/store.ts) |
| **Syncing** | Making several devices end up with the same data. | [src/lib/cloud.ts](src/lib/cloud.ts) |
| **Merging conflicts** | If two devices changed the same thing, combine both instead of losing one. Called a *three-way merge*: it compares both new versions with the older version they both started from. | `merge3` in [src/domain/cloudSync.ts](src/domain/cloudSync.ts) |
| **Derived data** | Don't store what you can calculate. XP, streaks and badges are worked out fresh from the diary and quiz history every time, so they can never be counted twice. | [src/lib/game.ts](src/lib/game.ts) |
| **Spaced repetition** | Flashcards you know well come back less often; tricky ones come back sooner. Cards move up "boxes" as you get them right (a card in box 3 counts as mastered). | [src/lib/game.ts](src/lib/game.ts), [src/data/lessons.ts](src/data/lessons.ts) |
| **Gamification** | Using game ideas (XP points, levels, streaks, trophies, celebrations) to make learning fun. | [src/lib/game.ts](src/lib/game.ts), [Celebrate.tsx](src/components/Celebrate.tsx) |
| **Roles and permissions** | Hanifa and the Mentor can do different things. Only the Mentor can approve work. | [src/domain/permissions.ts](src/domain/permissions.ts) |
| **Authentication** | Proving who you are (the Mentor PIN). | `login` in [apps-script/Code.js](apps-script/Code.js) |
| **Tokens** | After a correct PIN, the device gets a signed pass, so it doesn't send the PIN every time. | `mentorToken` in [apps-script/Code.js](apps-script/Code.js) |
| **Server-side checks** | Rules checked by the server can't be skipped by changing the app on your own device. | `mentorOnlyChanges` in [apps-script/Code.js](apps-script/Code.js) |
| **Secrets** | Passwords and keys are never written in the code; they live in settings only the owner can see. | Script Properties, environment variables |
| **Rate limiting** | After 5 wrong PINs, sign-in is locked for 15 minutes so no one can guess forever. | `MAX_PIN_TRIES` in [apps-script/Code.js](apps-script/Code.js) |
| **Stable IDs** | Each sheet row gets a fixed name (`sheet-time-2026-09-29`), so syncing again updates it instead of copying it. | [src/domain/sheetSync.ts](src/domain/sheetSync.ts) |
| **Automated tests** | Code that checks code. | [tests/](tests/) |
| **Responsive design** | One layout that works on a phone and a laptop (bottom bar on phones, side menu on laptops). | [src/components/AppShell.tsx](src/components/AppShell.tsx) |
| **Accessibility** | Making the app usable for everyone, for example `aria-label` text that screen readers speak aloud. | Buttons in [AppShell.tsx](src/components/AppShell.tsx) |
| **Privacy** | This private app tells search engines not to list it. | `robots` in [src/app/layout.tsx](src/app/layout.tsx) |
| **Keeping big things apart** | Big files (screenshots) are stored separately from small text, so saving a comment never re-sends pictures. | [src/lib/images.ts](src/lib/images.ts) |
| **Graceful fallback** | If one part is older than the other (an old Cloud save script), the app quietly falls back to the old way instead of breaking. | `putBackInline` in [src/lib/images.ts](src/lib/images.ts) |
| **Backups** | A copy you keep yourself, in case something goes wrong. | [StorageHealth.tsx](src/components/StorageHealth.tsx) |

## 6. A tour of the folders

```text
Hanifa-world/
├── src/                     ← the app itself
│   ├── app/                 ← pages (Next.js turns each folder into a web address)
│   │   ├── layout.tsx       ← the frame around every page (fonts, title)
│   │   ├── page.tsx         ← the welcome page at "/"
│   │   ├── globals.css      ← colours, themes, background
│   │   └── (app)/           ← all the inside pages: home, learn, time, mentor…
│   ├── components/          ← reusable LEGO bricks (Nova, ProgressBar, ShareCard…)
│   ├── lib/                 ← helpers: storage, game points, sounds, Cloud save, sheet reading
│   ├── domain/              ← the rules: merging, permissions, sheet parsing (no screens here)
│   └── data/                ← starting data and lessons (JSON and TypeScript)
├── apps-script/Code.js      ← the Cloud save backend (runs on Google)
├── tests/                   ← automated checks (Vitest)
├── scripts/                 ← one-off tools, like importing the Excel workbook
├── supabase/                ← a database plan for the future (not used yet)
├── docs/                    ← setup guides, design notes and the original source files
├── package.json             ← the list of packages and command shortcuts
├── tailwind.config.ts       ← styling settings and animations
├── next.config.ts           ← Next.js settings
├── tsconfig.json            ← TypeScript settings
└── .env.example             ← the names of settings you can fill in
```

**Why are `lib` and `domain` separate?** `domain` holds the pure *rules* (how to merge two lists, who may approve
work). It doesn't touch the screen or the browser, which makes it easy to test. `lib` connects those rules to the
browser (storage, sounds, fetching). Keeping rules apart from screens is a common habit of good programmers.

## 7. The journey of one diary entry

Let's follow one thing Hanifa does, from start to finish:

1. Hanifa opens **My Diary** and writes "Practised Python loops for 30 minutes", then presses Save.
2. **React** runs the save code in [src/app/(app)/time/page.tsx](src/app/(app)/time/page.tsx).
3. [store.ts](src/lib/store.ts) writes it into **localStorage** right away. Every part of the screen that shows the
   diary updates.
4. [game.ts](src/lib/game.ts) recalculates her **XP and streak**. If she reached a new level,
   [Celebrate.tsx](src/components/Celebrate.tsx) throws confetti and [sfx.ts](src/lib/sfx.ts) plays a sound.
5. Less than a second later, [cloud.ts](src/lib/cloud.ts) **pushes** the change to the Cloud save web app over the
   internet. (If she added a screenshot, it is uploaded first, on its own.)
6. [Code.js](apps-script/Code.js) saves it in the private spreadsheet, copies it to the **App Journal** tab of her working
   sheet, and emails Sikander if she asked a question.
7. On Sikander's laptop, the app **pulls** changes every 15 seconds. The new entry appears in his **Mentor Hub**.
8. He types a comment. It travels back the same way and shows up in Hanifa's diary. If he made a typo, he can press ✏️
   to fix it or 🗑️ to delete it.

If Hanifa had no internet in step 5, the entry would wait safely on her device and be sent when she's back online.

## 8. Want to learn these yourself? A suggested order

1. **HTML and CSS**: make a simple page about yourself. (Free: [MDN Learn web development](https://developer.mozilla.org/en-US/docs/Learn))
2. **JavaScript**: variables, lists, functions, `if`, loops. (Free: [javascript.info](https://javascript.info))
3. **Git**: save your work and see its history. (Free: [GitHub Skills](https://skills.github.com))
4. **TypeScript**: add types to your JavaScript. ([typescriptlang.org/docs](https://www.typescriptlang.org/docs/))
5. **React**: build with components and state. ([react.dev/learn](https://react.dev/learn))
6. **Tailwind CSS**: style quickly. ([tailwindcss.com/docs](https://tailwindcss.com/docs))
7. **Next.js**: pages, layouts and deploying. ([nextjs.org/learn](https://nextjs.org/learn))
8. **Testing with Vitest**: write checks for your code. ([vitest.dev](https://vitest.dev/guide/))
9. **Deploying on Vercel**: put your app online. ([vercel.com/docs](https://vercel.com/docs))
10. **Databases**: Google Sheets and Apps Script first ([developers.google.com/apps-script](https://developers.google.com/apps-script)),
    then SQL and Supabase ([supabase.com/docs](https://supabase.com/docs)).

## 9. Mini dictionary

| Word | Meaning |
| --- | --- |
| **API** | A set of rules for how one program asks another program for something. |
| **Backend** | The part of an app that runs on a server, not on your device. |
| **Browser** | The program you use to open websites (Chrome, Safari, Edge). |
| **Build** | Turning the code you write into small, fast files a browser can run. |
| **Cloud** | Computers owned by someone else (like Google) that you use over the internet. |
| **Component** | A reusable piece of screen, like a LEGO brick. |
| **CSV** | A plain text table where commas separate the columns. |
| **Database** | An organised place to store data so it can be found again. |
| **Deploy** | Put a new version of the app online. |
| **Environment variable** | A named setting given to the app from outside the code. |
| **Framework** | A ready-made structure you build your app inside (Next.js). |
| **Frontend** | The part of the app you see and click. |
| **Hosting** | Keeping a website on always-on computers so people can visit it. |
| **JSON** | A neat text format for data: `{ "name": "Hanifa", "level": 3 }`. |
| **Library / package** | Code someone else wrote that you can reuse. |
| **IndexedDB** | A much bigger storage box in the browser, used here for screenshots. |
| **localStorage** | A small storage box the browser gives each website. |
| **Merge** | Combining two sets of changes into one. |
| **Offline** | No internet connection. |
| **Repository (repo)** | The folder that holds a project's code and its Git history. |
| **Route** | A web address inside the app, like `/learn`. |
| **Server** | A computer that answers requests from other computers. |
| **State** | Data that can change while the app is open. |
| **Sync** | Making two places have the same data. |
| **Test** | Code that checks other code works. |
| **Token** | A signed pass that proves you already logged in. |
| **Type** | A label for what kind of value something is (number, text, list…). |

---

## Part 2: Technical notes

## Run locally

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>. It runs without any credentials. Mentor sign-in needs Cloud save: put the web app address in `.env.local` as `NEXT_PUBLIC_CLOUD_URL` (see `docs/cloud-setup.md`), then choose “Mentor sign in” and enter the Mentor PIN.

To share progress between devices, turn on **Cloud save**: follow [docs/cloud-setup.md](docs/cloud-setup.md) (about 10 minutes, once).

## Hosting

Hosted on Vercel (project `hanifa-world-vercel`). Cloud save is connected through the `NEXT_PUBLIC_CLOUD_URL` environment variable in Vercel's project settings. The project is **not linked to GitHub**: pushing to `main` does not update the site. Deploy from the project folder:

```bash
pnpm dlx vercel deploy --prod --yes
```

Wait for "Production … ready", then hard-refresh the site (Cmd+Shift+R). If a build sits on "Creating an optimized production build" for more than 5 minutes, stop it (Ctrl+C) and run it again; `vercel ls hanifa-world-vercel` shows each deployment's status.

**Changing `apps-script/Code.js`** is a separate step: paste the whole file into the Apps Script project, then **Deploy → Manage deployments → ✏️ → Version: New version → Deploy** (keeps the same web address). See [docs/cloud-setup.md](docs/cloud-setup.md).

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

If the shell can't find `node` or `pnpm`, they are installed by pnpm in `~/Library/pnpm`:

```bash
export PATH="$HOME/Library/pnpm/nodejs/24.21.0/bin:$HOME/Library/pnpm:$PATH"
```

## Pages

The menu shows five main tabs, then "More", then Mentor Hub for the mentor.

| Route | Menu name | What it does |
| --- | --- | --- |
| `/` | | Animated landing page |
| `/guide` | How to use this app | Kid-friendly, step-by-step explanation of every tab, plus a dictionary and FAQ (first in the menu) |
| `/home` | My Day | Nova the mascot, daily goals, focus timer, messages from Mentor, streak calendar, and a "copy my update for Sikander" report |
| `/adventure` | Level Map | 20-level world map with playlists, missions, proof for Mentor verification, and level-clear celebrations (`/journey` redirects here) |
| `/learn` | Quiz & Cards | Brain Gym: 120 flashcards (spaced repetition), three quizzes per level (Easy 4, Medium 6, Hard 6 questions = 320 in total), and the Daily 3 |
| `/time` | My Diary | Time logs, reflections, questions for Mentor, proof, screenshots, and comment threads (she can edit or delete her own entries and comments) |
| `/me` | My Trophies | XP, level, badges and achievements |
| `/quests` | Mini Missions | Missions assigned by Mentor or added by Hanifa, with submit-for-review. She can edit or delete her own missions; Mentor's are his to change |
| `/ask` | Ask for Help | A 3-step form that writes a clear, teacher-style question (with her current level) and opens ChatGPT with it already typed in. No API key or cost; `src/lib/askPrompt.ts` builds the message. "My questions" lists what she asked; Sikander can add his own explanation and she can reply |
| `/dreams` | Dream Schools | University shortlist, scholarship hunt, country comparison, Mentor notes |
| `/sheet` | Study Sheet | Opens Hanifa's shared Google Sheet, syncs it on demand, and explains each of its pages in plain words |
| `/mentor` | Mentor Hub | Its own menu: **To do** (reviews, questions, unanswered entries, her ChatGPT questions), **Her Diary**, **Progress** (14-day chart, level-by-level mastery, verify and level feedback), **Messages & Missions**, and **Settings** (Cloud save, sheet sync, Storage & backup) |

## Syncing Hanifa's Google Sheet

Her **Weekly Learning Updates** and **Time Tracking Daily** pages sync into the journal automatically. The sheet is shared as "Anyone with the link", so the browser reads each page as CSV from Google (`/gviz/tq?tqx=out:csv`, which allows cross-origin requests) — no sign-in or server needed. The app syncs when it opens, when the tab comes back into view, and at most once a minute while open (`src/lib/liveSheet.ts`). There is also a **Sync now** button on the Study Sheet page and in Mentor Hub → Settings.

- Entries get stable ids (`sheet-weekly-N`, `sheet-time-YYYY-MM-DD`), so re-syncing updates instead of duplicating.
- Hanifa's comments and Sikander's review column become chat messages; comments written in the app are kept.
- Rows deleted from the sheet (or whose date changed) are removed from the app, unless someone commented on them in the app.
- The sheet is the source of truth for these entries: in the Journal they show "Edit in sheet" instead of edit/delete.
- If the sheet stops being link-shared, sync shows an error; Mentor Hub still accepts a downloaded .xlsx/.csv.
- Her entries up to 29 Sept 2026 also ship in `src/data/sheetSeed.json`, so it shows up offline.

Going the other way (app → sheet) is part of Cloud save: see below.

## Fixing mistakes (Mentor)

Sikander can correct or remove everything he adds, and tidy up what Hanifa sends:

| What | Where | How |
| --- | --- | --- |
| Comments on diary entries | Her Diary, To do | ✏️ edits his own comments (and old-style notes), 🗑️ deletes any comment |
| Whole diary entries | Her Diary, To do | 🗑️ in the entry's corner |
| Missions | Messages & Missions → "Your missions for Hanifa" | ✏️ edits everything, including status (undo an approval) and feedback; 🗑️ deletes |
| Sent messages | Messages & Missions → Sent messages | ✏️ / 🗑️ on each one |
| Level feedback and verified stamp | Progress → Level by level | "Feedback" to write, change or clear; "Verified" to give or remove |
| Her ChatGPT questions | To do → Questions she asked ChatGPT | 🗑️ removes one |

Entries and comments that come **from the Google Sheet** are copied in again on every sync, so deleting them in the app
wouldn't stick. They show "📊 From the sheet: change it there". Edit or delete the row in the sheet and the app follows.
The same goes for replies typed in the App Journal tab.

## Screenshots, storage and backups (ready for months of data)

- **Words are small.** Six months of daily entries with comments is about 1–2 MB, well within the browser's ~5 MB.
- **Screenshots are kept apart.** They are shrunk to about 300 KB (still readable), saved in the browser's IndexedDB, and
  uploaded once to an `images` tab in the private data spreadsheet (`putImage`). The diary entry stores only `img:<id>`;
  other devices fetch a screenshot (`getImage`) the first time they show it and keep a copy. Older entries that still hold
  the picture itself are moved out automatically when the app starts. Code: `src/lib/images.ts`, `src/components/Screenshot.tsx`.
- **Old Cloud save script?** If it answers `unknown-action`, screenshots go back inside the entries (the old way) and the
  app tries again a day later, so nothing breaks while the script is being updated.
- **Storage & backup** (Mentor Hub → Settings, `src/components/StorageHealth.tsx`) shows how full the device is, how many
  screenshots it keeps and how many are waiting to upload, and downloads a backup file of everything, screenshots
  included. Good habit: once a month.
- The app asks the browser to keep its storage (`navigator.storage.persist()`), and warns once a device is 80% full.
  If a browser clears it anyway, Cloud save brings everything back.

## How XP, streaks and badges work

Everything is **derived from stored activity** in `src/lib/game.ts`, never stored on its own, so it can't be double-counted (quiz XP only counts the best score of each quiz, and pays 10 / 15 / 20 XP per right answer on Easy / Medium / Hard, focus XP is capped per day, and the workbook's sample week is ignored). Teaching content lives in `src/data/lessons.ts`. Hanifa can switch colour themes and sound effects from the sidebar, and the music from the top bar.

## Cloud save and security

Cloud save is a Google Apps Script web app (`apps-script/Code.js`) that runs in Sikander's Google account. It is free and needs no other service:

- **Every device:** the synced keys (`SYNCED_KEYS` in `src/lib/data.ts`) are stored in a private spreadsheet in Sikander's Drive. Each key has a revision; devices pull changes every 15 seconds while the app is on screen and whenever it comes back into view, and push their own changes 0.8 seconds after they happen. Screenshots that haven't been uploaded yet go up before each sync. When two devices changed the same key, `merge3` in `src/domain/cloudSync.ts` merges them (item by item for lists, key by key for objects), so a journal entry on her phone and a comment from Sikander on his laptop both survive. Offline changes are kept and sent later.
- **Two-way sheet sync:** the sheet's own tabs flow into the app (see above), and journal entries written in the app are copied to an **App Journal** tab in the working sheet. A reply typed in its "Sikander's reply" column becomes Sikander's comment in the app.
- **Email alerts:** the script emails Sikander when Hanifa asks for help, sends something to review, or replies, and can email Hanifa a daily reminder (Script Property `HANIFA_EMAIL`; see `docs/cloud-setup.md`).
- **Screenshots:** stored in the `images` tab of the private spreadsheet. Only `data:image/jpeg|png|webp` up to ~1.1 MB under a random id is accepted.
- **Mentor PIN:** with Cloud save on, the PIN is checked by the web app (Script Property `MENTOR_PIN`) and is never in the app's code. Five wrong tries lock sign-in for 15 minutes. A successful sign-in gives that device a signed token; switching back to Hanifa removes it.
- **Mentor-only changes are enforced on the server:** mentor comments, messages, mission approvals and feedback, level verification and Dream notes are refused unless the push carries a valid Mentor token (`mentorOnlyChanges` in `apps-script/Code.js`, tested in `tests/cloudSync.test.ts`).
- Without Cloud save there is no Mentor sign-in: the PIN only exists in the web app's Script Properties, never in the app's code or its history.
- The web app's address is the key to the data: anyone who has it can read the synced data. Only share it through the Mentor Hub link.

## Product principles

Activity is separate from Mentor-verified progress. Hanifa can record learning, time, quests, questions, and evidence. Only Mentor actions can approve milestones, request revisions or send messages, and with Cloud save on, the server enforces that. Mistakes are always fixable: Sikander can edit or delete what he adds, and Hanifa can edit or delete her own entries, comments and missions.
