"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useImage } from "@/lib/images";

/** A diary screenshot as a small thumbnail; tap it to see it full size. Works for stored references and old inline pictures. */
export function Screenshot({ value, className = "h-20" }: { value: string; className?: string }) {
  const { src, done } = useImage(value);
  const [open, setOpen] = useState(false);
  if (!src) return <span className="chip bg-ink/5 text-ink/50" title={done ? "It will show here once the device that added it has saved it to the cloud." : undefined}>📸 {done ? "Screenshot on its way…" : "Loading screenshot…"}</span>;
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-label="View screenshot"><img src={src} alt="Screenshot proof" loading="lazy" className={`${className} rounded-xl object-cover ring-1 ring-ink/10 transition hover:scale-105`} /></button>
    {open && <div role="dialog" aria-label="Screenshot" onClick={() => setOpen(false)} className="animate-fade-in fixed inset-0 z-[80] grid place-items-center bg-ink/80 p-4 backdrop-blur-sm">
      <img src={src} alt="Screenshot proof" className="max-h-[85vh] max-w-full rounded-2xl shadow-pop" />
      <button onClick={() => setOpen(false)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white text-ink" aria-label="Close"><X size={20} /></button>
    </div>}
  </>;
}
