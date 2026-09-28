import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { BRAND_GRADIENT, GlassButton, GradientButton, GradientText } from '../ui/Gradient';

type Props = {
  videoUrl: string;
  onEditAgain?: () => void;
  onNew: () => void;
  onProfile?: () => void;
  saved?: boolean; // opened from the profile: no "done" header, no re-edit
};

export function ResultScreen({ videoUrl, onEditAgain, onNew, onProfile, saved: fromProfile }: Props) {
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);
  const [saved, setSaved] = useState(false);
  const local = useRef<string | null>(null);
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.play();
  });

  // Download once, reuse for both saving and sharing.
  async function localFile() {
    if (local.current) return local.current;
    const target = new File(new Directory(Paths.cache), `captionit-${Date.now()}.mp4`);
    const file = await File.downloadFileAsync(videoUrl, target);
    local.current = file.uri;
    return file.uri;
  }

  async function save() {
    setBusy('save');
    try {
      const perm = await MediaLibrary.requestPermissionsAsync(true);
      if (!perm.granted) {
        Alert.alert('Ruxsat kerak', 'Galereyaga saqlash uchun ruxsat bering.');
        return;
      }
      await MediaLibrary.Asset.create(await localFile());
      setSaved(true);
    } catch (e: any) {
      Alert.alert("Saqlab bo'lmadi", e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  }

  async function share() {
    setBusy('share');
    try {
      await Sharing.shareAsync(await localFile(), { mimeType: 'video/mp4', UTI: 'public.mpeg-4' });
    } catch (e: any) {
      Alert.alert("Ulashib bo'lmadi", e?.message ?? String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={s.container}>
      {!fromProfile && <View style={s.header}>
        <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.check}>
          <Ionicons name="checkmark" size={22} color="#fff" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <GradientText style={s.title}>Tayyor!</GradientText>
          <Text style={s.subtitle}>Videongiz profilingizda ham saqlandi</Text>
        </View>
        {onProfile && (
          <Pressable onPress={onProfile} hitSlop={8} style={s.roundBtn}>
            <Ionicons name="person" size={18} color={colors.text} />
          </Pressable>
        )}
      </View>}

      <View style={s.frameGlow}>
        <VideoView player={player} style={s.video} contentFit="contain" nativeControls />
      </View>

      <View style={s.actions}>
        <GradientButton
          title={saved ? 'Galereyaga saqlandi' : busy === 'save' ? 'Saqlanmoqda…' : 'Galereyaga saqlash'}
          icon={<Ionicons name={saved ? 'checkmark-circle' : 'download'} size={20} color="#fff" />}
          onPress={() => !busy && !saved && save()}
        />
        <View style={s.row}>
          <GlassButton
            style={{ flex: 1 }}
            title={busy === 'share' ? '…' : 'Ulashish'}
            icon={<Ionicons name="share-outline" size={19} color="#fff" />}
            onPress={() => !busy && share()}
          />
          {onEditAgain && (
            <GlassButton style={{ flex: 1 }} title="Tahrirlash" icon={<Ionicons name="color-wand-outline" size={19} color="#fff" />} onPress={onEditAgain} />
          )}
        </View>
        <Pressable onPress={onNew} style={s.newBtn} hitSlop={8}>
          <Ionicons name="add-circle-outline" size={18} color={colors.muted} />
          <Text style={s.newText}>Yangi video</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 18, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 30, lineHeight: 34 },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
  roundBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  frameGlow: {
    flex: 1, borderRadius: 22, shadowColor: '#8B5CFF', shadowOpacity: 0.45, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
  },
  video: { flex: 1, backgroundColor: '#000', borderRadius: 22, overflow: 'hidden' },
  actions: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  newBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6 },
  newText: { color: colors.muted, fontWeight: '700', fontSize: 15 },
});
