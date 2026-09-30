"use client";

import { EMPTY_ASKS, KEYS, fmtDay } from "@/lib/data";
import type { AskLog } from "@/lib/data";
import { modeInfo } from "@/lib/askPrompt";
import type { AskMode } from "@/lib/askPrompt";
import { useLocalStore } from "@/lib/store";

/** Mentor view: what Hanifa asked ChatGPT through the Ask page, newest first. Shows where she finds things tricky. */
export function AskedQuestions() {
  const [asks] = useLocalStore<AskLog[]>(KEYS.asks, EMPTY_ASKS);
  const byTopic = asks.reduce<Record<string, number>>((acc, a) => { acc[a.topic] = (acc[a.topic] || 0) + 1; return acc; }, {});
  const tricky = Object.entries(byTopic).sort((a, b) => b[1] - a[1])[0];
  return <section className="card mt-5 p-6">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><p className="eyebrow">Ask a Helper</p><h2 className="mt-1 font-display text-xl font-extrabold">Questions she asked ChatGPT</h2></div>
      {tricky && <span className="chip bg-brand/10 text-brand">Most asked about: {tricky[0]} ({tricky[1]})</span>}
    </div>
    {asks.length === 0 ? <p className="mt-3 text-sm text-ink/55">Nothing yet. When she uses the Ask tab, her questions show up here so you can see where she needs help.</p> :
      <ul className="mt-4 divide-y divide-ink/5">{asks.slice(0, 8).map(a => {
        const info = modeInfo(a.mode as AskMode);
        return <li key={a.id} className="flex gap-3 py-3"><span className="text-2xl">{info.emoji}</span><div className="min-w-0"><p className="text-sm font-extrabold">{info.label} <span className="font-medium text-ink/50">· Level {a.module}: {a.topic}</span></p>{a.question && <p className="mt-0.5 line-clamp-2 text-sm text-ink/70">“{a.question}”</p>}<p className="mt-0.5 text-[11px] font-bold text-ink/35">{fmtDay(a.at.slice(0, 10))}</p></div></li>;
      })}</ul>}
  </section>;
}
