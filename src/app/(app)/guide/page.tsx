"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Nova } from "@/components/Nova";
import { SectionHeading } from "@/components/SectionHeading";

type Section = { id: string; emoji: string; title: string; href?: string; tagline: string; what: string; see: string; steps: string[]; earn?: string; tips: string[] };

const SECTIONS: Section[] = [
  {
    id: "home", emoji: "🏠", title: "Home", href: "/home", tagline: "The first page you open every day.",
    what: "Think of Home like the front door of your house. When you come in, it tells you how you are doing today and what to do next. You do not have to do everything. Just look at it and pick one thing.",
    see: "A big pink box at the top with a cute star called Nova. Under it, a box with 3 goals. On the right, a round timer.",
    steps: [
      "Look at the big pink box. The cute star is Nova. Nova is your friend. Nova talks to you in the white speech bubble. Read what Nova says. It changes all day!",
      "Next to Nova you can see your Level (like a number in a video game), your XP (points you collect), and your Streak (how many days in a row you learned).",
      "Find the box called “Today's plan”. It has 3 small goals. Goal 1: do the Daily 3 quiz. Goal 2: study for 25 minutes. Goal 3: write one line in your Journal.",
      "Tap a goal and it takes you to the place where you do it. When a goal is finished it turns green with a white tick ✓. That feels good!",
      "Want to study with a timer? Look at the box called “Focus mode” on the right. Tap a number like 25m (that means 25 minutes). Pick what you are studying from the list. Press the pink “Start” button. Now study! You can even go to other pages. The timer keeps going by itself.",
      "When the time is up, the app saves your study time for you. It says “minutes saved!” at the top with confetti. You do not have to write anything. If you stop early, press “Finish early & save”.",
      "Find the box called “From Xander”. Xander can send you nice messages or little challenges. A pink number shows how many new messages you have. Tap the little box, type “thank you” or anything you like, then press the arrow to send it back to him.",
      "Scroll down. You will see little squares. Each square is one day. A coloured square means you learned that day. Try to make lots of coloured squares!",
      "Scroll more. You will see your Trophy shelf. Trophies are called badges. Grey ones with a lock are not won yet. Tap or hover on one to read how to win it.",
      "At the very bottom is “Update Xander”. It writes a little report about your week. Press “Copy” and send it to Xander on WhatsApp, or press “WhatsApp” and it opens for you.",
    ],
    earn: "Do all 3 goals in one day and you get a Perfect Day prize: 50 extra XP!",
    tips: ["Too tired? Do just ONE goal. One is better than zero, and your streak stays alive.", "Want to change your weekly goal? Find the box “This week” and tap “Edit goal”."],
  },
  {
    id: "adventure", emoji: "🗺️", title: "Adventure", href: "/adventure", tagline: "Your big learning map, like a video game.",
    what: "This is your main learning road. It is like a game map with 20 levels. The first level is easy: Computer Basics. The last levels teach you to build real apps. You can only play the next level after you finish the one before. That way you never get lost.",
    see: "Four big boxes called “worlds”. Inside each world are round circles in a line. Each circle is one level.",
    steps: [
      "Look at the circles. A pink glowing circle that bounces says “START HERE”. That is where you are now. A grey circle with a lock 🔒 is not open yet. A green circle with a tick ✓ and a ⭐ means you finished it!",
      "Tap the glowing circle. A big box opens below with everything for that level.",
      "Find “Your learning playlist”. These are videos and websites to learn from. Tap a pink button like “Open resource”. It opens in a new tab. Watch or read it.",
      "When you finish one, come back and tap the empty circle next to its name. A green tick ✓ appears. Do this for every item, one by one.",
      "Now find “Real-world missions” on the right. These are small jobs to do on your own computer, for example “make a new folder”. Do the job for real. Then tap it to tick it. This is the best part because you learn by doing!",
      "Want to remember things better? Press the pink “Open Brain Gym” button near the top of the level. It gives you flashcards and a quiz for that level.",
      "You can write your own notes in the box “My notes from this level”. Write anything you want to remember.",
      "Found the section “Show Xander what you made”? Paste a link of your work, or write one sentence like “I made a folder and zipped it”. Then press “Send to Xander”. Xander will look at it.",
      "When EVERYTHING is ticked, the big button “I cleared this level!” turns bright and bounces. Press it! You get confetti and the next level opens. 🎉",
    ],
    earn: "Clearing a level gives you 150 XP. If Xander says your work is great (a “Verified” stamp), you get 100 more XP.",
    tips: ["“Cleared” means YOU finished the steps. “Verified” means XANDER checked your work. Only Xander can give Verified.", "You can open a finished level again any time to read it again.", "Do not rush! One level at a time is perfect."],
  },
  {
    id: "learn", emoji: "🧠", title: "Learn (Brain Gym)", href: "/learn", tagline: "Games that help your brain remember.",
    what: "Did you ever watch something and then forget it the next day? Everybody does! Brain Gym fixes that. It asks you small questions again and again. Your brain remembers better when it has to think of the answer. Just 5 minutes a day is enough.",
    see: "A box called “Daily 3” at the top, then lots of cards with pictures. Each card is a topic.",
    steps: [
      "Daily 3 is the top box. Press “Start Daily 3”. You get just 3 questions. Tap the answer you think is right. The app tells you straight away if you were right, and why.",
      "Press “Next question” to keep going. At the end you see your score. Do the Daily 3 once every day. It is the quickest way to keep your streak!",
      "Now look at the topic cards below. Each one is a topic like Python or Git. Press “Flashcards” on one.",
      "First you read a short friendly story about the topic. Then press “Show me the cards”.",
      "A flashcard shows a word on the front, like “RAM”. Try to remember what it means. Then tap the card. It flips over and shows the answer.",
      "Did you know it? Press the pink “Got it!” button. Did you forget? No problem! Press “Show again”. You will see that card again soon.",
      "Here is the magic: if you say “Got it!” for the same card 3 times, it turns into a Mastered card 🃏. That means it is now in your long-term memory. Well done!",
      "Want a test? Press “Quiz me” on a topic. You get 4 questions with 4 answers each. After every answer it explains why. You can do the quiz again and again.",
      "Sometimes the top right box says “cards due”. That means some cards are ready to practise again. Press “Review now”.",
    ],
    earn: "Each Mastered card gives 5 XP. Each right quiz answer gives 10 XP (but only your best try counts). The Daily 3 gives 30 XP.",
    tips: ["Getting an answer wrong is GOOD. That is exactly when your brain grows.", "Do the flashcards first, then the quiz. It is easier that way."],
  },
  {
    id: "missions", emoji: "🎯", title: "Missions", href: "/quests", tagline: "Little jobs to finish, like a to-do list.",
    what: "A mission is one small job with a prize. Xander can give you missions. You can also make your own missions, like “Watch the Python video today”. When you finish a mission, you win XP.",
    see: "A list of cards. Each card is one mission with a title and a pink button.",
    steps: [
      "To make your own mission, press the pink “New mission” button at the top. Write what you want to do. Choose a topic. Choose a day. Press “Add mission”.",
      "Every mission shows a card. Press “Start” when you begin working on it.",
      "When you are done with a normal mission, press “I did it!”. You win XP right away and see confetti.",
      "Some missions say “Needs review”. That means Xander must check it. Press “Send for review”. A box opens. Write what you did, what was hard, and what you learned. Press “Send to Xander”.",
      "Now wait a little. Xander reads it. Then he writes you a message. If he says “Needs a tweak”, he is only asking you to fix a small thing. Read his note, change it, and press “Resubmit”.",
      "Look at the 3 buttons at the top: “Active” (to do), “Waiting for Xander” (sent), and “Done” (finished). They sort your missions so it is tidy.",
    ],
    earn: "Every mission shows its prize, for example +40 XP.",
    tips: ["Make missions small. “Finish one video” is easier than “Learn Python”.", "If you see no missions, add your own. It is fun!"],
  },
  {
    id: "journal", emoji: "✍️", title: "Journal", href: "/time", tagline: "Your learning diary. Write what you did.",
    what: "A journal is like a diary. You write what you learned today. It helps you remember, and it lets Xander see how you are doing. He can also write back to you, and you can ask him questions here.",
    see: "A small chart of your last 14 days, a pink “New entry” button, and your past entries underneath.",
    steps: [
      "Press the pink “New entry” button at the top right.",
      "Choose the topic you studied from the list.",
      "Choose how long you studied. Tap a button like “30m” (30 minutes). Or type your own number.",
      "Under “What did you learn or do?”, write one or two sentences. Example: “I learned that RAM is the computer's short memory.” Even one sentence is perfect!",
      "Tap a face to show how you felt. Fire, happy, confused, tired. Any is okay.",
      "Stuck on something? Use the yellow box called “Stuck on something? Ask Xander”. Write your question there. Asking is brave and smart!",
      "You can add a link or a photo (screenshot) of your work. This is optional.",
      "Press “Save entry”. You get confetti and XP!",
      "Under your entry you can chat with Xander. His words are in dark bubbles. Yours are in pink bubbles. Type in the little box and press the arrow to reply.",
      "Made a mistake? Tap the pencil ✏️ on an entry to change it. The bin 🗑️ deletes it.",
    ],
    earn: "You get 1 XP for every minute you studied (up to 180 a day). You get 15 XP when you write something (up to 2 times a day).",
    tips: ["When the Focus timer finishes, it writes a journal entry for you. You do not need to write the time again.", "The entry called “Sample week” is only an example. It does not count for points."],
  },
  {
    id: "dreams", emoji: "🌍", title: "Dreams", href: "/dreams", tagline: "Think about your future school.",
    what: "This page is for dreaming about your future. Which university do you like? Which scholarship can help you study? A scholarship is money that helps you pay for school. You do not have to choose anything today. This is only for looking, thinking, and asking questions.",
    see: "A pink box that says “BS Computer Science”, then 3 buttons: My shortlist, Scholarship hunt, Compare countries.",
    steps: [
      "Press “My shortlist”. You see universities in a list. The number #1 is the one at the top.",
      "Use the little ↑ and ↓ arrows to move a university up or down. Put your favourite on top!",
      "Press “Explore details & leave a thought”. You can read more about it. Write what you like or what you want to ask in the box.",
      "Press “Make a favourite” ♡ on one you really like. A green “Favourite” tag appears.",
      "Now press “Scholarship hunt”. You see many scholarships. Press “Save this” on the ones you like.",
      "Each scholarship has 3 small steps: “Find requirements”, “Check the dates”, and “Talk with Xander”. Tap each one when you finish it. The bar shows how far you are.",
      "Press “Add a note” to write a question for Xander. Press “Apply” or “Info” to open the real website.",
      "Press “Compare countries” to read about different countries. Talk about them with Xander. Nobody decides alone.",
    ],
    tips: ["Xander can write a note back to you on each university and scholarship.", "Always check the real website for the newest dates and prices."],
  },
];

const TODAY = [
  ["1", "Open Home", "Read what Nova says and look at your 3 goals. (1 minute)"],
  ["2", "Do the Daily 3", "Go to Learn and answer 3 quick questions. (2 minutes)"],
  ["3", "Learn something", "Go to Adventure and do a bit of your level. Use the Focus timer. (10 to 30 minutes)"],
  ["4", "Write one line", "Go to Journal and write what you learned. Ask Xander if you are stuck. (2 minutes)"],
  ["5", "Clap for yourself", "Look at your XP, your streak and your new badges. You did it! 👏"],
];

const WORDS: [string, string][] = [
  ["XP", "Points, like coins in a game. You get them when you study, answer questions, write in your journal, and finish things."],
  ["Level (Lv)", "A number for how strong you are. The more XP you collect, the higher your level. You see it in the dark box on the left. (This is different from the 20 levels on the Adventure map.)"],
  ["Streak 🔥", "How many days in a row you learned. Learn today and tomorrow and it becomes 2! If you miss a day it starts again from 1, but do not worry. We remember your best streak."],
  ["Badge 🏅", "A little trophy you win for something cool, like getting every answer right in a quiz."],
  ["Mastered card", "A flashcard you knew 3 times. It means you really remember it now."],
  ["Cleared", "It means YOU finished all the steps of a level."],
  ["Verified", "It means XANDER checked your work and says it is good. Only Xander can do this."],
  ["Perfect Day", "When you do all 3 daily goals in one day. You get 50 bonus XP!"],
  ["Focus timer", "A countdown clock that helps you study without stopping. When it ends, it saves your time."],
];

const FAQ: [string, string][] = [
  ["Where is my work saved?", "It is saved inside the web browser you are using (like Chrome or Safari) on this phone or computer. Always open the app in the SAME browser. Do not clear the browser history or you may lose your work. On a different phone or computer, your work will not be there."],
  ["How does Xander see what I do?", "When Xander opens the app on the same phone or computer and goes to Mentor Mode, he can see your journal, your time, your levels and your quiz scores. He can also write to you. If he is on a different device, press “Update Xander” on Home and send him the report on WhatsApp."],
  ["I forgot to study yesterday. Did I lose everything?", "No, never! Your XP, levels, badges and cards all stay. Only your streak number starts again. You can build it back up."],
  ["I do not understand something.", "That is totally okay! Everybody gets stuck. Open the Journal, press New entry, and write your question in the yellow box. Xander will help you."],
  ["Can I change the colours?", "Yes! Look at the left menu, under “Make it yours”. Tap one of the four colour circles. The little speaker button turns the sounds on or off."],
  ["What is “Mentor sign in”?", "That is only for Xander. You do not need it. Just ignore it."],
  ["What do the two numbers at the top right mean?", "The 🔥 number is your streak (days in a row). The ⚡ number is your total XP points."],
  ["I am on a phone. Where is the menu?", "The buttons are at the very bottom of your screen: Home, Adventure, Learn, Missions, Journal, Dreams. The round ❓ button at the top brings you to this page."],
];

export default function GuidePage() {
  const [open, setOpen] = useState<string | null>("home");
  return <div className="max-w-4xl">
    <SectionHeading eyebrow="Start here · takes 5 minutes to read" title="How to use me 📖" copy="Every button and every page, explained in easy steps. Tap a card below to open it. Read it slowly. You can always come back." />

    <section className="bg-hero relative mb-8 overflow-hidden rounded-[2.2rem] p-6 text-white shadow-glow sm:p-8">
      <div className="pointer-events-none absolute -right-10 -top-14 h-60 w-60 rounded-full bg-white/10" />
      <div className="relative flex flex-wrap items-center gap-5"><Nova mood="cheer" size={104} />
        <div className="min-w-0 flex-1"><p className="text-xs font-extrabold uppercase tracking-widest text-white/75">The big idea</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">Learn a little every day, and watch yourself level up.</h2>
          <p className="mt-2 text-sm leading-6 text-white/90">This app is like a game where you learn computer skills. You learn a little, you collect points (XP) and trophies (badges), and Xander cheers for you and answers your questions. You do not need to do everything. Just come every day, even for 5 minutes. 💖</p></div></div>
    </section>

    <section className="card mb-8 p-6">
      <p className="eyebrow">A perfect 15-minute day</p><h2 className="mt-1 font-display text-xl font-extrabold">Not sure what to do? Follow these 5 easy steps:</h2>
      <ol className="mt-4 space-y-3">{TODAY.map(([n, t, d]) => <li key={n} className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand font-display text-sm font-extrabold text-white">{n}</span><p className="text-sm leading-6"><b>{t}.</b> <span className="text-ink/65">{d}</span></p></li>)}</ol>
    </section>

    <h2 className="mb-1 font-display text-2xl font-extrabold">The tabs, one by one</h2>
    <p className="mb-4 text-sm text-ink/55">The tabs are the buttons in the menu on the left side. On a phone they are at the bottom of the screen. Tap a card here to learn about one tab.</p>
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
          <p className="mt-6 text-xs font-extrabold uppercase tracking-wider text-ink/45">Follow these steps, one by one</p>
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
        <li>⏱️ <b>Dark timer pill:</b> appears when a focus session is running. Tap it to go back to Home.</li>
        <li>🌟 <b>Dark level card (sidebar):</b> your level, your title and how much XP until the next level.</li>
        <li>🎨 <b>Make it yours:</b> choose a colour theme and turn sounds on or off.</li>
        <li>❓ <b>The ? button at the top:</b> brings you back to this page any time.</li>
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

    <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-center"><Nova mood="happy" size={64} /><p className="font-display text-lg font-extrabold">You've got this, Hanifa. One small step today. 💖</p><Link href="/home" className="btn-primary">Take me Home <ArrowRight size={16} /></Link></div>
  </div>;
}
