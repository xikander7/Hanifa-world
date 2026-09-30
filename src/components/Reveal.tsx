"use client";

import { useEffect, useRef } from "react";

/** Fades and lifts its children into view as they scroll on screen. */
export function Reveal({ children, delay = 0, className = "", as: Tag = "div" }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "section" | "article" }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = ref.current; if (!node) return;
    if (typeof IntersectionObserver === "undefined") { node.classList.add("in"); return; }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { node.classList.add("in"); observer.disconnect(); } }), { threshold: 0.12 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return <Tag ref={ref as never} className={`reveal ${className}`} style={{ "--d": `${delay}ms` } as React.CSSProperties}>{children}</Tag>;
}
