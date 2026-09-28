import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

// Soft, slowly drifting colour blobs (a "mesh gradient") behind the screen content.
const BLOBS = [
  { color: '#7C5CFF', size: 1.25, x: -0.35, y: -0.18, dx: 0.12, dy: 0.08, duration: 9000 },
  { color: '#FF3D9A', size: 1.05, x: 0.35, y: 0.05, dx: -0.1, dy: 0.1, duration: 11000 },
  { color: '#FF8A3D', size: 0.9, x: -0.15, y: 0.55, dx: 0.14, dy: -0.06, duration: 13000 },
  { color: '#00D4FF', size: 0.85, x: 0.45, y: 0.72, dx: -0.12, dy: -0.1, duration: 10000 },
];

export function GradientBackground({ intensity = 1 }: { intensity?: number }) {
  const { width, height } = useWindowDimensions();
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg, overflow: 'hidden' }]} pointerEvents="none">
      {BLOBS.map((b, i) => (
        <Blob key={i} blob={b} index={i} width={width} height={height} intensity={intensity} />
      ))}
      {/* Darken the bottom so text and buttons stay readable. */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(8,8,14,0.25)' }]} />
    </View>
  );
}

function Blob({ blob, index, width, height, intensity }: { blob: (typeof BLOBS)[number]; index: number; width: number; height: number; intensity: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: blob.duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: blob.duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, blob.duration]);

  const size = blob.size * width;
  const id = `blob${index}`;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        left: blob.x * width,
        top: blob.y * height,
        opacity: 0.85 * intensity,
        transform: [
          { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, blob.dx * width] }) },
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, blob.dy * height] }) },
          { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.15] }) },
        ],
      }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={blob.color} stopOpacity={0.9} />
            <Stop offset="45%" stopColor={blob.color} stopOpacity={0.35} />
            <Stop offset="100%" stopColor={blob.color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}
