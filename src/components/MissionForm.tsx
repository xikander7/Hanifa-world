"use client";

import { FormEvent, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { SKILLS, localDate, uid } from "@/lib/data";
import type { Quest, QuestStatus } from "@/lib/data";
import { XP } from "@/lib/game";

const STATUSES: QuestStatus[] = ["Today", "Upcoming", "In Progress", "Waiting for Mentor", "Needs a tweak", "Completed"];

/** Create a mission, or fix one when `initial` is given. Sikander's missions ask for review by default, Hanifa's own don't. */
export function MissionForm({ by, onCreate, initial, onCancel }: { by: "mentor" | "hanifa"; onCreate: (quest: Quest) => void; initial?: Quest; onCancel?: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [minutes, setMinutes] = useState(String(initial?.minutes ?? 30));
  const [due, setDue] = useState(initial?.dueDate ?? "");
  const [xp, setXp] = useState(String(initial?.xp ?? XP.defaultQuest));
  const [skill, setSkill] = useState(initial?.skill || SKILLS[0].topic);
  const [review, setReview] = useState(initial?.requiresApproval ?? by === "mentor");
  // Only Sikander, fixing a mission, can set its status and his feedback directly (to undo an approval made by mistake, say).
  const fixing = Boolean(initial) && by === "mentor";
  const [status, setStatus] = useState(String(initial?.status ?? "Today"));
  const [feedback, setFeedback] = useState(initial?.mentorFeedback ?? "");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const today = localDate();
    if (initial) {
      // Fixing a mission keeps its progress; only a mission that hasn't been started moves between Today and Upcoming.
      const chosen = fixing ? status : String(initial.status);
      const planned = chosen === "Today" || chosen === "Upcoming";
      const next: Quest = { ...initial, title: title.trim(), description: description.trim(), dueDate: due, minutes: Number(minutes) || 30, skill, requiresApproval: review, xp: Number(xp) || XP.defaultQuest, status: planned ? (!due || due <= today ? "Today" : "Upcoming") : chosen };
      if (fixing) {
        next.mentorFeedback = feedback.trim() || undefined;
        if (chosen === "Completed" && initial.status !== "Completed") next.completedAt = new Date().toISOString();
        if (chosen !== "Completed") delete next.completedAt;
      }
      onCreate(next);
      return;
    }
    onCreate({
      id: uid(), title: title.trim(), description: description.trim(), category: by === "mentor" ? "From Sikander" : "My mission", status: !due || due <= today ? "Today" : "Upcoming",
      dueDate: due, minutes: Number(minutes) || 30, priority: "Normal", skill, proof: "", comment: "", requiresApproval: review, xp: Number(xp) || XP.defaultQuest, createdBy: by,
    });
    setTitle(""); setDescription(""); setDue("");
  };
  return <form onSubmit={submit} className="card animate-fade-up p-5 sm:p-6">
    <div className="flex items-center gap-2">{initial ? <Pencil className="text-brand" size={20} /> : <Plus className="text-brand" size={20} />}<h2 className="font-display text-xl font-extrabold">{initial ? "Edit this mission" : by === "mentor" ? "Assign Hanifa a mission" : "Add your own mission"}</h2></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <input className="field sm:col-span-2" placeholder={by === "mentor" ? "e.g. Build a 3-page site about your favourite hobby" : "What do you want to get done?"} value={title} onChange={e => setTitle(e.target.value)} aria-label="Mission title" required />
      <textarea className="field min-h-20 sm:col-span-2" placeholder="Details, what 'done' looks like (optional)" value={description} onChange={e => setDescription(e.target.value)} aria-label="Details" />
      <label className="text-xs font-bold">Topic<select className="field mt-1" value={skill} onChange={e => setSkill(e.target.value)}>{SKILLS.map(s => <option key={s.id}>{s.topic}</option>)}</select></label>
      <label className="text-xs font-bold">Due date<input type="date" className="field mt-1" value={due} onChange={e => setDue(e.target.value)} /></label>
      <label className="text-xs font-bold">Planned minutes<input type="number" min={5} className="field mt-1" value={minutes} onChange={e => setMinutes(e.target.value)} /></label>
      {fixing && <label className="text-xs font-bold">Status<select className="field mt-1" value={status} onChange={e => setStatus(e.target.value)}>{STATUSES.map(st => <option key={st}>{st}</option>)}</select></label>}
      <label className="text-xs font-bold">XP reward<input type="number" min={5} step={5} className="field mt-1" value={xp} onChange={e => setXp(e.target.value)} /></label>
      {fixing && <label className="text-xs font-bold sm:col-span-2">Your feedback to Hanifa (leave empty to remove it)<textarea className="field mt-1 min-h-16 font-normal" value={feedback} onChange={e => setFeedback(e.target.value)} /></label>}
    </div>
    <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={review} onChange={e => setReview(e.target.checked)} className="h-5 w-5 accent-[rgb(var(--brand))]" />{by === "mentor" ? "Hanifa must submit it for my review" : "Ask Sikander to review this one"}</label>
    <div className="mt-4 flex gap-2"><button className="btn-primary">{initial ? "Save changes" : "Add mission"}</button>{onCancel && <button type="button" onClick={onCancel} className="btn-soft">Cancel</button>}</div>
  </form>;
}
