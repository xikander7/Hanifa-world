"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { KEYS } from "@/lib/data";
import { useLocalStore } from "@/lib/store";
import { Nova } from "@/components/Nova";
import { SectionHeading } from "@/components/SectionHeading";

type Section = { id: string; emoji: string; title: string; href?: string; tagline: string; what: string; see: string; steps: string[]; earn?: string; tips: string[] };

const SECTIONS: Section[] = [
  {
    id: "home", emoji: "🏠", title: "My Day", href: "/home", tagline: "The first page you see every day.",
    what: "My Day is like the front door of your house. It shows how you are doing today and what to do next. Just pick one thing.",
    see: "A pink box with Nova, your little yellow buddy with a big goggle. A big “Your next quest” button. Three goals for today. A round timer.",
    steps: [
      "Nova is your friend. Read what Nova says. It changes all day!",
      "Press the big ▶ “Your next quest” button. It takes you straight to your level on the Level Map.",
      "“Today's plan” has 3 small goals. Tap a goal to go and do it. When it is done, it turns green ✓.",
      "Want to study with a timer? Use “Focus mode”. Pick a time like 25m, pick what you study, then press Start. When the time is up, your study time is saved for you.",
      "“From Sikander” is where his messages are. Tap one, type back, and press the arrow.",
      "“Missions” box shows little jobs with prizes. Tap one to open it.",
    ],
    earn: "Do all 3 goals in one day and get 50 extra XP!",
    tips: ["Too tired? Do just ONE goal. One is better than zero."],
  },
  {
    id: "adventure", emoji: "🗺️", title: "Level Map", href: "/adventure", tagline: "Your learning map. Like a video game.",
    what: "This is your main road. It has 20 levels. Level 1 is easy. The last levels teach you to build real apps. You open the next level when you finish the one before.",
    see: "Round circles on a map. A glowing pink circle says “START HERE”. A grey circle with a lock 🔒 is not open yet. A green circle with a tick ✓ is finished.",
    steps: [
      "Tap the glowing circle. Your level opens below.",
      "“Your learning playlist” has videos and websites. Open one and learn. Then tick the circle next to it.",
      "“Real-world missions” are small jobs to do on your own computer. Do the job, then tick it. This is the best part!",
      "Write what you learned in “My notes from this level”.",
      "Show Sikander your work. Paste a link or write one sentence, then press “Send to Sikander”.",
      "When everything is ticked, press “I cleared this level!”. You get confetti and the next level opens. 🎉",
    ],
    earn: "Clearing a level gives 150 XP. If Sikander checks your work and says it is great, you get 100 more XP.",
    tips: ["“Cleared” means YOU finished. “Verified” means SIKANDER checked. Only he can give Verified.", "Go slowly. One level at a time is perfect."],
  },
  {
    id: "learn", emoji: "🧠", title: "Quiz & Cards", href: "/learn", tagline: "Little games to help you remember.",
    what: "Do you forget things you learned yesterday? Everybody does! Quiz & Cards asks you small questions again and again. That helps your brain keep the answer. 5 minutes a day is enough.",
    see: "A box called “Daily 3” at the top. Then cards, one for each topic.",
    steps: [
      "Press “Start Daily 3”. You get just 3 questions. Tap the answer you think is right. The app tells you if you were right.",
      "Pick a topic card and press “Flashcards”. You see a word. Try to remember what it means. Then tap the card to see the answer.",
      "Did you know it? Press “Got it!”. Not sure? Press “Show again”. You will see it again soon.",
      "Say “Got it!” 3 times for a card and it becomes a Mastered card 🃏. That means you really remember it.",
      "Want a test? Press “Quiz me”. You get 4 questions.",
    ],
    earn: "Daily 3 gives 30 XP. A Mastered card gives 5 XP. Each right quiz answer gives 10 XP.",
    tips: ["A wrong answer is GOOD. That is how your brain grows.", "Do the Daily 3 every day. It keeps your streak going!"],
  },
  {
    id: "journal", emoji: "✍️", title: "My Diary", href: "/time", tagline: "Your learning diary.",
    what: "A journal is like a diary. You write what you learned today. Sikander reads it and can write back. You can also ask him questions here.",
    see: "A small chart, a pink “New entry” button, and your old entries.",
    steps: [
      "Press “New entry”.",
      "Pick the topic and how long you studied.",
      "Write one or two sentences about what you learned. One sentence is perfect!",
      "Tap a face to show how you felt.",
      "Stuck? Use the yellow box “Stuck on something? Ask Sikander”. Asking is brave and smart!",
      "Press “Save entry”. You get XP!",
      "Under an entry you can chat with Sikander. His words are dark. Yours are pink.",
    ],
    earn: "You get 1 XP for each minute you study (up to 180 a day) and 15 XP for writing (up to 2 times a day).",
    tips: ["The Focus timer writes an entry for you when it ends.", "The “Sample week” entry is just an example. It does not give points."],
  },
  {
    id: "me", emoji: "🏆", title: "My Trophies", href: "/me", tagline: "Everything you have won.",
    what: "This is your trophy room. It shows your badges, your streak and how much you learned. You can also send Sikander a report from here.",
    see: "A big gold cup 🏆, your badges, your numbers, and a calendar full of squares.",
    steps: [
      "Look at your badges. Grey ones with a lock 🔒 are not won yet. Tap one to see how to win it.",
      "The calendar has one square for each day. A coloured square means you learned that day. Try to make lots of them!",
      "“Update Sikander” makes a little report. Press Copy and send it to him on WhatsApp.",
      "At the bottom you find Dream Schools, Mini Missions and the Study Sheet.",
    ],
    tips: ["Want to change your weekly goal? Tap “Edit goal” in the “This week” box."],
  },
  {
    id: "ask", emoji: "💬", title: "Ask for Help", href: "/ask", tagline: "Stuck? Tap Nova in the corner.",
    what: "Sometimes you read something and it makes no sense. That is okay! ChatGPT is like a very patient teacher. This page writes a good question for you, so you do not have to.",
    see: "Three steps and a big pink “Ask ChatGPT” button.",
    steps: [
      "Tap Nova, the little yellow buddy in the bottom corner of the screen. (Or open the menu ☰ and find “Ask for Help” under More.)",
      "Step 1: pick what you are learning.",
      "Step 2: pick what kind of help you want. For example “Explain it simply” or “Show me an example”.",
      "Step 3: type a few words. You must write something if you pick “I'm stuck” or “Check if I understood”.",
      "Press “Ask ChatGPT”. A new tab opens with your question already in it. If the box is empty, paste with Cmd + V (Mac) or Ctrl + V (Windows).",
      "Read the answer slowly. Too hard? Type: “Please explain that again, easier.”",
    ],
    tips: ["Ask it to TEACH you. Do not ask it to do your work.", "ChatGPT can make mistakes. Check big things with Sikander.", "Never type passwords, your address or your phone number.", "Sikander can see what you asked so he can help. You will never get in trouble for asking."],
  },
  {
    id: "missions", emoji: "🎯", title: "Mini Missions", href: "/quests", tagline: "Small jobs with prizes. Find them on My Day.",
    what: "A mission is one small job with a prize. Sikander can give you missions. You can also make your own.",
    see: "A list of cards. Each card is one mission.",
    steps: [
      "To make one, press “New mission”. Write what you want to do, pick a day, and press “Add mission”.",
      "Press “Start” when you begin.",
      "When you finish, press “I did it!”. You win XP and confetti.",
      "Some missions say “Needs review”. Press “Send for review”, write what you did, and Sikander will check it.",
      "If he says “Needs a tweak”, he just wants a small fix. Fix it and press “Resubmit”.",
    ],
    earn: "Each mission shows its prize, like +40 XP.",
    tips: ["Make missions small. “Watch one video” is easier than “Learn Python”."],
  },
  {
    id: "dreams", emoji: "🌍", title: "Dream Schools", href: "/dreams", tagline: "Your future school. Find it in My Trophies.",
    what: "Which university do you like? Which scholarship can help you? A scholarship is money that helps you pay for school. You do not have to choose today. This page is just for looking and thinking.",
    see: "Three buttons: My shortlist, Scholarship hunt, Compare countries.",
    steps: [
      "“My shortlist” shows universities. Use the ↑ and ↓ arrows to move your favourite to the top.",
      "Press “Explore details & leave a thought” to read more and write what you think.",
      "“Scholarship hunt” shows scholarships. Press “Save this” on the ones you like and tick the small steps.",
      "Press “Add a note” to write a question for Sikander.",
      "“Compare countries” helps you think about different places. Talk about it with Sikander.",
    ],
    tips: ["Sikander can write a note back to you.", "Check the real website for the newest dates and prices."],
  },
  {
    id: "sheet", emoji: "📊", title: "Study Sheet", href: "/sheet", tagline: "The Google Sheet you share with Sikander. Find it in My Trophies.",
    what: "This is a big table in Google Sheets that you and Sikander share. You write your weekly update and your daily study hours there. The app reads it by itself. So what you write in the sheet shows up in My Diary and counts for points.",
    see: "A pink box with “Open the sheet” and “Sync now” buttons.",
    steps: [
      "Press “Open the sheet”. It opens in a new tab.",
      "At the bottom you see little tabs, like pages in a book.",
      "“Weekly Learning Updates”: write a report once a week.",
      "“Time Tracking Daily”: one row for each day. Write the hours you studied and one line about what you did.",
      "Sikander writes his comments in the last column. They show up in the app.",
      "Back in the app, press “Sync now” to see your new entries right away.",
    ],
    earn: "Hours in the sheet give XP like the Focus timer.",
    tips: ["You do not need to write everything twice. Use the sheet OR My Diary. Both count.", "To change an entry from the sheet, press “Edit in sheet”."],
  },
];

const TODAY = [
  ["1", "Open My Day", "See what Nova says and look at your 3 goals. (1 minute)"],
  ["2", "Do the Daily 3", "Go to Quiz & Cards and answer 3 quick questions. (2 minutes)"],
  ["3", "Learn something", "Press the big ▶ “Your next quest” button on My Day. (10 to 30 minutes)"],
  ["4", "Write one line", "Go to My Diary and write what you learned. (2 minutes)"],
  ["5", "Clap for yourself", "Open My Trophies and look at your XP and streak. You did it! 👏"],
];

const WORDS: [string, string][] = [
  ["XP", "Points, like coins in a game. You get them when you learn."],
  ["Level (Lv)", "A number that shows how strong you are. More XP means a higher level. (It is different from the 20 levels on the Level Map.)"],
  ["Streak 🔥", "How many days in a row you learned. Miss a day and it starts again from 1. Do not worry, your XP stays."],
  ["Badge 🏅", "A little trophy you win for doing something cool."],
  ["Mastered card", "A flashcard you knew 3 times. Now you really remember it."],
  ["Cleared", "YOU finished all the steps of a level."],
  ["Verified", "SIKANDER checked your work and says it is good."],
  ["Perfect Day", "You did all 3 daily goals. Bonus: 50 XP!"],
  ["Focus timer", "A countdown clock that helps you study. When it ends, it saves your time."],
];

const FAQ: [string, string][] = [
  ["Where is my work saved?", "Look for the green cloud ☁️ at the top. Green means your work is saved online and shows on your phone AND laptop. Yellow means you are offline. Keep going. It saves by itself when the internet is back. No cloud at all? Then it is only saved in this browser, so always use the same one."],
  ["How does Sikander see my work?", "With the green cloud, he sees your journal, time, levels and quiz scores. Your journal also goes into the Working Excel Sheet, on the “App Journal” page. You can also press “Update Sikander” on Home to send him a report."],
  ["I forgot to study yesterday. Did I lose everything?", "No! Your XP, levels, badges and cards all stay. Only your streak starts again."],
  ["I do not understand something.", "That is okay! Open My Diary, press New entry, and write your question in the yellow box. Sikander will help."],
  ["Can I change how the app looks?", "Yes! In the left menu, under “Pick your world”, tap Candy Land 🍭, Space Adventure 🚀 or Ocean World 🌊. The little speaker button turns sound on or off."],
  ["What is “Mentor sign in”?", "That is only for Sikander. Ignore it."],
  ["Who is the little yellow buddy in the corner?", "That is Nova! Tap Nova when you are stuck and Nova helps you ask a question."],
  ["What are the two numbers at the top right?", "🔥 is your streak (days in a row). ⚡ is your XP points."],
  ["I am on a phone. Where is the menu?", "The 5 tabs are at the bottom of the screen. The ❓ button at the top opens this page. The ☰ button at the top left opens the full menu, with more pages under “More”."],
  ["I wrote in the sheet. Why is it not in the app?", "Go to Study Sheet and press “Sync now”. You need internet."],
];

export default function GuidePage() {
  const [open, setOpen] = useState<string | null>("home");
  const [, setGuideSeen] = useLocalStore<string>(KEYS.guideSeen, "");
  useEffect(() => { setGuideSeen("yes"); }, [setGuideSeen]);
  return <div className="max-w-4xl">
    <SectionHeading eyebrow="Start here · takes 3 minutes to read" title="How to use this app 📖" copy="Every page, explained in easy steps. Tap a card to open it. You can always come back." />

    <section className="bg-hero relative mb-8 overflow-hidden rounded-[2.2rem] p-6 text-white shadow-glow sm:p-8">
      <div className="pointer-events-none absolute -right-10 -top-14 h-60 w-60 rounded-full bg-white/10" />
      <div className="relative flex flex-wrap items-center gap-5"><Nova mood="cheer" size={104} />
        <div className="min-w-0 flex-1"><p className="text-xs font-extrabold uppercase tracking-widest text-white/75">The big idea</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">Learn a little every day, and watch yourself level up.</h2>
          <p className="mt-2 text-sm leading-6 text-white/90">This app is like a game where you learn computer skills. You learn a little and win points (XP) and trophies (badges). Sikander cheers for you and answers your questions. Just come every day, even for 5 minutes. 💖</p></div></div>
    </section>

    <section className="card mb-8 p-6">
      <p className="eyebrow">A perfect 15-minute day</p><h2 className="mt-1 font-display text-xl font-extrabold">Not sure what to do? Follow these 5 easy steps:</h2>
      <ol className="mt-4 space-y-3">{TODAY.map(([n, t, d]) => <li key={n} className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand font-display text-sm font-extrabold text-white">{n}</span><p className="text-sm leading-6"><b>{t}.</b> <span className="text-ink/65">{d}</span></p></li>)}</ol>
    </section>

    <h2 className="mb-1 font-display text-2xl font-extrabold">The tabs, one by one</h2>
    <p className="mb-4 text-sm text-ink/55">There are 5 tabs: My Day, Level Map, Quiz & Cards, My Diary and My Trophies. On a phone they are at the bottom of the screen. Tap a card to learn about it.</p>
    <div className="space-y-3">{SECTIONS.map(s => {
      const isOpen = open === s.id;
      return <article key={s.id} id={s.id} className={`card overflow-hidden transition ${isOpen ? "ring-2 ring-brand/40" : ""}`}>
        <button onClick={() => setOpen(isOpen ? null : s.id)} aria-expanded={isOpen} className="flex w-full items-center gap-4 p-5 text-left">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand/10 text-3xl">{s.emoji}</span>
          <span className="min-w-0 flex-1"><span className="block font-display text-xl font-extrabold">{s.title}</span><span className="block text-sm text-ink/55">{s.tagline}</span></span>
          <ChevronDown className={`shrink-0 transition duration-300 ${isOpen ? "rotate-180 text-brand" : "text-ink/40"}`} />
        </button>
        {isOpen && <div className="animate-fade-up border-t border-ink/5 px-5 pb-6 pt-5">
          <p className="text-base leading-7">{s.what}</p>
          <p className="mt-3 rounded-2xl bg-ink/[.04] px-4 py-3 text-sm leading-6"><b>👀 What you will see:</b> {s.see}</p>
          <p className="mt-6 text-xs font-extrabold uppercase tracking-wider text-ink/45">Follow these steps</p>
          <ol className="mt-3 space-y-3">{s.steps.map((step, i) => <li key={i} className="flex items-start gap-3"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-extrabold text-brand">{i + 1}</span><span className="text-[15px] leading-7">{step}</span></li>)}</ol>
          {s.earn && <p className="mt-5 rounded-2xl bg-brand/10 px-4 py-3 text-sm font-semibold"><span className="mr-1">⚡</span>{s.earn}</p>}
          <div className="mt-4 space-y-1.5">{s.tips.map(t => <p key={t} className="text-sm text-ink/65">💡 {t}</p>)}</div>
          {s.href && <Link href={s.href} className="btn-primary mt-5 !py-2.5 text-sm">Go to {s.title.split(" (")[0]} <ArrowRight size={15} /></Link>}
        </div>}
      </article>;
    })}</div>

    <section className="card mt-8 p-6">
      <p className="eyebrow">The top bar &amp; sidebar</p><h2 className="mt-1 font-display text-xl font-extrabold">Little things you will see on every page</h2>
      <ul className="mt-4 space-y-3 text-sm leading-6">
        <li>🔥 <b>Flame number (top right):</b> your streak in days.</li>
        <li>⚡ <b>Bolt number:</b> your total XP.</li>
        <li>⏱️ <b>Dark timer pill:</b> appears when a focus session is running. Tap it to go back to My Day.</li>
        <li>🌟 <b>Dark level card (sidebar):</b> your level, your title and how much XP until the next level.</li>
        <li>🎨 <b>Pick your world:</b> choose Candy Land, Space Adventure or Ocean World, and turn sounds on or off.</li>
        <li>❓ <b>The ? button at the top:</b> brings you back to this page any time.</li>
        <li>💛 <b>Nova in the corner:</b> tap Nova when you are stuck.</li>
      </ul>
    </section>

    <section className="card mt-6 p-6">
      <p className="eyebrow">Words you will see</p><h2 className="mt-1 font-display text-xl font-extrabold">What the words mean</h2>
      <dl className="mt-4 divide-y divide-ink/5">{WORDS.map(([w, d]) => <div key={w} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4"><dt className="font-display font-extrabold text-brand">{w}</dt><dd className="text-sm leading-6 text-ink/70">{d}</dd></div>)}</dl>
    </section>

    <section className="card mt-6 p-6">
      <p className="eyebrow">Questions you might have</p><h2 className="mt-1 font-display text-xl font-extrabold">FAQ</h2>
      <div className="mt-4 space-y-4">{FAQ.map(([q, a]) => <div key={q}><p className="font-extrabold">{q}</p><p className="mt-1 text-sm leading-6 text-ink/65">{a}</p></div>)}</div>
    </section>

    <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-center"><Nova mood="happy" size={64} /><p className="font-display text-lg font-extrabold">You've got this, Hanifa. One small step today. 💖</p><Link href="/home" className="btn-primary">Take me to My Day <ArrowRight size={16} /></Link></div>
  </div>;
}
