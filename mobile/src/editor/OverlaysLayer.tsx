import { useEffect, useMemo, useRef } from 'react';
import { GestureResponderEvent, PanResponder, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoPlayer, VideoView } from 'expo-video';
import { Overlay, overlayFrame, overlaySize } from '../../../shared/overlays';
import { usePlayerTime } from '../captions/usePlayerTime';
import { colors } from '../theme';

type Props = {
  player: VideoPlayer;
  playing: boolean;
  overlays: Overlay[];
  selectedId: string | null;
  width: number;
  height: number;
  onSelect: (id: string) => void;
  onChange: (id: string, patch: Partial<Overlay>) => void;
};

// Preview twin of backend/renderer/OverlayLayer.tsx. Drag to move, pinch to resize.
export function OverlaysLayer({ player, playing, overlays, ...rest }: Props) {
  const t = usePlayerTime(player);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {overlays.map((o) => (
        <OverlayItem key={o.id} o={o} t={t} playing={playing} {...rest} />
      ))}
    </View>
  );
}

const touchDistance = (e: GestureResponderEvent) => {
  const [a, b] = e.nativeEvent.touches;
  return a && b ? Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY) : 0;
};

function OverlayItem({ o, t, playing, selectedId, width, height, onSelect, onChange }: Omit<Props, 'player' | 'overlays'> & { o: Overlay; t: number }) {
  const a = overlayFrame(o, t);
  const selected = selectedId === o.id;
  const live = useRef({ o, width, height, onSelect, onChange });
  live.current = { o, width, height, onSelect, onChange };

  const pan = useMemo(() => {
    let start = { x: 0, y: 0, width: 0, dist: 0 };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { o } = live.current;
        start = { x: o.x, y: o.y, width: o.width, dist: touchDistance(e) };
        live.current.onSelect(o.id);
      },
      onPanResponderMove: (e, g) => {
        const { o, width, height, onChange } = live.current;
        const dist = touchDistance(e);
        if (dist && start.dist) {
          onChange(o.id, { width: Math.min(1.5, Math.max(0.08, start.width * (dist / start.dist))) });
        } else if (dist && !start.dist) {
          start = { ...start, dist, width: o.width }; // second finger just landed
        } else {
          onChange(o.id, {
            x: Math.min(1, Math.max(0, start.x + g.dx / width)),
            y: Math.min(1, Math.max(0, start.y + g.dy / height)),
          });
        }
      },
      onPanResponderTerminationRequest: () => false,
    });
  }, []);

  if (!a) return null;
  const { w, h } = overlaySize(o, width);

  return (
    <View
      {...pan.panHandlers}
      style={{
        position: 'absolute',
        left: o.x * width - w / 2,
        top: (o.y + a.dy) * height - h / 2,
        width: w,
        height: h,
        opacity: a.opacity,
        transform: [{ scale: a.scale }, { rotate: `${o.rotation}deg` }],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {o.type === 'image' && o.uri && <Image source={{ uri: o.uri }} style={StyleSheet.absoluteFill} contentFit="contain" />}
      {o.type === 'video' && o.uri && <OverlayVideo uri={o.uri} local={t - o.start} playing={playing} />}
      {selected && <View pointerEvents="none" style={s.selection} />}
    </View>
  );
}

// A muted clip kept in sync with the main video's clock.
function OverlayVideo({ uri, local, playing }: { uri: string; local: number; playing: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
  });
  useEffect(() => {
    if (Math.abs(player.currentTime - local) > 0.25) player.currentTime = Math.max(0, local);
    if (playing && !player.playing) player.play();
    if (!playing && player.playing) player.pause();
  }, [player, local, playing]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />;
}

const s = StyleSheet.create({
  selection: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderWidth: 2, borderColor: colors.accent, borderRadius: 6 },
});
