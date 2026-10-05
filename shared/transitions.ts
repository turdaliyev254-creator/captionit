import type { Phrase } from './captions';

// Glass transition: a fluted-glass panel sweeps across the frame at the start of the video
// and/or at each new sentence, with whoosh sounds. Shared by the live preview and the Remotion
// export, like captions.ts. Times are on whatever timeline the phrases use.

export type TransitionMode = 'none' | 'intro' | 'sentences';
export type TransitionSettings = { mode: TransitionMode; sfx: boolean };

export const DEFAULT_TRANSITION: TransitionSettings = { mode: 'none', sfx: true };

export const TRANSITION_MODES: { id: TransitionMode; label: string }[] = [
  { id: 'none', label: "Yo'q" },
  { id: 'intro', label: 'Boshida' },
  { id: 'sentences', label: 'Har gapda' },
];

export const SWEEP = 0.7; // seconds for one sweep
export const PANEL_WIDTH = 0.42; // fraction of frame width
const MIN_SPACING = 3; // at most one sweep every 3 s
const SENTENCE_GAP = 0.7; // a pause this long also starts a new sentence
const MAX_SWEEPS = 30;

// Start time of each sweep. A sentence sweep is centred on the moment the sentence starts.
export function transitionTimes(phrases: Phrase[], mode: TransitionMode, duration: number): number[] {
  if (mode === 'none' || duration < SWEEP) return [];
  const times = [0];
  if (mode !== 'sentences') return times;
  const sorted = [...phrases].sort((a, b) => a.start - b.start);
  for (let i = 1; i < sorted.length && times.length < MAX_SWEEPS; i++) {
    const prev = sorted[i - 1];
    const last = prev.words[prev.words.length - 1];
    const newSentence = /[.!?…]$/.test(last?.word.trim() ?? '') || sorted[i].start - prev.end > SENTENCE_GAP;
    if (!newSentence) continue;
    const t = Math.max(0, sorted[i].start - SWEEP / 2);
    if (t - times[times.length - 1] >= MIN_SPACING && t + SWEEP <= duration) times.push(t);
  }
  return times;
}

const easeInOutCubic = (p: number) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2);

// Panel position at time t: left edge as a fraction of frame width (-PANEL_WIDTH .. 1), or null.
export function panelLeft(times: number[], t: number): number | null {
  for (const t0 of times) {
    if (t >= t0 && t <= t0 + SWEEP) {
      const p = easeInOutCubic((t - t0) / SWEEP);
      return -PANEL_WIDTH + (1 + PANEL_WIDTH) * p;
    }
  }
  return null;
}

// Sounds (files in backend/sfx, licensed separately and kept out of git). `peak` is the loudest
// point of each file, so it lands when the panel crosses the middle of the frame.
export type SfxCue = { file: string; at: number; volume: number };

const INTRO_SFX = [
  { file: 'slider_04.wav', peak: 0.1, volume: 0.5 },
  { file: 'whoosh_01.wav', peak: 0.265, volume: 0.8 },
];
const SWEEP_SFX = [
  { file: 'whoosh_18.wav', peak: 0.247, volume: 0.9 },
  { file: 'whoosh_01.wav', peak: 0.265, volume: 0.8 },
];
export const SFX_FILES = [...new Set([...INTRO_SFX, ...SWEEP_SFX].map((s) => s.file))];

export function sfxCues(times: number[]): SfxCue[] {
  return times.flatMap((t0, i) =>
    (i === 0 ? INTRO_SFX : [SWEEP_SFX[(i - 1) % SWEEP_SFX.length]]).map((s) => ({
      file: s.file,
      at: Math.max(0, t0 + SWEEP / 2 - s.peak),
      volume: s.volume,
    })),
  );
}
