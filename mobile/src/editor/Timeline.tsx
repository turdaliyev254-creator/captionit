import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { VideoPlayer, VideoThumbnail } from 'expo-video';
import type { Phrase } from '../../../shared/captions';
import type { Overlay, Trim } from '../../../shared/overlays';
import { colors } from '../theme';

const PX_PER_SEC = 56;
const THUMB_W = 40;

type Props = {
  player: VideoPlayer;
  duration: number;
  trim: Trim;
  phrases: Phrase[];
  overlays: Overlay[];
  selectedOverlay: string | null;
  onSelectOverlay: (id: string) => void;
  onSelectPhrase: (id: string) => void;
};

// Captions-style timeline: the playhead stays in the middle and the tracks slide under it.
// It is NOT a ScrollView on purpose: scrolling a ScrollView every frame during playback makes
// React Native cancel touches everywhere else. The tracks are moved with a transform instead,
// and a horizontal drag scrubs the video.
export function Timeline({ player, duration, trim, phrases, overlays, selectedOverlay, onSelectOverlay, onSelectPhrase }: Props) {
  const [viewW, setViewW] = useState(0);
  const [thumbs, setThumbs] = useState<VideoThumbnail[]>([]);
  const offset = useRef(new Animated.Value(0)).current; // = -time * PX_PER_SEC
  const dragging = useRef(false);
  const contentW = Math.max(1, duration * PX_PER_SEC);

  // One thumbnail per THUMB_W pixels of track.
  useEffect(() => {
    if (!duration) return;
    const count = Math.min(60, Math.ceil(contentW / THUMB_W));
    const times = Array.from({ length: count }, (_, i) => (i * THUMB_W) / PX_PER_SEC);
    let cancelled = false;
    player.generateThumbnailsAsync(times, { maxHeight: 96 }).then((t) => !cancelled && setThumbs(t)).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [player, duration, contentW]);

  // Follow playback without re-rendering.
  useEffect(() => {
    let raf = 0;
    let last = -1;
    const tick = () => {
      const t = player.currentTime;
      if (!dragging.current && t !== last) {
        last = t;
        offset.setValue(-t * PX_PER_SEC);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [player, offset]);

  const live = useRef({ duration });
  live.current = { duration };
  const pan = useMemo(() => {
    let startT = 0;
    return PanResponder.create({
      // Let taps reach the blocks; claim the gesture only once it's clearly a horizontal drag.
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        dragging.current = true;
        startT = player.currentTime;
        player.pause();
      },
      onPanResponderMove: (_, g) => {
        const t = Math.min(live.current.duration, Math.max(0, startT - g.dx / PX_PER_SEC));
        offset.setValue(-t * PX_PER_SEC);
        player.currentTime = t;
      },
      onPanResponderRelease: () => (dragging.current = false),
      onPanResponderTerminate: () => (dragging.current = false),
    });
  }, [player, offset]);

  const side = viewW / 2;
  return (
    <View style={s.wrap} onLayout={(e: LayoutChangeEvent) => setViewW(e.nativeEvent.layout.width)} {...pan.panHandlers}>
      {viewW > 0 && (
        <Animated.View style={{ position: 'absolute', left: side, top: 4, width: contentW, transform: [{ translateX: offset }] }}>
          {/* Video strip */}
          <View style={s.strip}>
            {thumbs.map((th, i) => (
              <Image key={i} source={th} style={{ width: THUMB_W, height: '100%' }} contentFit="cover" />
            ))}
            <View style={[s.cut, { left: 0, width: trim.start * PX_PER_SEC }]} />
            <View style={[s.cut, { left: trim.end * PX_PER_SEC, right: 0 }]} />
            <View style={[s.trimFrame, { left: trim.start * PX_PER_SEC, width: (trim.end - trim.start) * PX_PER_SEC }]} />
          </View>

          {/* Captions track */}
          <View style={s.track}>
            {phrases.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => onSelectPhrase(p.id)}
                style={[s.block, s.captionBlock, { left: p.start * PX_PER_SEC, width: Math.max(8, (p.end - p.start) * PX_PER_SEC - 2) }]}
              >
                <Text numberOfLines={1} style={s.blockText}>{p.words.map((w) => w.word).join(' ')}</Text>
              </Pressable>
            ))}
          </View>

          {/* Overlays track */}
          <View style={s.track}>
            {overlays.map((o) => (
              <Pressable
                key={o.id}
                onPress={() => onSelectOverlay(o.id)}
                style={[
                  s.block, s.overlayBlock,
                  selectedOverlay === o.id && s.overlayBlockActive,
                  { left: o.start * PX_PER_SEC, width: Math.max(8, (o.end - o.start) * PX_PER_SEC - 2) },
                ]}
              >
                <Text numberOfLines={1} style={s.blockText}>
                  {o.type === 'image' ? '🖼 Rasm' : '🎬 Video'}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      )}
      <View pointerEvents="none" style={[s.playhead, { left: side - 1 }]} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { height: 108, overflow: 'hidden' },
  strip: { height: 48, flexDirection: 'row', borderRadius: 8, overflow: 'hidden', backgroundColor: colors.surface },
  cut: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)' },
  trimFrame: { position: 'absolute', top: 0, bottom: 0, borderWidth: 2, borderColor: '#FFD60A', borderRadius: 8 },
  track: { height: 22, marginTop: 5 },
  block: { position: 'absolute', top: 0, bottom: 0, borderRadius: 6, paddingHorizontal: 6, justifyContent: 'center' },
  captionBlock: { backgroundColor: '#3A2C7A' },
  overlayBlock: { backgroundColor: '#1F4E5F' },
  overlayBlockActive: { borderWidth: 1.5, borderColor: '#7FE3FF' },
  blockText: { color: colors.text, fontSize: 11, fontWeight: '600' },
  playhead: { position: 'absolute', top: 2, bottom: 2, width: 2, borderRadius: 1, backgroundColor: '#fff' },
});
