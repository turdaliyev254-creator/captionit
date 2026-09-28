// Caption engine shared by the mobile live preview (React Native) and the export renderer (Remotion).
// Everything here is pure: given phrases, a style and a time, it says what is on screen and how it moves.
// All pixel values are in "canvas units" of a 1080px-wide frame; renderers multiply by width / 1080.

export type Word = { word: string; start: number; end: number };
export type Phrase = { id: string; start: number; end: number; words: Word[] };

export type FontFamily =
  | 'Inter' | 'Poppins' | 'Montserrat' | 'Anton' | 'BebasNeue' | 'Bangers'
  | 'Rubik' | 'PlayfairDisplay' | 'PermanentMarker' | 'Unbounded' | 'Outfit' | 'Oswald' | 'Gilroy';

export type AnimationType =
  | 'none' | 'fade' | 'pop' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight'
  | 'alternate' | 'drop' | 'zoomOut' | 'rotateIn' | 'blurIn';

export type HighlightMode = 'none' | 'color' | 'box' | 'scale' | 'dim';
// phrase: whole phrase at once; progressive: words appear as spoken; word: one word at a time
export type DisplayMode = 'phrase' | 'progressive' | 'word';
export type ContainerType = 'none' | 'box' | 'glass';

export type CaptionStyle = {
  id: string;
  label: string;
  category: 'glass' | 'animated' | 'trend' | 'minimal';
  font: { family: FontFamily; weight: number; italic?: boolean; size: number; uppercase: boolean; letterSpacing: number };
  color: string;
  highlightColor: string;
  highlightTextColor?: string;
  highlightMode: HighlightMode;
  stroke?: { color: string; width: number };
  shadow?: { color: string; blur: number; x: number; y: number };
  container: {
    type: ContainerType;
    color: string; // box fill, or glass tint
    radius: number;
    padX: number;
    padY: number;
    blur?: number; // glass backdrop blur
    border?: string;
    tint?: 'light' | 'dark';
  };
  display: DisplayMode;
  animation: { type: AnimationType; scope: 'word' | 'phrase'; duration: number; stagger?: number };
  y: number; // vertical center of the caption block, 0 (top) .. 1 (bottom)
  maxWidth: number; // fraction of frame width
};

export type StyleOverrides = Partial<{
  fontFamily: FontFamily;
  size: number;
  color: string;
  highlightColor: string;
  uppercase: boolean;
  y: number;
  animation: AnimationType;
  highlightMode: HighlightMode;
}>;

// Google fonts are OFL. Gilroy is commercial: its files are local-only (gitignored, shared/fonts/gilroy).
export const FONTS: Record<FontFamily, { label: string; weights: number[]; italic?: boolean }> = {
  Gilroy: { label: 'Gilroy', weights: [500, 600] },
  Outfit: { label: 'Outfit', weights: [700, 800] },
  Inter: { label: 'Inter', weights: [600, 800] },
  Poppins: { label: 'Poppins', weights: [700, 800] },
  Montserrat: { label: 'Montserrat', weights: [800, 900] },
  Anton: { label: 'Anton', weights: [400] },
  Oswald: { label: 'Oswald', weights: [700] },
  BebasNeue: { label: 'Bebas Neue', weights: [400] },
  Bangers: { label: 'Bangers', weights: [400] },
  Rubik: { label: 'Rubik', weights: [800] },
  PlayfairDisplay: { label: 'Playfair', weights: [700], italic: true },
  PermanentMarker: { label: 'Marker', weights: [400] },
  Unbounded: { label: 'Unbounded', weights: [800] },
};

export const ANIMATIONS: { id: AnimationType; label: string }[] = [
  { id: 'none', label: "Yo'q" },
  { id: 'fade', label: 'Paydo' },
  { id: 'pop', label: 'Pop' },
  { id: 'alternate', label: '4 tomondan' },
  { id: 'slideUp', label: 'Pastdan' },
  { id: 'slideDown', label: 'Tepadan' },
  { id: 'slideLeft', label: "O'ngdan" },
  { id: 'slideRight', label: 'Chapdan' },
  { id: 'drop', label: 'Tushish' },
  { id: 'zoomOut', label: 'Zarba' },
  { id: 'rotateIn', label: 'Aylanish' },
  { id: 'blurIn', label: 'Blur' },
];

export function nearestWeight(family: FontFamily, weight: number) {
  return FONTS[family].weights.reduce((a, b) => (Math.abs(b - weight) < Math.abs(a - weight) ? b : a));
}

export function resolveStyle(style: CaptionStyle, o: StyleOverrides = {}): CaptionStyle {
  const family = o.fontFamily ?? style.font.family;
  return {
    ...style,
    font: {
      ...style.font,
      family,
      weight: nearestWeight(family, style.font.weight),
      italic: family === style.font.family ? style.font.italic : FONTS[family].italic,
      size: o.size ?? style.font.size,
      uppercase: o.uppercase ?? style.font.uppercase,
    },
    color: o.color ?? style.color,
    highlightColor: o.highlightColor ?? style.highlightColor,
    highlightMode: o.highlightMode ?? style.highlightMode,
    y: o.y ?? style.y,
    animation: o.animation ? { ...style.animation, type: o.animation } : style.animation,
  };
}

// ---------- phrases ----------

let idCounter = 0;
export const newId = () => `p${Date.now().toString(36)}${(idCounter++).toString(36)}`;

// Split words into short on-screen phrases; break on long pauses or sentence ends.
export function buildPhrases(words: Word[], maxWords = 4): Phrase[] {
  const phrases: Phrase[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (!cur.length) return;
    phrases.push({ id: newId(), start: cur[0].start, end: cur[cur.length - 1].end, words: cur });
    cur = [];
  };
  for (const w of words) {
    const prev = cur[cur.length - 1];
    if (prev && (cur.length >= maxWords || w.start - prev.end > 0.6 || /[.!?…]$/.test(prev.word))) flush();
    cur.push({ ...w, word: w.word.trim() });
  }
  flush();
  return phrases;
}

// Replace a phrase's text, keeping word timings when the word count matches,
// otherwise spreading the new words evenly across the phrase duration.
export function setPhraseText(p: Phrase, text: string): Phrase {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === p.words.length) {
    return { ...p, words: p.words.map((w, i) => ({ ...w, word: tokens[i] })) };
  }
  const span = Math.max(p.end - p.start, 0.3);
  const step = span / Math.max(tokens.length, 1);
  return {
    ...p,
    words: tokens.map((word, i) => ({ word, start: p.start + i * step, end: p.start + (i + 1) * step })),
  };
}

// ---------- timing ----------

// Keep a phrase on screen through short gaps so captions don't flicker.
export function activePhrase(phrases: Phrase[], t: number): Phrase | null {
  for (let i = 0; i < phrases.length; i++) {
    const p = phrases[i];
    const next = phrases[i + 1];
    const holdEnd = next ? Math.min(next.start, p.end + 0.4) : p.end + 0.4;
    if (t >= p.start && t < holdEnd) return p;
  }
  return null;
}

export type WordFrame = {
  index: number;
  text: string;
  active: boolean;
  spoken: boolean; // started already
  anim: { opacity: number; x: number; y: number; scale: number; rotate: number; blur: number };
  highlight: number; // 0..1, eased highlight strength for the active word
};

export type PhraseFrame = { phrase: Phrase; words: WordFrame[]; container: { opacity: number; scale: number } };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const easeOutBack = (p: number) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};
const easeOutBounce = (p: number) => {
  const n1 = 7.5625, d1 = 2.75;
  if (p < 1 / d1) return n1 * p * p;
  if (p < 2 / d1) return n1 * (p -= 1.5 / d1) * p + 0.75;
  if (p < 2.5 / d1) return n1 * (p -= 2.25 / d1) * p + 0.9375;
  return n1 * (p -= 2.625 / d1) * p + 0.984375;
};

const DIST = 120; // canvas units travelled by slide animations

export function animate(type: AnimationType, raw: number, index: number): WordFrame['anim'] {
  const p = clamp01(raw);
  const e = easeOutCubic(p);
  const base = { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0, blur: 0 };
  switch (type) {
    case 'none':
      return base;
    case 'fade':
      return { ...base, opacity: e };
    case 'pop':
      return { ...base, opacity: clamp01(p * 3), scale: 0.4 + 0.6 * easeOutBack(p) };
    case 'slideUp':
      return { ...base, opacity: clamp01(p * 2), y: DIST * (1 - e) };
    case 'slideDown':
      return { ...base, opacity: clamp01(p * 2), y: -DIST * (1 - e) };
    case 'slideLeft':
      return { ...base, opacity: clamp01(p * 2), x: DIST * 1.5 * (1 - e) };
    case 'slideRight':
      return { ...base, opacity: clamp01(p * 2), x: -DIST * 1.5 * (1 - e) };
    case 'alternate': {
      // Each word enters from a different side: top, right, bottom, left.
      const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      const [dx, dy] = dirs[index % 4];
      const b = 1 - easeOutBack(p);
      return { ...base, opacity: clamp01(p * 2.5), x: dx * DIST * 1.6 * b, y: dy * DIST * 1.6 * b };
    }
    case 'drop':
      return { ...base, opacity: clamp01(p * 4), y: -DIST * 2 * (1 - easeOutBounce(p)) };
    case 'zoomOut':
      return { ...base, opacity: clamp01(p * 3), scale: 1 + 0.8 * (1 - e) };
    case 'rotateIn':
      return { ...base, opacity: clamp01(p * 2), rotate: -25 * (1 - easeOutBack(p)), scale: 0.6 + 0.4 * easeOutBack(p) };
    case 'blurIn':
      return { ...base, opacity: e, blur: 18 * (1 - e), scale: 1.08 - 0.08 * e };
  }
}

export function framePhrase(phrases: Phrase[], style: CaptionStyle, t: number): PhraseFrame | null {
  const phrase = activePhrase(phrases, t);
  if (!phrase) return null;
  const { animation, display } = style;
  const words = phrase.words;

  // Index of the word currently being spoken (last one that has started).
  let activeIdx = -1;
  words.forEach((w, i) => {
    if (t >= w.start) activeIdx = i;
  });

  const out: WordFrame[] = [];
  words.forEach((w, i) => {
    if (display === 'word' && i !== Math.max(activeIdx, 0)) return;
    if (display === 'progressive' && i > activeIdx && !(i === 0 && activeIdx < 0)) return;

    let appearAt: number;
    if (animation.scope === 'phrase') appearAt = phrase.start;
    else if (display === 'phrase') appearAt = phrase.start + i * (animation.stagger ?? 0.06);
    else appearAt = Math.min(w.start, phrase.start + i * 10);

    const progress = animation.type === 'none' ? 1 : (t - appearAt) / animation.duration;
    const active = i === activeIdx;
    out.push({
      index: i,
      text: style.font.uppercase ? w.word.toLocaleUpperCase('uz') : w.word,
      active,
      spoken: i <= activeIdx,
      anim: animate(animation.type, progress, i),
      highlight: active ? easeOutCubic(clamp01((t - w.start) / 0.12)) : 0,
    });
  });

  const cp = animation.scope === 'phrase' ? 1 : easeOutCubic(clamp01((t - phrase.start) / 0.18));
  return { phrase, words: out, container: { opacity: cp, scale: 0.94 + 0.06 * cp } };
}

// Stroke rendered as a ring of hard text-shadows: identical on web (CSS) and native (stacked copies).
export function strokeOffsets(width: number, steps = 16) {
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    out.push({ x: Math.cos(a) * width, y: Math.sin(a) * width });
  }
  return out;
}

export function wordOpacity(style: CaptionStyle, w: WordFrame) {
  if (style.highlightMode === 'dim' && !w.spoken) return 0.45;
  return 1;
}

export function wordColor(style: CaptionStyle, w: WordFrame) {
  if (!w.active) return style.color;
  if (style.highlightMode === 'color' || style.highlightMode === 'scale') return style.highlightColor;
  if (style.highlightMode === 'box') return style.highlightTextColor ?? style.color;
  return style.color;
}

export function wordScale(style: CaptionStyle, w: WordFrame) {
  return style.highlightMode === 'scale' ? 1 + 0.12 * w.highlight : 1;
}
