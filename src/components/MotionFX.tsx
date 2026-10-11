"use client";

import { useEffect } from "react";

/**
 * Page-wide motion, kept in one place so it stays cheap:
 * - writes `--sy` (scroll px) and `--sp` (0..1 page progress) on <html> once per frame while scrolling,
 *   which the background parallax and the XP scroll bar read in CSS;
 * - tilts any `.card-hover` towards the mouse (real mouse only, never touch).
 * Nothing here reads or writes app data.
 */
export function MotionFX() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = root.scrollHeight - window.innerHeight;
      root.style.setProperty("--sy", String(Math.round(window.scrollY)));
      root.style.setProperty("--sp", max > 0 ? (window.scrollY / max).toFixed(4) : "0");
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    // Pages grow after data loads without any scroll, so keep the progress honest then too.
    const grow = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(onScroll);
    grow?.observe(document.body);

    // Mouse tilt for cards. Skipped on touch screens and when motion is reduced.
    const canTilt = !reduced && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let tilted: HTMLElement | null = null;
    const reset = (el: HTMLElement | null) => { el?.style.removeProperty("--rx"); el?.style.removeProperty("--ry"); };
    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.<HTMLElement>(".card-hover") ?? null;
      if (el !== tilted) { reset(tilted); tilted = el; }
      if (!el) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(x * 8).toFixed(2)}deg`);
    };
    const onLeave = () => { reset(tilted); tilted = null; };
    if (canTilt) { document.addEventListener("pointermove", onMove, { passive: true }); document.addEventListener("pointerleave", onLeave); }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      grow?.disconnect();
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      reset(tilted);
    };
  }, []);

  // The XP bar: fills as you scroll, with a little star riding the tip.
  return <div className="scroll-xp" aria-hidden><span /></div>;
}
