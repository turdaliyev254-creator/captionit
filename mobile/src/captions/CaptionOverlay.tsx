import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CaptionStyle, framePhrase, Phrase, strokeOffsets, wordColor, wordOpacity, wordScale, WordFrame,
} from '../../../shared/captions';
import { rnFont } from '../fonts';

type Props = {
  phrases: Phrase[];
  style: CaptionStyle;
  time: number;
  width: number; // rendered frame size in points
  height: number;
  scale?: number; // canvas-unit multiplier; defaults to width / 1080
};

// React Native twin of backend/renderer/CaptionLayer.tsx — keep the two in sync.
export const CaptionOverlay = memo(function CaptionOverlay({ phrases, style, time, width, height, scale }: Props) {
  const f = framePhrase(phrases, style, time);
  if (!f) return null;
  const k = scale ?? width / 1080;
  const c = style.container;

  const padX = c.type === 'none' ? 0 : c.padX * k;
  const padY = c.type === 'none' ? 0 : c.padY * k;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {/* A full-height band centred on the caption's y line; the block is centred inside it. */}
      <View style={[s.band, { top: style.y * height - height, height: height * 2 }]}>
        <View
          style={{
            maxWidth: style.maxWidth * width,
            paddingHorizontal: padX,
            paddingVertical: padY,
            opacity: f.container.opacity,
            transform: [{ scale: f.container.scale }],
          }}
        >
          {/* Background is a sibling of the word row, never part of its wrapping layout. */}
          {c.type !== 'none' && <ContainerBackground style={style} k={k} />}
          <View style={s.words}>
            {f.words.map((w) => (
              <CaptionWord key={`${f.phrase.id}-${w.index}`} w={w} style={style} k={k} />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
});

function ContainerBackground({ style, k }: { style: CaptionStyle; k: number }) {
  const c = style.container;
  const radius = c.radius * k;
  if (c.type === 'box') {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: c.color, borderRadius: radius }]} />;
  }
  // Glass lives in its own clipped layer so flying words aren't clipped by the rounded corners.
  const dark = c.tint === 'dark';
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: radius, overflow: 'hidden',
          borderWidth: Math.max(1, 2 * k), borderColor: c.border ?? 'rgba(255,255,255,0.4)',
        },
      ]}
    >
      <BlurView intensity={Math.min(100, (c.blur ?? 24) * 2.2)} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.color }]} />
      <LinearGradient
        colors={dark
          ? ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.06)']
          : ['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.18)']}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function CaptionWord({ w, style, k }: { w: WordFrame; style: CaptionStyle; k: number }) {
  const a = w.anim;
  const size = style.font.size * k;
  const box = style.highlightMode === 'box';
  const text = {
    fontFamily: rnFont(style.font.family, style.font.weight, style.font.italic),
    fontSize: size,
    lineHeight: size * 1.18,
    letterSpacing: style.font.letterSpacing * k,
  };
  const shadow = style.shadow && !(box && w.active)
    ? {
        textShadowColor: style.shadow.color,
        textShadowOffset: { width: style.shadow.x * k, height: style.shadow.y * k },
        textShadowRadius: Math.max(style.shadow.blur * k, 0.01),
      }
    : null;

  return (
    <View
      style={{
        marginHorizontal: size * (box ? 0.04 : 0.13),
        marginVertical: size * 0.04,
        paddingHorizontal: box ? size * 0.14 : 0,
        paddingVertical: box ? size * 0.02 : 0,
        borderRadius: size * 0.18,
        backgroundColor: box && w.active ? style.highlightColor : 'transparent',
        opacity: a.opacity * wordOpacity(style, w),
        transform: [
          { translateX: a.x * k },
          { translateY: a.y * k },
          { scale: a.scale * wordScale(style, w) },
          { rotate: `${a.rotate}deg` },
        ],
      }}
    >
      {style.stroke && !(box && w.active) &&
        strokeOffsets(style.stroke.width * k, 8).map((o, i) => (
          <Text
            key={i}
            style={[text, s.strokeCopy, { color: style.stroke!.color, left: (box ? size * 0.14 : 0) + o.x, top: (box ? size * 0.02 : 0) + o.y }]}
          >
            {w.text}
          </Text>
        ))}
      <Text style={[text, { color: wordColor(style, w) }, shadow]}>{w.text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  band: { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center' },
  words: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  strokeCopy: { position: 'absolute' },
});
