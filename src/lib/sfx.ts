"use client";

import { KEYS } from "./data";
import { readStore } from "./store";

// Tiny synthesized sounds (no audio files). Off by default, Hanifa can switch them on from the menu.
type Kind = "pop" | "correct" | "wrong" | "win" | "levelup" | "chime";
const notes: Record<Kind, { f: number; t: number; d: number; type?: OscillatorType }[]> = {
  pop: [{ f: 620, t: 0, d: 0.08 }],
  correct: [{ f: 660, t: 0, d: 0.1 }, { f: 880, t: 0.09, d: 0.16 }],
  wrong: [{ f: 220, t: 0, d: 0.18, type: "triangle" }],
  win: [{ f: 523, t: 0, d: 0.12 }, { f: 659, t: 0.11, d: 0.12 }, { f: 784, t: 0.22, d: 0.22 }],
  levelup: [{ f: 523, t: 0, d: 0.12 }, { f: 659, t: 0.12, d: 0.12 }, { f: 784, t: 0.24, d: 0.12 }, { f: 1047, t: 0.36, d: 0.4 }],
  chime: [{ f: 880, t: 0, d: 0.3 }, { f: 1175, t: 0.25, d: 0.5 }],
};

let context: AudioContext | null = null;
// The setting is saved through the store, which JSON-encodes it, so read it the same way.
export const soundEnabled = () => readStore<string>(KEYS.sound, "off") === "on";

export function play(kind: Kind) {
  if (typeof window === "undefined" || !soundEnabled()) return;
  try {
    context ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const now = context.currentTime;
    notes[kind].forEach(({ f, t, d, type }) => {
      const osc = context!.createOscillator(), gain = context!.createGain();
      osc.type = type ?? "sine"; osc.frequency.value = f;
      gain.gain.setValueAtTime(0.0001, now + t);
      gain.gain.exponentialRampToValueAtTime(0.14, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);
      osc.connect(gain).connect(context!.destination);
      osc.start(now + t); osc.stop(now + t + d + 0.05);
    });
  } catch { /* audio blocked, ignore */ }
}
