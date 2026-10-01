"use client";

// Upbeat background music, synthesized live (no audio files): a bouncy 4-bar loop with bass, beat, arpeggio and a catchy tune.
// Browsers only allow sound after a tap, so startMusic() waits for the first tap or key press.
const BPM = 124;
const STEP = 60 / BPM / 4; // one sixteenth note, in seconds
const LOOP = 64; // sixteenths: 4 bars
const MAX_GAIN = 0.22; // the slider's top end: lively but never loud
const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

// C - G - Am - F, one chord per bar: [bass note, arpeggio notes].
const CHORDS = [
  { bass: 36, arp: [60, 64, 67, 72] },
  { bass: 43, arp: [59, 62, 67, 71] },
  { bass: 45, arp: [60, 64, 69, 72] },
  { bass: 41, arp: [60, 65, 69, 72] },
];
// The tune, eighth notes per bar (0 = rest).
const TUNE = [
  [79, 0, 76, 79, 81, 0, 79, 76],
  [78, 0, 74, 78, 79, 0, 74, 71],
  [76, 0, 79, 81, 84, 0, 81, 79],
  [77, 0, 81, 84, 81, 79, 77, 76],
];

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let timer: number | undefined;
let nextTime = 0;
let step = 0;
let wanted = false;
let volume = 0.5;

function tone(time: number, midi: number, length: number, type: OscillatorType, peak: number) {
  const osc = ctx!.createOscillator(), gain = ctx!.createGain();
  osc.type = type; osc.frequency.value = hz(midi);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(peak, time + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
  osc.connect(gain).connect(master!);
  osc.start(time); osc.stop(time + length + 0.05);
}

function kick(time: number) {
  const osc = ctx!.createOscillator(), gain = ctx!.createGain();
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
  gain.gain.setValueAtTime(0.5, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.18);
  osc.connect(gain).connect(master!);
  osc.start(time); osc.stop(time + 0.2);
}

function hat(time: number, peak: number, length: number) {
  const src = ctx!.createBufferSource(), filter = ctx!.createBiquadFilter(), gain = ctx!.createGain();
  src.buffer = noise;
  filter.type = "highpass"; filter.frequency.value = 7000;
  gain.gain.setValueAtTime(peak, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + length);
  src.connect(filter).connect(gain).connect(master!);
  src.start(time); src.stop(time + length + 0.02);
}

function schedule(index: number, time: number) {
  const s = index % LOOP, bar = Math.floor(s / 16), beat = s % 16, chord = CHORDS[bar];
  if (beat % 8 === 0 || beat === 10) kick(time);
  if (beat % 4 === 2) hat(time, 0.12, 0.05);
  if (beat === 4 || beat === 12) hat(time, 0.22, 0.12); // a snappy clap on 2 and 4
  if (beat % 4 === 0 || beat === 10) tone(time, chord.bass, STEP * 3, "triangle", 0.34);
  if (beat % 2 === 0) tone(time, chord.arp[(beat / 2) % 4], STEP * 1.8, "square", 0.045);
  if (beat % 2 === 0) {
    const note = TUNE[bar][beat / 2];
    if (note) tone(time, note, STEP * 1.9, "triangle", 0.2);
  }
}

function tick() {
  if (!ctx) return;
  while (nextTime < ctx.currentTime + 0.25) { schedule(step, nextTime); nextTime += STEP; step++; }
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
      master.connect(ctx.destination);
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    apply();
    void ctx.resume();
    if (timer === undefined) { nextTime = ctx.currentTime + 0.1; step = 0; timer = window.setInterval(tick, 80); }
  } catch { /* audio blocked, ignore */ }
}

const unlock = () => { window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); begin(); };
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
  if (ctx && ctx.state === "running") begin();
  else {
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    begin(); // works straight away when the browser already allows sound
  }
}

export function stopMusic() {
  if (typeof window === "undefined") return;
  wanted = false;
  window.removeEventListener("pointerdown", unlock);
  window.removeEventListener("keydown", unlock);
  document.removeEventListener("visibilitychange", pauseWhenHidden);
  if (timer !== undefined) { window.clearInterval(timer); timer = undefined; }
  if (ctx) void ctx.suspend();
}
