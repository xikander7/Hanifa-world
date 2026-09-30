"use client";

import { useEffect, useId, useState } from "react";

/** A circular progress ring that animates from empty. */
export function Ring({ value, size = 96, stroke = 10, children, track = "rgb(var(--ink) / .08)" }: { value: number; size?: number; stroke?: number; children?: React.ReactNode; track?: string }) {
  const id = useId();
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = requestAnimationFrame(() => setShown(Math.max(0, Math.min(100, value)))); return () => cancelAnimationFrame(t); }, [value]);
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return <div className="relative grid place-items-center" style={{ width: size, height: size }}>
    <svg width={size} height={size} className="-rotate-90">
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" style={{ stopColor: "rgb(var(--brand))" }} /><stop offset="1" style={{ stopColor: "rgb(var(--brand2))" }} /></linearGradient></defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - shown / 100)} style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.3,1,.3,1)" }} />
    </svg>
    <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
  </div>;
}
