"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { SKILLS, localDate, uid } from "@/lib/data";
import type { Quest } from "@/lib/data";
import { XP } from "@/lib/game";

/** Create a mission. Sikander's missions ask for review by default, Hanifa's own don't. */
export function MissionForm({ by, onCreate }: { by: "mentor" | "hanifa"; onCreate: (quest: Quest) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [due, setDue] = useState("");
  const [xp, setXp] = useState(String(XP.defaultQuest));
  const [skill, setSkill] = useState(SKILLS[0].topic);
  const [review, setReview] = useState(by === "mentor");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const today = localDate();
    onCreate({
      id: uid(), title: title.trim(), description: description.trim(), category: by === "mentor" ? "From Sikander" : "My mission", status: !due || due <= today ? "Today" : "Upcoming",
      dueDate: due, minutes: Number(minutes) || 30, priority: "Normal", skill, proof: "", comment: "", requiresApproval: review, xp: Number(xp) || XP.defaultQuest, createdBy: by,
    });
    setTitle(""); setDescription(""); setDue("");
  };
  return <form onSubmit={submit} className="card animate-fade-up p-5 sm:p-6">
    <div className="flex items-center gap-2"><Plus className="text-brand" size={20} /><h2 className="font-display text-xl font-extrabold">{by === "mentor" ? "Assign Hanifa a mission" : "Add your own mission"}</h2></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <input className="field sm:col-span-2" placeholder={by === "mentor" ? "e.g. Build a 3-page site about your favourite hobby" : "What do you want to get done?"} value={title} onChange={e => setTitle(e.target.value)} aria-label="Mission title" required />
      <textarea className="field min-h-20 sm:col-span-2" placeholder="Details, what 'done' looks like (optional)" value={description} onChange={e => setDescription(e.target.value)} aria-label="Details" />
      <label className="text-xs font-bold">Topic<select className="field mt-1" value={skill} onChange={e => setSkill(e.target.value)}>{SKILLS.map(s => <option key={s.id}>{s.topic}</option>)}</select></label>
      <label className="text-xs font-bold">Due date<input type="date" className="field mt-1" value={due} onChange={e => setDue(e.target.value)} /></label>
      <label className="text-xs font-bold">Planned minutes<input type="number" min={5} className="field mt-1" value={minutes} onChange={e => setMinutes(e.target.value)} /></label>
      <label className="text-xs font-bold">XP reward<input type="number" min={5} step={5} className="field mt-1" value={xp} onChange={e => setXp(e.target.value)} /></label>
    </div>
    <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={review} onChange={e => setReview(e.target.checked)} className="h-5 w-5 accent-[rgb(var(--brand))]" />{by === "mentor" ? "Hanifa must submit it for my review" : "Ask Sikander to review this one"}</label>
    <button className="btn-primary mt-4">Add mission</button>
  </form>;
}
