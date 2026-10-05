import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { PANEL_WIDTH, panelLeft } from '../../../shared/transitions';

// Live stand-in for the export's glass sweep (backend/renderer/GlassLayer.tsx): a frosted panel
// with a bright rim and light streaks. The ribbed refraction itself is only in the export.
export function GlassPreview({ times, time, width, height }: { times: number[]; time: number; width: number; height: number }) {
  const left = panelLeft(times, time);
  if (left === null || width <= 0) return null;
  const band = width * PANEL_WIDTH;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      <View style={[s.panel, { left: left * width, width: band, height }]}>
        <BlurView intensity={8} tint="light" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.22)', 'transparent', 'transparent', 'rgba(255,255,255,0.12)', 'transparent']}
          locations={[0.22, 0.27, 0.32, 0.38, 0.4, 0.42]}
          start={{ x: 0, y: 0.35 }}
          end={{ x: 1, y: 0.65 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  panel: {
    position: 'absolute', top: 0, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)',
  },
});
