import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Button } from '../components';
import { colors } from '../theme';

type Props = { videoUrl: string; onEditAgain: () => void; onNew: () => void };

export function ResultScreen({ videoUrl, onEditAgain, onNew }: Props) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
    p.play();
  });

  async function save() {
    setSaving(true);
    try {
      const perm = await MediaLibrary.requestPermissionsAsync(true);
      if (!perm.granted) {
        Alert.alert('Ruxsat kerak', 'Galereyaga saqlash uchun ruxsat bering.');
        return;
      }
      const target = new File(new Directory(Paths.cache), `caption-${Date.now()}.mp4`);
      const file = await File.downloadFileAsync(videoUrl, target);
      await MediaLibrary.Asset.create(file.uri);
      setSaved(true);
    } catch (e: any) {
      Alert.alert("Saqlab bo'lmadi", e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Tayyor!</Text>
      <VideoView player={player} style={s.video} contentFit="contain" nativeControls />
      <View style={s.actions}>
        <Button title={saved ? 'Saqlandi ✓' : saving ? 'Saqlanmoqda…' : 'Galereyaga saqlash'} onPress={save} disabled={saving || saved} />
        <Button title="Stilni o'zgartirish" variant="secondary" onPress={onEditAgain} />
        <Button title="Yangi video" variant="secondary" onPress={onNew} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  video: { flex: 1, backgroundColor: '#000', borderRadius: 16 },
  actions: { gap: 10 },
});
