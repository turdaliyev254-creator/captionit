import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, Chip } from '../components';
import { colors } from '../theme';

export type PickedVideo = { uri: string; mimeType?: string };

const LANGUAGES = [
  { id: 'auto', label: 'Avto' },
  { id: 'uz', label: "O'zbek" },
  { id: 'ru', label: 'Русский' },
  { id: 'en', label: 'English' },
];

export function HomeScreen({ onPicked }: { onPicked: (video: PickedVideo, language: string) => void }) {
  const [language, setLanguage] = useState('auto');

  async function pick(fromCamera: boolean) {
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['videos'], quality: 1, videoMaxDuration: 180 };
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
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>Caption</Text>
        <Text style={styles.subtitle}>Videongizga bir necha soniyada avtomatik subtitr qo'shing</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Video tili</Text>
        <View style={styles.row}>
          {LANGUAGES.map((l) => (
            <Chip key={l.id} label={l.label} active={language === l.id} onPress={() => setLanguage(l.id)} />
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Button title="Galereyadan tanlash" onPress={() => pick(false)} />
        <Button title="Kamerada yozish" variant="secondary" onPress={() => pick(true)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  hero: { marginTop: 60, gap: 12 },
  logo: { color: colors.text, fontSize: 44, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: colors.muted, fontSize: 17, lineHeight: 24 },
  section: { gap: 12 },
  label: { color: colors.text, fontWeight: '700', fontSize: 15 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { gap: 12, marginBottom: 12 },
});
