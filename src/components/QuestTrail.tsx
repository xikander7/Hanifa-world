"use client";

import { useEffect, useRef } from "react";
import { Nova } from "./Nova";

export type TrailStop = { emoji: string; title: string; copy: string };

/**
 * A quest route that draws itself as you scroll. Nova rides the tip, and each stop lights up with a star as she passes.
 * The route is measured from the real stop markers, so it follows the zig-zag on wide screens and the left rail on phones.
 */
export function QuestTrail({ stops }: { stops: TrailStop[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const ghost = useRef<SVGPathElement>(null);
  const line = useRef<SVGPathElement>(null);
  const rider = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = wrap.current, path = line.current, faint = ghost.current, nova = rider.current;
    if (!box || !path || !faint || !nova) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = Array.from(box.querySelectorAll<HTMLElement>("[data-stop]"));
    let length = 0, dotsY: number[] = [], frame = 0;

    const measure = () => {
      const origin = box.getBoundingClientRect();
      const points = items.map(item => {
        const r = item.querySelector<HTMLElement>("[data-dot]")!.getBoundingClientRect();
        return { x: r.left + r.width / 2 - origin.left, y: r.top + r.height / 2 - origin.top, bottom: item.getBoundingClientRect().bottom - origin.top };
      });
      if (!points.length) return;
      dotsY = points.map(p => p.y);
      // From each stop the route runs down the card's outer edge, swings across the gap below it, and arrives at the next stop.
      let d = `M ${points[0].x} 0 L ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1], b = points[i];
        if (Math.abs(b.x - a.x) < 2) { d += ` L ${b.x} ${b.y}`; continue; }
        const gap = (a.bottom + b.y) / 2, dir = Math.sign(b.x - a.x), r = Math.max(4, Math.min(28, b.y - gap, Math.abs(b.x - a.x) / 2));
        d += ` L ${a.x} ${gap - r} Q ${a.x} ${gap} ${a.x + dir * r} ${gap} L ${b.x - dir * r} ${gap} Q ${b.x} ${gap} ${b.x} ${gap + r} L ${b.x} ${b.y}`;
      }
      const last = points[points.length - 1];
      d += ` L ${last.x} ${origin.height}`;
      path.setAttribute("d", d); faint.setAttribute("d", d);
      length = path.getTotalLength();
      path.style.strokeDasharray = `${length}`;
      update();
    };

    const update = () => {
      frame = 0;
      if (!length) return;
      const r = box.getBoundingClientRect();
      const progress = reduced ? 1 : Math.min(1, Math.max(0, (window.innerHeight * 0.62 - r.top) / r.height));
      const at = path.getPointAtLength(length * progress);
      path.style.strokeDashoffset = `${length * (1 - progress)}`;
      nova.style.transform = `translate(${at.x - 26}px, ${at.y - 44}px)`;
      nova.style.opacity = progress > 0 ? "1" : "0";
      items.forEach((item, i) => item.classList.toggle("lit", at.y >= dotsY[i] - 6));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };

    measure();
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    resize?.observe(box);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); resize?.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, []);

  return <div ref={wrap} className="relative">
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
      <defs><linearGradient id="trail-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100%"><stop offset="0" stopColor="rgb(var(--brand))" /><stop offset=".5" stopColor="rgb(var(--brand2))" /><stop offset="1" stopColor="rgb(var(--brand3))" /></linearGradient></defs>
      <path ref={ghost} className="trail-ghost" />
      <path ref={line} className="trail-line" />
    </svg>
    <div ref={rider} className="trail-rider" style={{ opacity: 0 }} aria-hidden><div><Nova size={52} mood="cheer" float={false} /></div></div>
    <ol className="relative space-y-10 sm:space-y-20">
      {stops.map((stop, i) => {
        const right = i % 2 === 1;
        return <li key={stop.title} data-stop className={`trail-item relative pl-16 sm:w-[58%] sm:pl-0 ${right ? "sm:ml-auto" : ""}`}>
          <span data-dot className={`trail-dot absolute left-2 top-7 z-[1] grid h-11 w-11 place-items-center rounded-full bg-white font-display text-lg font-extrabold text-brand shadow-pop ring-4 ring-white ${right ? "sm:left-auto sm:-right-7 sm:-top-4" : "sm:-left-7 sm:-top-4"}`}>
            {i + 1}<span className="trail-star absolute -right-2 -top-3 text-lg">⭐</span>
          </span>
          <article className="trail-card card p-6 sm:p-7">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-3xl">{stop.emoji}</span>
            <h3 className="mt-4 font-display text-xl font-extrabold">{stop.title}</h3>
            <p className="mt-2 text-ink/60">{stop.copy}</p>
          </article>
        </li>;
      })}
    </ol>
  </div>;
}
