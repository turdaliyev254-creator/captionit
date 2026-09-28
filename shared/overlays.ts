import type { Phrase } from './captions';

// Overlays (images, video clips) placed on top of the main video. Shared by the live
// preview and the Remotion export, like captions.ts. Times are in seconds of the SOURCE video;
// positions are fractions of the frame.

export type OverlayType = 'image' | 'video';
export type OverlayAnimation = 'none' | 'fade' | 'pop' | 'slideUp';

export type Overlay = {
  id: string;
  type: OverlayType;
  uri?: string; // local file on the phone
  src?: string; // path on the backend after upload, e.g. /jobs/<id>/assets/<file>
  aspect: number; // width / height of the media
  start: number;
  end: number;
  x: number; // centre, 0..1 of frame width
  y: number; // centre, 0..1 of frame height
  width: number; // fraction of frame width
  rotation: number; // degrees
  animation: OverlayAnimation;
};

export type Trim = { start: number; end: number };

export const OVERLAY_ANIMATIONS: { id: OverlayAnimation; label: string }[] = [
  { id: 'none', label: "Yo'q" },
  { id: 'fade', label: 'Paydo' },
  { id: 'pop', label: 'Pop' },
  { id: 'slideUp', label: 'Pastdan' },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const easeOutBack = (p: number) => 1 + 2.70158 * Math.pow(p - 1, 3) + 1.70158 * Math.pow(p - 1, 2);

const IN = 0.3; // seconds
const OUT = 0.2;

// Visibility and entrance/exit animation of an overlay at time t (source seconds).
export function overlayFrame(o: Overlay, t: number) {
  if (t < o.start || t >= o.end) return null;
  const pin = clamp01((t - o.start) / IN);
  const pout = clamp01((o.end - t) / OUT);
  const base = { opacity: 1, scale: 1, dy: 0 };
  switch (o.animation) {
    case 'none':
      return base;
    case 'fade':
      return { ...base, opacity: easeOutCubic(pin) * pout };
    case 'pop':
      return { ...base, opacity: clamp01(pin * 3) * pout, scale: 0.3 + 0.7 * easeOutBack(pin) };
    case 'slideUp':
      return { ...base, opacity: clamp01(pin * 2) * pout, dy: 0.06 * (1 - easeOutCubic(pin)) };
  }
}

// Size of an overlay in pixels for a frame of the given width.
export function overlaySize(o: Overlay, frameWidth: number) {
  const w = o.width * frameWidth;
  return { w, h: w / (o.aspect || 1) };
}

// Export timeline: shift everything so the trimmed start becomes 0 and drop what's cut away.
export function shiftForTrim<T extends { start: number; end: number }>(items: T[], trim: Trim): T[] {
  return items
    .filter((i) => i.end > trim.start && i.start < trim.end)
    .map((i) => ({ ...i, start: Math.max(0, i.start - trim.start), end: Math.min(trim.end, i.end) - trim.start }));
}

// Same for caption phrases, whose words carry their own timings.
export function shiftPhrasesForTrim(phrases: Phrase[], trim: Trim): Phrase[] {
  return phrases
    .filter((p) => p.end > trim.start && p.start < trim.end)
    .map((p) => ({
      ...p,
      start: Math.max(0, p.start - trim.start),
      end: Math.min(trim.end, p.end) - trim.start,
      words: p.words
        .filter((w) => w.end > trim.start && w.start < trim.end)
        .map((w) => ({ ...w, start: Math.max(0, w.start - trim.start), end: Math.min(trim.end, w.end) - trim.start })),
    }))
    .filter((p) => p.words.length);
}
