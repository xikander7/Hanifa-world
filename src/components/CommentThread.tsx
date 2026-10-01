"use client";

import { FormEvent, useState } from "react";
import { Check, Pencil, Send, Trash2, X } from "lucide-react";
import { fmtDay, uid } from "@/lib/data";
import type { Comment } from "@/lib/data";

/** The id CommentThread gives an old-style mentor note, so onEdit/onDelete can tell it apart from real comments. */
export const LEGACY_NOTE_ID = "legacy";

/** Comments that are copies of the Google Sheet: its review columns on a sheet entry, or a reply typed in the App Journal tab. */
export const sheetComment = (entry: { id: string; source?: string }) => (c: Comment) =>
  c.id === `${entry.id}-sheetreply` || (entry.source === "sheet" && c.id.startsWith(`${entry.id}-`));

/**
 * A small chat between Sikander and Hanifa, attached to an entry. With onEdit/onDelete, the viewer can fix or remove
 * their own comments, and Sikander can also remove Hanifa's. Comments copied from the Google Sheet (`fromSheet`) come
 * back on every sync, so they can only be changed in the sheet.
 */
export function CommentThread({ comments, legacyMentorNote, viewer, onAdd, onEdit, onDelete, fromSheet, placeholder }: {
  comments: Comment[]; legacyMentorNote?: string; viewer: "mentor" | "hanifa"; onAdd: (comment: Comment) => void;
  onEdit?: (id: string, text: string) => void; onDelete?: (id: string) => void; fromSheet?: (comment: Comment) => boolean; placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const all: Comment[] = [...(legacyMentorNote ? [{ id: LEGACY_NOTE_ID, by: "mentor" as const, text: legacyMentorNote, at: "" }] : []), ...comments];
  const submit = (e: FormEvent) => { e.preventDefault(); const t = text.trim(); if (!t) return; onAdd({ id: uid(), by: viewer, text: t, at: new Date().toISOString() }); setText(""); };
  const save = (e: FormEvent) => { e.preventDefault(); const t = draft.trim(); if (t && editing) onEdit?.(editing, t); setEditing(null); };
  return <div className="mt-4 space-y-2">
    {all.map(c => {
      const mine = c.by === viewer, sheet = Boolean(fromSheet?.(c));
      const canEdit = Boolean(onEdit) && mine && !sheet, canDelete = Boolean(onDelete) && (mine || viewer === "mentor") && !sheet;
      const tool = "grid h-7 w-7 place-items-center rounded-full bg-white/80 text-ink/50 ring-1 ring-ink/5 transition hover:text-ink";
      return <div key={c.id} className={`group flex items-center gap-1.5 ${mine ? "flex-row-reverse" : ""}`}>
        <div className={`animate-pop max-w-[85%] rounded-3xl px-4 py-2.5 text-sm ${c.by === "mentor" ? "rounded-bl-md bg-ink text-white" : "rounded-br-md bg-brand/15 text-ink"}`}>
          <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-60">{c.by === "mentor" ? "Sikander" : "Hanifa"}{c.at ? ` · ${fmtDay(c.at.slice(0, 10), { day: "numeric", month: "short" })}` : ""}{sheet ? " · 📊 from the sheet" : ""}</p>
          {editing === c.id
            ? <form onSubmit={save} className="mt-1 flex items-center gap-1.5">
                <input value={draft} onChange={e => setDraft(e.target.value)} className="field !py-1.5 !text-sm text-ink" aria-label="Comment text" autoFocus />
                <button className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-white" aria-label="Save comment"><Check size={14} /></button>
                <button type="button" onClick={() => setEditing(null)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/20" aria-label="Cancel editing"><X size={14} /></button>
              </form>
            : <p className="mt-0.5 whitespace-pre-wrap leading-5">{c.text}</p>}
        </div>
        {editing !== c.id && canEdit && <button onClick={() => { setEditing(c.id); setDraft(c.text); }} className={tool} aria-label="Edit comment" title="Edit"><Pencil size={13} /></button>}
        {editing !== c.id && canDelete && <button onClick={() => { if (window.confirm("Delete this comment?")) onDelete?.(c.id); }} className={`${tool} hover:!text-rose-600`} aria-label="Delete comment" title="Delete"><Trash2 size={13} /></button>}
        {sheet && onDelete && <span className="text-[10px] font-semibold text-ink/35" title="This comment is copied from the Google Sheet. Change or clear it in the sheet and it updates here.">change in the sheet</span>}
      </div>;
    })}
    <form onSubmit={submit} className="flex gap-2">
      <input value={text} onChange={e => setText(e.target.value)} className="field !py-2.5" placeholder={placeholder ?? (viewer === "mentor" ? "Write Hanifa a comment…" : "Reply to Sikander…")} aria-label="Write a comment" />
      <button className="btn-primary !px-4 !py-2.5" aria-label="Send comment"><Send size={16} /></button>
    </form>
  </div>;
}
