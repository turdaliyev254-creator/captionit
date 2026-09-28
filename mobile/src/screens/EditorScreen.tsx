import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, LayoutChangeEvent, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoPlayer, VideoView } from 'expo-video';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import {
  CaptionStyle, newId, Phrase, resolveStyle, setPhraseText, StyleOverrides,
} from '../../../shared/captions';
import type { Overlay, Trim } from '../../../shared/overlays';
import { getStyle } from '../../../shared/styles';
import { Job, uploadAsset } from '../api';
import { CaptionOverlay } from '../captions/CaptionOverlay';
import { usePlayerTime } from '../captions/usePlayerTime';
import { AddPanel } from '../editor/AddPanel';
import { AnimationPanel } from '../editor/AnimationPanel';
import { ColorPanel } from '../editor/ColorPanel';
import { FontPanel } from '../editor/FontPanel';
import { OverlaysLayer } from '../editor/OverlaysLayer';
import { StylePanel } from '../editor/StylePanel';
import { TextPanel } from '../editor/TextPanel';
import { Timeline } from '../editor/Timeline';
import { TrimPanel } from '../editor/TrimPanel';
import { colors } from '../theme';

export type EditorSession = {
  phrases: Phrase[];
  styleId: string;
  overrides: StyleOverrides;
  trim: Trim;
  overlays: Overlay[];
};

type Tab = 'style' | 'text' | 'font' | 'color' | 'animation' | 'trim' | 'add';
const TABS: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'style', label: 'Stil', icon: 'color-palette-outline' },
  { id: 'text', label: 'Matn', icon: 'text-outline' },
  { id: 'add', label: "Qo'shish", icon: 'add-circle-outline' },
  { id: 'trim', label: 'Qirqish', icon: 'cut-outline' },
  { id: 'font', label: 'Shrift', icon: 'text' },
  { id: 'color', label: 'Rang', icon: 'color-fill-outline' },
  { id: 'animation', label: 'Animatsiya', icon: 'sparkles-outline' },
];

type Props = {
  job: Job;
  videoUri: string;
  session: EditorSession;
  setSession: Dispatch<SetStateAction<EditorSession | null>>;
  onExport: () => void;
  onBack: () => void;
};

const fmt = (t: number) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export function EditorScreen({ job, videoUri, session, setSession, onExport, onBack }: Props) {
  const [tab, setTab] = useState<Tab>('style');
  const [selectedOverlay, setSelectedOverlay] = useState<string | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const { phrases, styleId, overrides, trim, overlays } = session;
  const style = useMemo(() => resolveStyle(getStyle(styleId), overrides), [styleId, overrides]);

  const player = useVideoPlayer(videoUri, (p) => {
    p.loop = true;
    p.currentTime = session.trim.start;
    p.play();
  });
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  const duration = job.duration ?? player.duration ?? 0;

  // Functional updates, so async callbacks (uploads, gestures) never overwrite newer edits.
  const update = (patch: Partial<EditorSession> | ((s: EditorSession) => Partial<EditorSession>)) =>
    setSession((s) => (s ? { ...s, ...(typeof patch === 'function' ? patch(s) : patch) } : s));
  const override = (patch: StyleOverrides) => update((s) => ({ overrides: { ...s.overrides, ...patch } }));
  const updateOverlay = (id: string, patch: Partial<Overlay>) =>
    update((s) => ({ overlays: s.overlays.map((o) => (o.id === id ? { ...o, ...patch } : o)) }));

  // Playback stays inside the trimmed range.
  const trimRef = useRef(trim);
  trimRef.current = trim;
  useEffect(() => {
    const id = setInterval(() => {
      // Only while playing: when paused the user may scrub outside to move the trim points.
      if (!player.playing) return;
      const t = player.currentTime;
      const { start, end } = trimRef.current;
      if (t >= end - 0.03 || t < start - 0.05) player.currentTime = start;
    }, 50);
    return () => clearInterval(id);
  }, [player]);

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
        onPanResponderGrant: () => {
          drag.current.startY = live.current.style.y;
          setSelectedOverlay(null);
        },
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

  function addPhrase() {
    const t = player.currentTime;
    const next = phrases.find((p) => p.start > t);
    const end = Math.max(Math.min(t + 1.5, next ? next.start : t + 1.5, trim.end), t + 0.3);
    const phrase: Phrase = { id: newId(), start: t, end, words: [{ word: 'Matn', start: t, end }] };
    update((s) => ({ phrases: [...s.phrases, phrase].sort((a, b) => a.start - b.start) }));
    player.pause();
  }

  function selectOverlay(id: string) {
    setSelectedOverlay(id);
    setTab('add');
  }

  function addOverlay(o: Omit<Overlay, 'id' | 'start' | 'end' | 'x' | 'y' | 'rotation' | 'animation'> & { length: number }) {
    const { length, ...rest } = o;
    // Near the end of the video, start earlier so the element still gets its full length.
    const start = Math.max(trim.start, Math.min(player.currentTime, trim.end - length));
    const overlay: Overlay = {
      ...rest, id: newId(), start, end: Math.min(start + length, trim.end), x: 0.5, y: 0.35, rotation: 0, animation: 'pop',
    };
    update((s) => ({ overlays: [...s.overlays, overlay] }));
    setSelectedOverlay(overlay.id);
    return overlay.id;
  }

  async function addMedia(kind: 'image' | 'video') {
    player.pause();
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [kind === 'image' ? 'images' : 'videos'],
      quality: 0.9,
      videoExportPreset: ImagePicker.VideoExportPreset.H264_1280x720,
      // iOS photos are HEIC; "Compatible" hands us a JPEG the export renderer (Chrome) can draw.
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    const a = res.assets?.[0];
    if (res.canceled || !a) return;
    const id = addOverlay({
      type: kind,
      uri: a.uri,
      aspect: a.width && a.height ? a.width / a.height : 1,
      width: 0.55,
      length: kind === 'video' && a.duration ? a.duration / 1000 : 3,
    });
    try {
      const src = await uploadAsset(job.id, a.uri, a.mimeType);
      updateOverlay(id, { src });
    } catch (e: any) {
      Alert.alert("Media yuklanmadi", e?.message ?? String(e));
      update((s) => ({ overlays: s.overlays.filter((o) => o.id !== id) }));
    }
  }

  const selected = overlays.find((o) => o.id === selectedOverlay) ?? null;

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
            <OverlaysLayer
              player={player}
              playing={isPlaying}
              overlays={overlays}
              selectedId={selectedOverlay}
              width={frame.w}
              height={frame.h}
              onSelect={selectOverlay}
              onChange={updateOverlay}
            />
            <LiveCaptions player={player} phrases={phrases} style={style} width={frame.w} height={frame.h} />
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
        <TimeLabel player={player} duration={trim.end - trim.start} offset={trim.start} />
      </View>

      <Timeline
        player={player}
        duration={duration}
        trim={trim}
        phrases={phrases}
        overlays={overlays}
        selectedOverlay={selectedOverlay}
        onSelectOverlay={selectOverlay}
        onSelectPhrase={(id) => {
          const p = phrases.find((x) => x.id === id);
          if (p) player.currentTime = p.start + 0.01;
          setTab('text');
        }}
      />

      <View style={s.sheet}>
        {(
          <ScrollView style={s.panel} contentContainerStyle={{ paddingVertical: 14 }} keyboardShouldPersistTaps="handled">
            {tab === 'style' && (
              <StylePanel selected={styleId} onSelect={(id) => update((s) => ({ styleId: id, overrides: s.overrides.y !== undefined ? { y: s.overrides.y } : {} }))} />
            )}
            {tab === 'text' && (
              <TextPanel
                phrases={phrases}
                player={player}
                onChangeText={(id, text) => update((s) => ({ phrases: s.phrases.map((p) => (p.id === id ? setPhraseText(p, text) : p)).filter((p) => p.words.length) }))}
                onDelete={(id) => update((s) => ({ phrases: s.phrases.filter((p) => p.id !== id) }))}
                onAdd={addPhrase}
                onSeek={(t) => { player.currentTime = t; }}
              />
            )}
            {tab === 'add' && (
              <AddPanel
                player={player}
                selected={selected}
                onAddMedia={addMedia}
                onChange={updateOverlay}
                onDelete={(id) => {
                  update((s) => ({ overlays: s.overlays.filter((o) => o.id !== id) }));
                  setSelectedOverlay(null);
                }}
                onDeselect={() => setSelectedOverlay(null)}
              />
            )}
            {tab === 'trim' && <TrimPanel player={player} duration={duration} trim={trim} onChange={(t) => update({ trim: t })} />}
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
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.toolbarScroll} contentContainerStyle={s.toolbar}>
          {TABS.map((t) => (
            <Pressable key={t.id} onPress={() => setTab(t.id)} style={s.tool}>
              <Ionicons name={t.icon} size={22} color={tab === t.id ? colors.text : colors.muted} />
              <Text style={[s.toolText, tab === t.id && { color: colors.text }]}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// Only these re-render with playback time; the rest of the editor stays still.
function LiveCaptions({ player, ...rest }: { player: VideoPlayer; phrases: Phrase[]; style: CaptionStyle; width: number; height: number }) {
  const time = usePlayerTime(player);
  return <CaptionOverlay {...rest} time={time} />;
}

function TimeLabel({ player, duration, offset }: { player: VideoPlayer; duration: number; offset: number }) {
  const time = Math.max(0, usePlayerTime(player, 250) - offset);
  return (
    <Text style={s.time}>
      {fmt(time)} <Text style={{ color: colors.muted }}>/ {fmt(duration)}</Text>
    </Text>
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
  transport: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 6 },
  time: { color: colors.text, fontVariant: ['tabular-nums'], fontWeight: '600' },
  sheet: { backgroundColor: '#111117', borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderColor: colors.border },
  panel: { height: 220 },
  toolbarScroll: { borderTopWidth: 1, borderColor: colors.border, flexGrow: 0 },
  toolbar: { paddingHorizontal: 8, paddingTop: 6, paddingBottom: 4, gap: 4 },
  tool: { alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 4, minWidth: 62 },
  toolText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
});
