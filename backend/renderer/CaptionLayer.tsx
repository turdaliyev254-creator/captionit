import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  CaptionStyle, framePhrase, Phrase, strokeOffsets, wordColor, wordOpacity, wordScale,
} from '../../shared/captions';
import { CSS_FONT } from './fonts';

function textShadow(style: CaptionStyle, k: number) {
  const parts: string[] = [];
  if (style.stroke) {
    for (const o of strokeOffsets(style.stroke.width * k)) parts.push(`${o.x}px ${o.y}px 0 ${style.stroke.color}`);
  }
  if (style.shadow) {
    const s = style.shadow;
    parts.push(`${s.x * k}px ${s.y * k}px ${s.blur * k}px ${s.color}`);
  }
  return parts.join(', ') || undefined;
}

function containerStyle(style: CaptionStyle, k: number): React.CSSProperties {
  const c = style.container;
  if (c.type === 'none') return {};
  const base: React.CSSProperties = {
    padding: `${c.padY * k}px ${c.padX * k}px`,
    borderRadius: c.radius * k,
    backgroundColor: c.color,
  };
  if (c.type === 'box') return base;
  // Liquid glass: blurred + saturated backdrop, specular sheen, hairline border, soft drop shadow.
  const sheen = c.tint === 'dark'
    ? 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 45%, rgba(255,255,255,0.06) 100%)'
    : 'linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.08) 38%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.18) 100%)';
  return {
    ...base,
    backgroundImage: sheen,
    backdropFilter: `blur(${(c.blur ?? 24) * k}px) saturate(180%)`,
    WebkitBackdropFilter: `blur(${(c.blur ?? 24) * k}px) saturate(180%)`,
    border: `${2 * k}px solid ${c.border ?? 'rgba(255,255,255,0.4)'}`,
    boxShadow: `0 ${14 * k}px ${44 * k}px rgba(0,0,0,0.28), inset 0 ${2 * k}px ${1 * k}px rgba(255,255,255,0.35)`,
  };
}

export const CaptionLayer: React.FC<{ phrases: Phrase[]; style: CaptionStyle }> = ({ phrases, style }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const f = framePhrase(phrases, style, frame / fps);
  if (!f) return null;

  const k = width / 1080;
  const size = style.font.size * k;
  const shadow = textShadow(style, k);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute', left: 0, right: 0, top: style.y * height, height: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <div
          style={{
            maxWidth: style.maxWidth * width,
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
            opacity: f.container.opacity,
            transform: `scale(${f.container.scale})`,
            ...containerStyle(style, k),
          }}
        >
          {f.words.map((w) => {
            const a = w.anim;
            const box = style.highlightMode === 'box';
            return (
              <span
                key={`${f.phrase.id}-${w.index}`}
                style={{
                  display: 'inline-block',
                  margin: `${size * 0.04}px ${size * (box ? 0.04 : 0.13)}px`,
                  padding: box ? `${size * 0.02}px ${size * 0.14}px` : undefined,
                  borderRadius: size * 0.18,
                  backgroundColor: box && w.active ? style.highlightColor : 'transparent',
                  opacity: a.opacity * wordOpacity(style, w),
                  transform: `translate(${a.x * k}px, ${a.y * k}px) scale(${a.scale * wordScale(style, w)}) rotate(${a.rotate}deg)`,
                  filter: a.blur > 0.1 ? `blur(${a.blur * k}px)` : undefined,
                  color: wordColor(style, w),
                  fontFamily: CSS_FONT[style.font.family],
                  fontWeight: style.font.weight,
                  fontStyle: style.font.italic ? 'italic' : 'normal',
                  fontSize: size,
                  letterSpacing: style.font.letterSpacing * k,
                  lineHeight: 1.18,
                  textShadow: box && w.active ? undefined : shadow,
                  whiteSpace: 'pre',
                }}
              >
                {w.text}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
