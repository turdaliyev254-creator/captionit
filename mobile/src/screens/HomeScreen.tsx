import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Phrase } from '../../../shared/captions';
import type { User } from '../api';
import { getStyle } from '../../../shared/styles';
import { CaptionOverlay } from '../captions/CaptionOverlay';
import { useLoopClock } from '../captions/usePlayerTime';
import { BRAND_GRADIENT, GlassButton, GlassCard, GradientButton, GradientText } from '../ui/Gradient';

export type PickedVideo = { uri: string; mimeType?: string };

// Auto-detect tends to mistake Uzbek for Azerbaijani/Turkish, so Uzbek is the explicit default.
const LANGUAGES = [
  { id: 'uz', label: "O'zbek" },
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
  { id: 'auto', label: 'Avto' },
];

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'mic-outline', label: "O'zbek tili" },
  { icon: 'color-palette-outline', label: '18 stil' },
  { icon: 'sparkles-outline', label: 'Glass effekt' },
];

// Looping demo caption shown in the hero card.
const DEMO: Phrase[] = [
  {
    id: 'demo',
    start: 0.2,
    end: 2.6,
    words: ['Salom', 'do‘stlar,', 'bugun', 'boshlaymiz!'].map((word, i) => ({ word, start: 0.3 + i * 0.5, end: 0.75 + i * 0.5 })),
  },
];
const DEMO_STYLE = { ...getStyle('glass-pop'), y: 0.56, maxWidth: 0.8 };
const CARD_H = 190;

type Props = { user: User; onPicked: (video: PickedVideo, language: string) => void; onProfile: () => void };

export function HomeScreen({ user, onPicked, onProfile }: Props) {
  const [language, setLanguage] = useState('uz');
  const [cardW, setCardW] = useState(0);
  const time = useLoopClock(3.4);

  async function pick(fromCamera: boolean) {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['videos'],
      quality: 1,
      videoMaxDuration: 180,
      // iOS: re-encode 4K/HEVC to 1080p H.264 so uploads stay small; captions don't need more.
      videoExportPreset: ImagePicker.VideoExportPreset.H264_1920x1080,
    };
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return Alert.alert('Ruxsat kerak', 'Kameraga ruxsat bering.');
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    onPicked({ uri: asset.uri, mimeType: asset.mimeType }, language);
  }

  return (
    <View style={s.container}>
      <View style={s.brandRow}>
        <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.logo}>
          <Ionicons name="text" size={18} color="#fff" />
        </LinearGradient>
        <Text style={s.brand}>Captionit</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={onProfile} hitSlop={8} style={s.avatarBtn}>
          <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
            <Text style={s.avatarText}>{(user.name || 'U').slice(0, 1).toUpperCase()}</Text>
          </LinearGradient>
        </Pressable>
      </View>

      <View style={s.hero}>
        <Text style={s.title}>Videongizga</Text>
        <GradientText style={s.title}>jonli subtitr</GradientText>
        <Text style={s.subtitle}>Nutqni avtomatik matnga aylantiring, zamonaviy stil tanlang va bir necha soniyada ulashing.</Text>
      </View>

      <GlassCard style={{ height: CARD_H }} radius={26}>
        <View style={StyleSheet.absoluteFill} onLayout={(e) => setCardW(e.nativeEvent.layout.width)}>
          {/* A stylised "video frame" for the demo caption to sit on. */}
          <LinearGradient colors={['#2A1B5E', '#5B1E4F', '#7A3A1C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { opacity: 0.55 }]} />
          <View style={s.demoBadge}>
            <View style={s.recDot} />
            <Text style={s.demoBadgeText}>Jonli namuna</Text>
          </View>
          {cardW > 0 && (
            <CaptionOverlay phrases={DEMO} style={DEMO_STYLE} time={time} width={cardW} height={CARD_H} scale={cardW / 1250} />
          )}
        </View>
      </GlassCard>

      <View style={s.features}>
        {FEATURES.map((f) => (
          <View key={f.label} style={s.feature}>
            <Ionicons name={f.icon} size={15} color="#FFB36B" />
            <Text style={s.featureText}>{f.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <Text style={s.label}>Video tili</Text>
      <GlassCard style={s.segment} radius={16}>
        {LANGUAGES.map((l) => {
          const active = language === l.id;
          return (
            <Pressable key={l.id} onPress={() => setLanguage(l.id)} style={s.segmentItem}>
              {active && (
                <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[StyleSheet.absoluteFill, { borderRadius: 12 }]} />
              )}
              <Text style={[s.segmentText, active && s.segmentTextActive]}>{l.label}</Text>
            </Pressable>
          );
        })}
      </GlassCard>

      <View style={s.actions}>
        <GradientButton title="Video tanlash" icon={<Ionicons name="images" size={20} color="#fff" />} onPress={() => pick(false)} />
        <GlassButton title="Kamerada yozish" icon={<Ionicons name="videocam" size={20} color="#fff" />} onPress={() => pick(true)} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  brand: { color: '#fff', fontFamily: 'Outfit_800ExtraBold', fontSize: 20, letterSpacing: 0.3 },
  avatarBtn: { borderRadius: 20, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontFamily: 'Outfit_800ExtraBold', fontSize: 16 },
  hero: { marginTop: 26, marginBottom: 22 },
  title: { color: '#fff', fontFamily: 'Outfit_800ExtraBold', fontSize: 44, lineHeight: 50, letterSpacing: -0.5 },
  subtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 16, lineHeight: 23, marginTop: 12 },
  demoBadge: {
    position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  recDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF3D6E' },
  demoBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  features: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  feature: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  featureText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  label: { color: 'rgba(255,255,255,0.8)', fontWeight: '700', fontSize: 14, marginBottom: 10 },
  segment: { flexDirection: 'row', padding: 4, marginBottom: 16 },
  segmentItem: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, overflow: 'hidden' },
  segmentText: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 14 },
  segmentTextActive: { color: '#fff' },
  actions: { gap: 12 },
});
