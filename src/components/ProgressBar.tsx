"use client";

import { useEffect, useState } from "react";

export function ProgressBar({ value, height = "h-2.5", shine = true, className = "" }: { value: number; height?: string; shine?: boolean; className?: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setShown(Math.max(0, Math.min(100, value)))); return () => cancelAnimationFrame(t); }, [value]);
  return <div className={`${height} overflow-hidden rounded-full bg-ink/10 ${className}`} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
    <div className={`bg-brand-gradient h-full rounded-full ${shine ? "shine" : ""}`} style={{ width: `${shown}%`, transition: "width 1s cubic-bezier(.3,1,.3,1)" }} />
  </div>;
}
