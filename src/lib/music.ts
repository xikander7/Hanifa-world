"use client";

// Calm focus music, synthesized live (no audio files): a slow lo-fi loop with soft pads, a gentle bass, a quiet beat and a
// sparse piano-like tune. Browsers only allow sound after a tap, so startMusic() waits for the first tap or key press.
const BPM = 72;
const STEP = 60 / BPM / 4; // one sixteenth note, in seconds
const LOOP = 128; // sixteenths: 8 bars
const MAX_GAIN = 0.7; // the slider's top end; the default (half way) is a comfortable medium
const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

// Cmaj7 - Am7 - Fmaj7 - G6, one chord per bar (played twice): bass note and the pad's notes.
const CHORDS = [
  { bass: 36, pad: [55, 59, 62, 64] },
  { bass: 33, pad: [55, 60, 64, 67] },
  { bass: 41, pad: [57, 60, 64, 65] },
  { bass: 43, pad: [55, 59, 62, 64] },
];
// The tune: eighth notes per bar (0 = rest), airy and pentatonic so it never gets in the way of thinking.
const TUNE = [
  [76, 0, 0, 79, 0, 76, 0, 0], [0, 72, 0, 0, 76, 0, 79, 0], [77, 0, 0, 72, 0, 0, 76, 0], [0, 74, 0, 79, 0, 0, 0, 0],
  [79, 0, 0, 76, 0, 0, 72, 0], [0, 76, 0, 0, 81, 0, 79, 0], [77, 0, 76, 0, 0, 72, 0, 0], [0, 74, 0, 71, 0, 0, 67, 0],
];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let tone: BiquadFilterNode | null = null;
let noise: AudioBuffer | null = null;
let timer: number | undefined;
let nextTime = 0;
let step = 0;
let wanted = false;
let volume = 0.5;

/** One soft note: a gentle attack and a long fade, through the shared low-pass filter. */
function note(time: number, midi: number, length: number, type: OscillatorType, peak: number, attack = 0.015, detune = 0) {
  const osc = ctx!.createOscillator(), gain = ctx!.createGain();
  osc.type = type; osc.frequency.value = hz(midi); osc.detune.value = detune;
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(peak, time + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
  osc.connect(gain).connect(tone!);
  osc.start(time); osc.stop(time + length + 0.05);
}

function thump(time: number) {
  const osc = ctx!.createOscillator(), gain = ctx!.createGain();
  osc.frequency.setValueAtTime(110, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.14);
  gain.gain.setValueAtTime(0.42, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
  osc.connect(gain).connect(tone!);
  osc.start(time); osc.stop(time + 0.25);
}

function brush(time: number, peak: number) {
  const src = ctx!.createBufferSource(), filter = ctx!.createBiquadFilter(), gain = ctx!.createGain();
  src.buffer = noise;
  filter.type = "bandpass"; filter.frequency.value = 5500;
  gain.gain.setValueAtTime(peak, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
  src.connect(filter).connect(gain).connect(tone!);
  src.start(time); src.stop(time + 0.12);
}

function schedule(index: number, time: number) {
  const s = index % LOOP, bar = Math.floor(s / 16) % 8, beat = s % 16, chord = CHORDS[bar % 4];
  if (beat === 0) chord.pad.forEach((m, i) => { note(time, m, STEP * 15, "sine", 0.16, 0.9, i % 2 ? 6 : -6); note(time, m - 12, STEP * 15, "triangle", 0.05, 1.1); });
  if (beat === 0 || beat === 8) thump(time);
  if (beat === 0 || beat === 6 || beat === 8) note(time, chord.bass, STEP * 5, "sine", 0.4);
  if (beat % 4 === 2) brush(time, 0.07);
  if (beat === 4 || beat === 12) brush(time, 0.13);
  if (beat % 2 === 0) {
    const m = TUNE[bar][beat / 2];
    if (m) { note(time, m, STEP * 7, "triangle", 0.22); note(time, m + 12, STEP * 3, "sine", 0.05); }
  }
}

function tick() {
  if (!ctx) return;
  while (nextTime < ctx.currentTime + 0.3) { schedule(step, nextTime); nextTime += STEP; step++; }
}

function apply() {
  if (master && ctx) master.gain.setTargetAtTime(volume * MAX_GAIN, ctx.currentTime, 0.05);
}

function begin() {
  if (!wanted || typeof window === "undefined") return;
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      master = ctx.createGain();
      tone = ctx.createBiquadFilter(); // takes the sharp edges off, for a warm, soft sound
      tone.type = "lowpass"; tone.frequency.value = 2400;
      tone.connect(master).connect(ctx.destination);
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    apply();
    void ctx.resume();
    if (timer === undefined) { nextTime = ctx.currentTime + 0.1; step = 0; timer = window.setInterval(tick, 80); }
  } catch { /* audio blocked, ignore */ }
}

// iPhones only unlock sound on a finished tap (click / touchend), so listen for all of them until the sound is really running.
const GESTURES = ["pointerdown", "touchend", "click", "keydown"] as const;
const unlock = () => {
  begin();
  if (ctx && ctx.state === "running") GESTURES.forEach(g => window.removeEventListener(g, unlock));
};
const pauseWhenHidden = () => {
  if (!ctx) return;
  if (document.visibilityState === "hidden") void ctx.suspend();
  else if (wanted) void ctx.resume();
};

/** Plays the music at `level` (0 to 1). Until the first tap the browser stays silent, so it starts then. */
export function startMusic(level: number) {
  if (typeof window === "undefined") return;
  volume = Math.min(1, Math.max(0, level));
  if (wanted) { apply(); return; }
  wanted = true;
  document.addEventListener("visibilitychange", pauseWhenHidden);
  GESTURES.forEach(g => window.addEventListener(g, unlock));
  begin(); // works straight away when the browser already allows sound
  if (ctx && ctx.state === "running") GESTURES.forEach(g => window.removeEventListener(g, unlock));
}

/** Changes the volume (0 to 1) while the music plays, without restarting it. */
export function setMusicVolume(level: number) {
  volume = Math.min(1, Math.max(0, level));
  apply();
}

export function stopMusic() {
  if (typeof window === "undefined") return;
  wanted = false;
  GESTURES.forEach(g => window.removeEventListener(g, unlock));
  document.removeEventListener("visibilitychange", pauseWhenHidden);
  if (timer !== undefined) { window.clearInterval(timer); timer = undefined; }
  if (ctx) void ctx.suspend();
}
