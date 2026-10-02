"use client";

// Calm focus music, synthesized live (no audio files). Each world has its own tune:
//  - Candy Land: a bouncy music-box tune with soft marimba chords,
//  - Space Adventure: slow floating pads, a deep hum and twinkling echoes, no drums,
//  - Ocean World: the lo-fi loop (soft pads, gentle bass, quiet beat) with rolling waves and bubbles.
// Browsers only allow sound after a tap, so startMusic() waits for the first tap or key press.
const LOOP = 128; // sixteenths: 8 bars
const MAX_GAIN = 0.7; // the slider's top end; the default (half way) is a comfortable medium
const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

export type MusicTrack = "bloom" | "space" | "ocean";
type Chord = { bass: number; pad: number[] };
type Track = { bpm: number; cutoff: number; echo: number; play: (bar: number, beat: number, time: number, step: number) => void };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let tone: BiquadFilterNode | null = null;
let delay: DelayNode | null = null;
let echo: GainNode | null = null;
let noise: AudioBuffer | null = null;
let timer: number | undefined;
let quiet: number | undefined; // the pending suspend after a fade-out
let nextTime = 0;
let step = 0;
let wanted = false;
let volume = 0.5;
let current: MusicTrack = "bloom";

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

function thump(time: number, peak = 0.42) {
  const osc = ctx!.createOscillator(), gain = ctx!.createGain();
  osc.frequency.setValueAtTime(110, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.14);
  gain.gain.setValueAtTime(peak, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
  osc.connect(gain).connect(tone!);
  osc.start(time); osc.stop(time + 0.25);
}

function brush(time: number, peak: number, freq = 5500) {
  const src = ctx!.createBufferSource(), filter = ctx!.createBiquadFilter(), gain = ctx!.createGain();
  src.buffer = noise;
  filter.type = "bandpass"; filter.frequency.value = freq;
  gain.gain.setValueAtTime(peak, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);
  src.connect(filter).connect(gain).connect(tone!);
  src.start(time); src.stop(time + 0.12);
}

/** A wave rolling in and back out: soft noise that swells and brightens, then fades. */
function wave(time: number, length: number, peak: number) {
  const src = ctx!.createBufferSource(), filter = ctx!.createBiquadFilter(), gain = ctx!.createGain();
  src.buffer = noise; src.loop = true;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(250, time);
  filter.frequency.linearRampToValueAtTime(1100, time + length * 0.45);
  filter.frequency.linearRampToValueAtTime(220, time + length);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.linearRampToValueAtTime(peak, time + length * 0.45);
  gain.gain.linearRampToValueAtTime(0.0001, time + length);
  src.connect(filter).connect(gain).connect(tone!);
  src.start(time); src.stop(time + length + 0.1);
}

/** A little bubble: a quick, soft blip that slides upwards. */
function bubble(time: number, midi: number) {
  const osc = ctx!.createOscillator(), gain = ctx!.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(hz(midi), time);
  osc.frequency.exponentialRampToValueAtTime(hz(midi + 12), time + 0.07);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(0.06, time + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.1);
  osc.connect(gain).connect(tone!);
  osc.start(time); osc.stop(time + 0.12);
}

// Candy Land, in F major: F - Dm - Bb - C, a sweet pentatonic music-box tune (eighth notes per bar, 0 = rest).
const CANDY_CHORDS: Chord[] = [
  { bass: 41, pad: [60, 65, 69] }, { bass: 38, pad: [62, 65, 69] }, { bass: 46, pad: [58, 62, 65] }, { bass: 36, pad: [60, 64, 67] },
];
const CANDY_TUNE = [
  [72, 0, 77, 0, 81, 0, 77, 0], [74, 0, 77, 0, 81, 0, 0, 0], [74, 0, 70, 0, 74, 77, 0, 0], [76, 0, 72, 0, 79, 0, 76, 0],
  [81, 0, 79, 0, 77, 0, 72, 0], [74, 0, 0, 77, 0, 74, 69, 0], [70, 0, 74, 0, 77, 0, 74, 0], [72, 0, 76, 0, 79, 0, 0, 0],
];
const candy: Track = {
  bpm: 84, cutoff: 3200, echo: 0.12,
  play(bar, beat, time, step) {
    const chord = CANDY_CHORDS[bar % 4];
    // Oom-pah: a round bass on the beat, soft marimba chord stabs off the beat.
    if (beat === 0 || beat === 8) { note(time, chord.bass, step * 4, "sine", 0.34, 0.01); thump(time, 0.22); }
    if (beat === 4 || beat === 12) chord.pad.forEach(m => note(time, m, step * 2.5, "triangle", 0.06, 0.005));
    if (beat === 0) chord.pad.forEach(m => note(time, m - 12, step * 15, "sine", 0.05, 0.6));
    if (beat % 4 === 2) brush(time, 0.035, 8000);
    if (beat % 2 === 0) {
      const m = CANDY_TUNE[bar][beat / 2];
      // Music box: a bright, quick-fading bell with a quiet octave on top.
      if (m) { note(time, m, step * 5, "sine", 0.2, 0.004); note(time, m + 12, step * 2, "sine", 0.05, 0.004); }
    }
    if (bar % 2 === 1 && beat === 14) note(time, 96, step * 3, "sine", 0.03, 0.004); // a sparkle
  },
};

// Space Adventure, floaty and open: Am9 - Fmaj7 - Cmaj7 - Em7, long pads with an echoing arpeggio and a few high stars.
const SPACE_CHORDS: Chord[] = [
  { bass: 45, pad: [60, 64, 67, 71] }, { bass: 41, pad: [57, 60, 64, 69] }, { bass: 48, pad: [55, 59, 64, 67] }, { bass: 40, pad: [55, 59, 62, 67] },
];
const SPACE_TUNE = [
  [76, 0, 0, 0, 0, 0, 79, 0], [0, 0, 0, 0, 81, 0, 0, 0], [79, 0, 0, 0, 76, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0],
  [83, 0, 0, 0, 81, 0, 0, 0], [0, 0, 76, 0, 0, 0, 0, 0], [79, 0, 0, 0, 0, 0, 74, 0], [0, 0, 0, 0, 0, 0, 0, 0],
];
const space: Track = {
  bpm: 60, cutoff: 2000, echo: 0.42,
  play(bar, beat, time, step) {
    const chord = SPACE_CHORDS[bar % 4];
    if (beat === 0) {
      chord.pad.forEach((m, i) => note(time, m, step * 17, "sine", 0.12, 1.6, i % 2 ? 9 : -9));
      note(time, chord.bass, step * 17, "sine", 0.26, 1.2); // the deep hum of the ship
    }
    // A slow arpeggio climbing through the chord, every three sixteenths, echoing away.
    if (beat % 3 === 0 && beat < 15) note(time, chord.pad[(beat / 3) % chord.pad.length] + 12, step * 3, "sine", 0.05, 0.01);
    if (beat % 2 === 0) {
      const m = SPACE_TUNE[bar][beat / 2];
      if (m) note(time, m, step * 10, "triangle", 0.12, 0.25);
    }
    if (bar % 4 === 3 && (beat === 6 || beat === 13)) note(time, beat === 6 ? 91 : 88, step * 4, "sine", 0.025, 0.01); // stars
  },
};

// Ocean World: Cmaj7 - Am7 - Fmaj7 - G6, the lo-fi beat with an airy pentatonic tune, waves every two bars and bubbles.
const OCEAN_CHORDS: Chord[] = [
  { bass: 36, pad: [55, 59, 62, 64] }, { bass: 33, pad: [55, 60, 64, 67] }, { bass: 41, pad: [57, 60, 64, 65] }, { bass: 43, pad: [55, 59, 62, 64] },
];
const OCEAN_TUNE = [
  [76, 0, 0, 79, 0, 76, 0, 0], [0, 72, 0, 0, 76, 0, 79, 0], [77, 0, 0, 72, 0, 0, 76, 0], [0, 74, 0, 79, 0, 0, 0, 0],
  [79, 0, 0, 76, 0, 0, 72, 0], [0, 76, 0, 0, 81, 0, 79, 0], [77, 0, 76, 0, 0, 72, 0, 0], [0, 74, 0, 71, 0, 0, 67, 0],
];
const ocean: Track = {
  bpm: 70, cutoff: 2400, echo: 0.18,
  play(bar, beat, time, step) {
    const chord = OCEAN_CHORDS[bar % 4];
    if (beat === 0) chord.pad.forEach((m, i) => { note(time, m, step * 15, "sine", 0.14, 0.9, i % 2 ? 6 : -6); note(time, m - 12, step * 15, "triangle", 0.04, 1.1); });
    if (beat === 0 && bar % 2 === 0) wave(time, step * 32, 0.09);
    if (beat === 0 || beat === 8) thump(time, 0.34);
    if (beat === 0 || beat === 6 || beat === 8) note(time, chord.bass, step * 5, "sine", 0.36);
    if (beat === 4 || beat === 12) brush(time, 0.1);
    if (beat % 2 === 0) {
      const m = OCEAN_TUNE[bar][beat / 2];
      if (m) { note(time, m, step * 7, "triangle", 0.2); note(time, m + 12, step * 3, "sine", 0.04); }
    }
    if ((bar === 1 || bar === 5) && (beat === 10 || beat === 11 || beat === 13)) bubble(time, 84 + beat - 10);
  },
};

const TRACKS: Record<MusicTrack, Track> = { bloom: candy, space, ocean };
const isTrack = (id: string): id is MusicTrack => id in TRACKS;
const stepOf = (track: Track) => 60 / track.bpm / 4; // one sixteenth note, in seconds

function schedule(index: number, time: number) {
  const track = TRACKS[current], s = index % LOOP;
  track.play(Math.floor(s / 16) % 8, s % 16, time, stepOf(track));
}

function tick() {
  if (!ctx) return;
  while (nextTime < ctx.currentTime + 0.3) { schedule(step, nextTime); nextTime += stepOf(TRACKS[current]); step++; }
}

/** The world's own sound: how bright it is and how much echo it has. */
function shape() {
  if (!ctx || !tone || !delay || !echo) return;
  const track = TRACKS[current], now = ctx.currentTime;
  tone.frequency.setTargetAtTime(track.cutoff, now, 0.3);
  delay.delayTime.setTargetAtTime(stepOf(track) * 3, now, 0.05);
  echo.gain.setTargetAtTime(track.echo, now, 0.3);
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
      master.gain.value = 0;
      tone = ctx.createBiquadFilter(); // takes the sharp edges off, for a warm, soft sound
      tone.type = "lowpass"; tone.frequency.value = TRACKS[current].cutoff;
      tone.connect(master).connect(ctx.destination);
      // A soft echo, mostly for Space: the sound repeats a dotted eighth later, quieter each time.
      delay = ctx.createDelay(2); echo = ctx.createGain();
      const feedback = ctx.createGain(); feedback.gain.value = 0.35;
      tone.connect(delay); delay.connect(feedback).connect(delay); delay.connect(echo).connect(master);
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      shape();
    }
    if (quiet !== undefined) { window.clearTimeout(quiet); quiet = undefined; }
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

/** Switches to a world's tune (Candy Land, Space or Ocean). The new tune starts from its first bar. */
export function setMusicTrack(id: string) {
  const next = isTrack(id) ? id : "bloom";
  if (next === current) return;
  current = next;
  step = 0;
  shape();
}

/** Changes the volume (0 to 1) while the music plays, without restarting it. */
export function setMusicVolume(level: number) {
  volume = Math.min(1, Math.max(0, level));
  apply();
}

/** Fades the music out (so it doesn't click), then goes quiet. */
export function stopMusic() {
  if (typeof window === "undefined") return;
  wanted = false;
  GESTURES.forEach(g => window.removeEventListener(g, unlock));
  document.removeEventListener("visibilitychange", pauseWhenHidden);
  if (timer !== undefined) { window.clearInterval(timer); timer = undefined; }
  if (!ctx || !master) return;
  master.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
  if (quiet === undefined) quiet = window.setTimeout(() => { quiet = undefined; if (!wanted) void ctx?.suspend(); }, 400);
}
