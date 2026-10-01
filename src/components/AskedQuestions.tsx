"use client";

import { useState } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import { EMPTY_ASKS, KEYS, fmtDay } from "@/lib/data";
import type { AskLog, Comment } from "@/lib/data";
import { modeInfo } from "@/lib/askPrompt";
import type { AskMode } from "@/lib/askPrompt";
import { useLocalStore } from "@/lib/store";
import { CommentThread } from "@/components/CommentThread";

/**
 * What Hanifa asked ChatGPT through the Ask page, newest first. Sikander sees where she finds things tricky and can
 * jump in with his own explanation; she sees her questions on the Ask page and can reply to him there.
 */
export function AskedQuestions({ viewer = "mentor" }: { viewer?: "mentor" | "hanifa" }) {
  const [asks, setAsks] = useLocalStore<AskLog[]>(KEYS.asks, EMPTY_ASKS);
  const [open, setOpen] = useState<string | null>(null);
  const mentor = viewer === "mentor";
  const byTopic = asks.reduce<Record<string, number>>((acc, a) => { acc[a.topic] = (acc[a.topic] || 0) + 1; return acc; }, {});
  const tricky = Object.entries(byTopic).sort((a, b) => b[1] - a[1])[0];
  const updateComments = (id: string, change: (comments: Comment[]) => Comment[]) => setAsks(list => list.map(a => a.id === id ? { ...a, comments: change(a.comments ?? []) } : a));
  return <section id="my-questions" className="card mt-5 scroll-mt-24 p-6">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><p className="eyebrow">Ask for Help</p><h2 className="mt-1 font-display text-xl font-extrabold">{mentor ? "Questions she asked ChatGPT" : "My questions"}</h2>{!mentor && <p className="mt-1 text-xs text-ink/55">Sikander can add his own explanation to any question. Reply to him right here.</p>}</div>
      {mentor && tricky && <span className="chip bg-brand/10 text-brand">Most asked about: {tricky[0]} ({tricky[1]})</span>}
    </div>
    {asks.length === 0 ? <p className="mt-3 text-sm text-ink/55">{mentor ? "Nothing yet. When she uses Ask for Help, her questions show up here so you can see where she needs help." : "Nothing yet. Your questions show up here after you ask ChatGPT."}</p> :
      <ul className="mt-4 divide-y divide-ink/5">{asks.slice(0, 8).map(a => {
        const info = modeInfo(a.mode as AskMode), comments = a.comments ?? [];
        const showThread = open === a.id || comments.length > 0;
        return <li key={a.id} className="py-3">
          <div className="flex gap-3"><span className="text-2xl">{info.emoji}</span><div className="min-w-0"><p className="text-sm font-extrabold">{info.label} <span className="font-medium text-ink/50">· Level {a.module}: {a.topic}</span></p>{a.question && <p className="mt-0.5 line-clamp-2 text-sm text-ink/70">“{a.question}”</p>}<p className="mt-0.5 text-[11px] font-bold text-ink/35">{fmtDay(a.at.slice(0, 10))}</p></div>
            <div className="ml-auto flex shrink-0 items-start gap-1">
              {!showThread && <button onClick={() => setOpen(a.id)} className="chip !px-3 !py-1.5 bg-white text-ink/55 ring-1 ring-ink/10 transition hover:ring-brand/50"><MessageCircle size={13} />{mentor ? "Explain" : "Comment"}</button>}
              {mentor && <button onClick={() => { if (window.confirm("Remove this question from the list?")) setAsks(asks.filter(x => x.id !== a.id)); }} aria-label="Remove question" title="Remove" className="grid h-8 w-8 place-items-center rounded-full text-ink/35 transition hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>}
            </div>
          </div>
          {showThread && <div className="sm:pl-11"><CommentThread comments={comments} viewer={viewer} placeholder={mentor ? "Explain it to Hanifa, or add a tip…" : undefined}
            onAdd={c => { updateComments(a.id, cs => [...cs, c]); setOpen(null); }}
            onEdit={(cid, t) => updateComments(a.id, cs => cs.map(c => c.id === cid ? { ...c, text: t } : c))}
            onDelete={cid => updateComments(a.id, cs => cs.filter(c => c.id !== cid))} /></div>}
        </li>;
      })}</ul>}
  </section>;
}
