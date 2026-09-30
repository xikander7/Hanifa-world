"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { fmtDay, uid } from "@/lib/data";
import type { Comment } from "@/lib/data";

/** A small chat between Sikander and Hanifa, attached to an entry. */
export function CommentThread({ comments, legacyMentorNote, viewer, onAdd, placeholder }: {
  comments: Comment[]; legacyMentorNote?: string; viewer: "mentor" | "hanifa"; onAdd: (comment: Comment) => void; placeholder?: string;
}) {
  const [text, setText] = useState("");
  const all: Comment[] = [...(legacyMentorNote ? [{ id: "legacy", by: "mentor" as const, text: legacyMentorNote, at: "" }] : []), ...comments];
  const submit = (e: FormEvent) => { e.preventDefault(); const t = text.trim(); if (!t) return; onAdd({ id: uid(), by: viewer, text: t, at: new Date().toISOString() }); setText(""); };
  return <div className="mt-4 space-y-2">
    {all.map(c => {
      const mine = c.by === viewer;
      return <div key={c.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <div className={`animate-pop max-w-[85%] rounded-3xl px-4 py-2.5 text-sm ${c.by === "mentor" ? "rounded-bl-md bg-ink text-white" : "rounded-br-md bg-brand/15 text-ink"}`}>
          <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">{c.by === "mentor" ? "Sikander" : "Hanifa"}{c.at ? ` · ${fmtDay(c.at.slice(0, 10), { day: "numeric", month: "short" })}` : ""}</p>
          <p className="mt-0.5 whitespace-pre-wrap leading-5">{c.text}</p>
        </div>
      </div>;
    })}
    <form onSubmit={submit} className="flex gap-2">
      <input value={text} onChange={e => setText(e.target.value)} className="field !py-2.5" placeholder={placeholder ?? (viewer === "mentor" ? "Write Hanifa a comment…" : "Reply to Sikander…")} aria-label="Write a comment" />
      <button className="btn-primary !px-4 !py-2.5" aria-label="Send comment"><Send size={16} /></button>
    </form>
  </div>;
}
