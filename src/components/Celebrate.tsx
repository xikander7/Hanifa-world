"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { play } from "@/lib/sfx";

type Toast = { id: number; emoji: string; title: string; text?: string; xp?: number };
type LevelUp = { level: number; rank: string; emoji: string } | null;
type Particle = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; size: number; life: number; color: string; glyph?: string; shape: "rect" | "circle" | "glyph" };

type CelebrateApi = {
  /** A toast with a small confetti pop. */
  celebrate: (toast: Omit<Toast, "id"> & { confetti?: boolean; sound?: "win" | "chime" | "pop" }) => void;
  /** Confetti from a point (defaults to the middle-top of the screen). */
  burst: (options?: { x?: number; y?: number; count?: number; big?: boolean }) => void;
  levelUp: (level: number, rank: string, emoji: string) => void;
};

const Ctx = createContext<CelebrateApi>({ celebrate: () => {}, burst: () => {}, levelUp: () => {} });
export const useCelebrate = () => useContext(Ctx);

// Confetti uses only the current palette's two main colours plus white and gold, never a rainbow.
const palette = () => {
  const read = (name: string) => `rgb(${getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace(/\s+/g, ",") || "236,72,153"})`;
  return [read("--brand"), read("--brand2"), read("--brand"), "#ffffff", "#fcd34d"];
};
const GLYPHS = ["✨", "💖", "⭐", "💫"];

export function CelebrateProvider({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const frame = useRef<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [level, setLevel] = useState<LevelUp>(null);
  const counter = useRef(0);

  const loop = useCallback(() => {
    const canvas = canvasRef.current; const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) { frame.current = null; return; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.current = particles.current.filter(p => p.life > 0 && p.y < canvas.height + 40);
    for (const p of particles.current) {
      p.vy += 0.28; p.vx *= 0.992; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 1;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = Math.min(1, p.life / 40);
      if (p.shape === "glyph") { ctx.font = `${p.size * 2.2}px serif`; ctx.textAlign = "center"; ctx.fillText(p.glyph ?? "✨", 0, 0); }
      else if (p.shape === "circle") { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); }
      ctx.restore();
    }
    frame.current = particles.current.length ? requestAnimationFrame(loop) : null;
    if (!particles.current.length) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  useEffect(() => {
    const resize = () => { const c = canvasRef.current; if (c) { c.width = window.innerWidth; c.height = window.innerHeight; } };
    resize(); window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); if (frame.current) cancelAnimationFrame(frame.current); };
  }, []);

  const burst = useCallback<CelebrateApi["burst"]>(({ x, y, count = 60, big = false } = {}) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = palette();
    const originX = x ?? window.innerWidth / 2, originY = y ?? window.innerHeight * 0.35;
    const total = big ? count * 2 : count;
    for (let i = 0; i < total; i++) {
      const angle = Math.random() * Math.PI * 2, speed = (big ? 9 : 6) * (0.4 + Math.random());
      const roll = Math.random();
      particles.current.push({
        x: originX, y: originY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - (big ? 7 : 4), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        size: 6 + Math.random() * 7, life: 90 + Math.random() * 70, color: colors[i % colors.length],
        shape: roll < 0.14 ? "glyph" : roll < 0.45 ? "circle" : "rect", glyph: GLYPHS[i % GLYPHS.length],
      });
    }
    if (frame.current === null) frame.current = requestAnimationFrame(loop);
  }, [loop]);

  const celebrate = useCallback<CelebrateApi["celebrate"]>(({ confetti = true, sound = "win", ...toast }) => {
    const id = ++counter.current;
    setToasts(list => [...list.slice(-2), { ...toast, id }]);
    window.setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), 5200);
    if (confetti) burst({ count: 45 });
    play(sound);
  }, [burst]);

  const levelUp = useCallback((nextLevel: number, rank: string, emoji: string) => {
    setLevel({ level: nextLevel, rank, emoji });
    burst({ big: true, count: 70 });
    window.setTimeout(() => burst({ big: true, count: 50, x: window.innerWidth * 0.2 }), 350);
    window.setTimeout(() => burst({ big: true, count: 50, x: window.innerWidth * 0.8 }), 600);
    play("levelup");
  }, [burst]);

  const api = useMemo(() => ({ celebrate, burst, levelUp }), [celebrate, burst, levelUp]);

  return <Ctx.Provider value={api}>
    {children}
    <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-[90]" />
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[95] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      {toasts.map(t => <div key={t.id} className="animate-zoom-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-3xl bg-ink px-4 py-3 text-white shadow-pop">
        <span className="animate-bounce-soft text-3xl">{t.emoji}</span>
        <div className="min-w-0 flex-1"><p className="font-display text-base font-bold leading-tight">{t.title}</p>{t.text && <p className="mt-0.5 text-xs text-white/70">{t.text}</p>}</div>
        {t.xp ? <span className="chip bg-white/15 text-white">+{t.xp} XP</span> : null}
      </div>)}
    </div>
    {level && <div className="fixed inset-0 z-[96] grid place-items-center bg-ink/60 p-6 backdrop-blur-sm animate-fade-in" onClick={() => setLevel(null)} role="dialog" aria-label={`Level ${level.level} reached`}>
      <div className="animate-zoom-in relative w-full max-w-sm overflow-hidden rounded-[2.2rem] bg-white p-8 text-center shadow-pop">
        <div className="absolute inset-0 bg-hero opacity-10" />
        <div className="relative">
          <div className="relative mx-auto grid h-36 w-36 place-items-center">
            <span className="absolute inset-0 rounded-full bg-brand/30 animate-pulse-ring" /><span className="absolute inset-0 rounded-full bg-brand/20 animate-pulse-ring [animation-delay:.6s]" />
            <span className="bg-hero relative grid h-28 w-28 place-items-center rounded-full font-display text-6xl font-extrabold text-white shadow-glow">{level.level}</span>
          </div>
          <p className="eyebrow mt-5">Level up!</p>
          <h2 className="mt-1 font-display text-3xl font-extrabold">{level.emoji} {level.rank}</h2>
          <p className="mt-2 text-sm text-ink/60">You keep showing up, and it shows. That's a brand new level unlocked.</p>
          <button className="btn-primary mt-6 w-full" autoFocus onClick={() => setLevel(null)}>Keep going 🚀</button>
        </div>
      </div>
    </div>}
  </Ctx.Provider>;
}
