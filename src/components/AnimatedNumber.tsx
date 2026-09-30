"use client";

import { useEffect, useRef, useState } from "react";

/** Counts up to `value` whenever it changes. */
export function AnimatedNumber({ value, duration = 900, suffix = "" }: { value: number; duration?: number; suffix?: string }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(value); from.current = value; return; }
    const start = performance.now(), begin = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration), eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(begin + (value - begin) * eased);
      setShown(current); from.current = current;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <span className="tabular-nums">{shown.toLocaleString()}{suffix}</span>;
}
