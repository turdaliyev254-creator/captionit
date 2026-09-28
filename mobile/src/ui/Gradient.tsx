import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export const BRAND_GRADIENT = ['#8B5CFF', '#FF3D9A', '#FF8A3D'] as const;

export function GradientText({ children, style, colors = BRAND_GRADIENT }: { children: ReactNode; style?: StyleProp<TextStyle>; colors?: readonly [string, string, ...string[]] }) {
  return (
    <MaskedView maskElement={<Text style={[style, { backgroundColor: 'transparent' }]}>{children}</Text>}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        {/* Invisible copy gives the gradient the text's exact size. */}
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

export function GradientButton({ title, icon, onPress, style }: { title: string; icon?: ReactNode; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.shadow, style, pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 }]}>
      <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={s.gradientBtn}>
        {/* Glossy highlight on the top half. */}
        <LinearGradient colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']} style={s.gloss} />
        {icon}
        <Text style={s.btnText}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function GlassButton({ title, icon, onPress, style }: { title: string; icon?: ReactNode; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [style, pressed && { opacity: 0.8 }]}>
      <GlassCard style={s.glassBtn}>
        {icon}
        <Text style={s.btnText}>{title}</Text>
      </GlassCard>
    </Pressable>
  );
}

export function GlassCard({ children, style, radius = 22 }: { children?: ReactNode; style?: StyleProp<ViewStyle>; radius?: number }) {
  return (
    <View style={[{ borderRadius: radius, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }, style]}>
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.03)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  shadow: {
    borderRadius: 20,
    shadowColor: '#FF3D9A',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  gradientBtn: {
    height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, overflow: 'hidden',
  },
  gloss: { position: 'absolute', top: 0, left: 0, right: 0, height: '50%' },
  glassBtn: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
});
