import { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView, LayoutChangeEvent, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import {
  activePhrase, newId, Phrase, resolveStyle, setPhraseText, StyleOverrides,
} from '../../../shared/captions';
import { getStyle } from '../../../shared/styles';
import type { Job } from '../api';
import { CaptionOverlay } from '../captions/CaptionOverlay';
import { usePlayerTime } from '../captions/usePlayerTime';
import { AnimationPanel } from '../editor/AnimationPanel';
import { ColorPanel } from '../editor/ColorPanel';
import { FontPanel } from '../editor/FontPanel';
import { StylePanel } from '../editor/StylePanel';
import { TextPanel } from '../editor/TextPanel';
import { colors } from '../theme';

export type EditorSession = { phrases: Phrase[]; styleId: string; overrides: StyleOverrides };

type Tab = 'style' | 'text' | 'font' | 'color' | 'animation';
const TABS: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'style', label: 'Stil', icon: 'color-palette-outline' },
  { id: 'text', label: 'Matn', icon: 'text-outline' },
  { id: 'font', label: 'Shrift', icon: 'text' },
  { id: 'color', label: 'Rang', icon: 'color-fill-outline' },
  { id: 'animation', label: 'Animatsiya', icon: 'sparkles-outline' },
];

type Props = {
  job: Job;
  videoUri: string;
  session: EditorSession;
  onChange: (s: EditorSession) => void;
  onExport: () => void;
  onBack: () => void;
};

const fmt = (t: number) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export function EditorScreen({ job, videoUri, session, onChange, onExport, onBack }: Props) {
  const [tab, setTab] = useState<Tab>('style');
  const [box, setBox] = useState({ w: 0, h: 0 });
  const { phrases, styleId, overrides } = session;
  const style = useMemo(() => resolveStyle(getStyle(styleId), overrides), [styleId, overrides]);

  const player = useVideoPlayer(videoUri, (p) => {
    p.loop = true;
    p.play();
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const time = usePlayerTime(player);
  const duration = job.duration ?? player.duration ?? 0;

  const update = (patch: Partial<EditorSession>) => onChange({ ...session, ...patch });
  const override = (patch: StyleOverrides) => update({ overrides: { ...overrides, ...patch } });

  // Fit the video frame inside the preview area.
  const aspect = (job.width ?? 9) / (job.height ?? 16);
  const frame = box.w / box.h > aspect ? { w: box.h * aspect, h: box.h } : { w: box.w, h: box.w / aspect };

  // Tap toggles playback; vertical drag moves the captions.
  const drag = useRef({ startY: 0 });
  const live = useRef({ style, frame, isPlaying, override });
  live.current = { style, frame, isPlaying, override };
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => (drag.current.startY = live.current.style.y),
        onPanResponderMove: (_, g) => {
          if (Math.abs(g.dy) < 6) return;
          const y = drag.current.startY + g.dy / live.current.frame.h;
          live.current.override({ y: Math.min(0.92, Math.max(0.08, y)) });
        },
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6) (live.current.isPlaying ? player.pause() : player.play());
        },
      }),
    [player],
  );

  const current = activePhrase(phrases, time);

  function addPhrase() {
    const t = time;
    const next = phrases.find((p) => p.start > t);
    const end = Math.min(t + 1.5, next ? next.start : t + 1.5, duration || t + 1.5);
    const phrase: Phrase = { id: newId(), start: t, end: Math.max(end, t + 0.3), words: [{ word: 'Matn', start: t, end: Math.max(end, t + 0.3) }] };
    update({ phrases: [...phrases, phrase].sort((a, b) => a.start - b.start) });
    player.pause();
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.topBar}>
        <Pressable onPress={onBack} hitSlop={12} style={s.iconBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Pressable onPress={() => { player.pause(); onExport(); }} style={s.exportBtn}>
          <Text style={s.exportText}>Eksport</Text>
        </Pressable>
      </View>

      <View style={s.preview} onLayout={(e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {frame.w > 0 && (
          <View style={{ width: frame.w, height: frame.h, borderRadius: 12, overflow: 'hidden' }} {...pan.panHandlers}>
            <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
            <CaptionOverlay phrases={phrases} style={style} time={time} width={frame.w} height={frame.h} />
            {!isPlaying && (
              <View style={s.playOverlay} pointerEvents="none">
                <Ionicons name="play" size={44} color="rgba(255,255,255,0.9)" />
              </View>
            )}
          </View>
        )}
      </View>

      <View style={s.transport}>
        <Pressable onPress={() => (isPlaying ? player.pause() : player.play())} style={s.iconBtn}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color={colors.text} />
        </Pressable>
        <Text style={s.time}>
          {fmt(time)} <Text style={{ color: colors.muted }}>/ {fmt(duration)}</Text>
        </Text>
        <Text style={s.hint}>Subtitrni surib joyini o'zgartiring</Text>
      </View>

      <View style={s.sheet}>
        <ScrollView style={s.panel} contentContainerStyle={{ paddingVertical: 14 }} keyboardShouldPersistTaps="handled">
          {tab === 'style' && (
            <StylePanel selected={styleId} onSelect={(id) => update({ styleId: id, overrides: overrides.y !== undefined ? { y: overrides.y } : {} })} />
          )}
          {tab === 'text' && (
            <TextPanel
              phrases={phrases}
              currentId={current?.id ?? null}
              onChangeText={(id, text) => update({ phrases: phrases.map((p) => (p.id === id ? setPhraseText(p, text) : p)).filter((p) => p.words.length) })}
              onDelete={(id) => update({ phrases: phrases.filter((p) => p.id !== id) })}
              onAdd={addPhrase}
              onSeek={(t) => { player.currentTime = t; }}
            />
          )}
          {tab === 'font' && (
            <FontPanel
              style={style}
              onFont={(fontFamily) => override({ fontFamily })}
              onSize={(size) => override({ size })}
              onUppercase={(uppercase) => override({ uppercase })}
            />
          )}
          {tab === 'color' && (
            <ColorPanel
              style={style}
              onColor={(color) => override({ color })}
              onHighlightColor={(highlightColor) => override({ highlightColor })}
              onHighlightMode={(highlightMode) => override({ highlightMode })}
            />
          )}
          {tab === 'animation' && <AnimationPanel value={style.animation.type} onPick={(animation) => override({ animation })} />}
        </ScrollView>

        <View style={s.toolbar}>
          {TABS.map((t) => (
            <Pressable key={t.id} onPress={() => setTab(t.id)} style={s.tool}>
              <Ionicons name={t.icon} size={22} color={tab === t.id ? colors.text : colors.muted} />
              <Text style={[s.toolText, tab === t.id && { color: colors.text }]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  exportBtn: { backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  exportText: { color: colors.text, fontWeight: '800', fontSize: 15 },
  preview: { flex: 1, alignItems: 'center', justifyContent: 'center', marginHorizontal: 16 },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  transport: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 8 },
  time: { color: colors.text, fontVariant: ['tabular-nums'], fontWeight: '600' },
  hint: { color: colors.muted, fontSize: 12, marginLeft: 'auto' },
  sheet: { backgroundColor: '#111117', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderColor: colors.border },
  panel: { height: 250 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 6, paddingBottom: 4, borderTopWidth: 1, borderColor: colors.border },
  tool: { alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 4 },
  toolText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
});
