// Builds an ASS subtitle file with word-by-word highlighting ("karaoke" style).

const STYLES = {
  classic: {
    label: 'Classic',
    font: 'Arial Black', size: 0.055, primary: '#FFFFFF', highlight: '#FFE600',
    outline: '#000000', outlineWidth: 4, shadow: 0, uppercase: true, maxWords: 3, box: false,
  },
  bold: {
    label: 'Bold',
    font: 'Impact', size: 0.07, primary: '#FFFFFF', highlight: '#00FF7F',
    outline: '#000000', outlineWidth: 6, shadow: 2, uppercase: true, maxWords: 2, box: false,
  },
  minimal: {
    label: 'Minimal',
    font: 'Helvetica', size: 0.045, primary: '#FFFFFF', highlight: '#FFFFFF',
    outline: '#000000', outlineWidth: 2, shadow: 1, uppercase: false, maxWords: 5, box: false,
  },
  boxed: {
    label: 'Boxed',
    font: 'Arial', size: 0.05, primary: '#FFFFFF', highlight: '#FF3B6B',
    outline: '#000000', outlineWidth: 12, shadow: 0, uppercase: false, maxWords: 4, box: true,
  },
  neon: {
    label: 'Neon',
    font: 'Arial Black', size: 0.058, primary: '#E0F7FF', highlight: '#00E5FF',
    outline: '#6A00FF', outlineWidth: 5, shadow: 3, uppercase: true, maxWords: 3, box: false,
  },
};

// ASS colors are &HAABBGGRR
function assColor(hex, alpha = 0) {
  const h = hex.replace('#', '');
  const r = h.slice(0, 2), g = h.slice(2, 4), b = h.slice(4, 6);
  const a = alpha.toString(16).padStart(2, '0');
  return `&H${a}${b}${g}${r}`.toUpperCase();
}

function assTime(sec) {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const cs = Math.round((s - Math.floor(s)) * 100);
  const whole = Math.floor(s % 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(whole).padStart(2, '0')}.${String(Math.min(cs, 99)).padStart(2, '0')}`;
}

function escapeText(t) {
  return t.replace(/\\/g, '\\\\').replace(/\{/g, '(').replace(/\}/g, ')').replace(/\n/g, ' ');
}

// Group words into short on-screen phrases; break on long pauses or punctuation.
function chunkWords(words, maxWords) {
  const chunks = [];
  let cur = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const prev = cur[cur.length - 1];
    const gap = prev ? w.start - prev.end : 0;
    if (cur.length && (cur.length >= maxWords || gap > 0.6 || /[.!?]$/.test(prev.word))) {
      chunks.push(cur);
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

function buildAss(words, { width, height, styleId = 'classic', position = 'bottom' }) {
  const st = STYLES[styleId] || STYLES.classic;
  const fontSize = Math.round(Math.min(width, height) * st.size * (height > width ? 1.4 : 1));
  const alignment = position === 'top' ? 8 : position === 'middle' ? 5 : 2;
  const marginV = Math.round(height * (position === 'middle' ? 0 : 0.18));
  const borderStyle = st.box ? 3 : 1;
  const outlineColor = st.box ? assColor(st.outline, 0x40) : assColor(st.outline);

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,${st.font},${fontSize},${assColor(st.primary)},${assColor(st.highlight)},${outlineColor},${assColor('#000000', 0x80)},-1,0,0,0,100,100,0,0,${borderStyle},${st.outlineWidth},${st.shadow},${alignment},${Math.round(width * 0.08)},${Math.round(width * 0.08)},${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const hl = assColor(st.highlight);
  const lines = [];
  const clean = words
    .filter((w) => w.word && w.word.trim())
    .map((w) => ({ ...w, word: w.word.trim() }));

  for (const chunk of chunkWords(clean, st.maxWords)) {
    // One event per word so the currently spoken word is highlighted.
    chunk.forEach((active, i) => {
      const start = active.start;
      const end = i < chunk.length - 1 ? chunk[i + 1].start : active.end;
      const text = chunk
        .map((w, j) => {
          const t = escapeText(st.uppercase ? w.word.toUpperCase() : w.word);
          return j === i ? `{\\c${hl}\\fscx108\\fscy108}${t}{\\r}` : t;
        })
        .join(' ');
      lines.push(`Dialogue: 0,${assTime(start)},${assTime(Math.max(end, start + 0.05))},Main,,0,0,0,,${text}`);
    });
  }

  return header + lines.join('\n') + '\n';
}

module.exports = { STYLES, buildAss, chunkWords };
