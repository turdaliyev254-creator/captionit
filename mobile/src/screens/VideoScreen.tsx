import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteVideo, mediaUrl, VideoItem } from '../api';
import { colors } from '../theme';
import { ResultScreen } from './ResultScreen';

type Props = { video: VideoItem; onBack: () => void; onDeleted: () => void; onNew: () => void };

// A saved video from the profile: same player/save/share as the result screen, plus delete.
export function VideoScreen({ video, onBack, onDeleted, onNew }: Props) {
  function confirmDelete() {
    Alert.alert('Videoni o‘chirish', 'Video serverdan butunlay o‘chiriladi.', [
      { text: 'Bekor qilish', style: 'cancel' },
      {
        text: 'O‘chirish',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteVideo(video.id);
            onDeleted();
          } catch (e: any) {
            Alert.alert('Xatolik', e?.message ?? String(e));
          }
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={s.topBar}>
        <Pressable onPress={onBack} hitSlop={12} style={s.roundBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={s.title} numberOfLines={1}>{video.title}</Text>
        <Pressable onPress={confirmDelete} hitSlop={12} style={s.roundBtn}>
          <Ionicons name="trash-outline" size={19} color={colors.danger} />
        </Pressable>
      </View>
      <ResultScreen videoUrl={mediaUrl(video.videoUrl)} onNew={onNew} saved />
    </View>
  );
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 6 },
  title: { flex: 1, color: colors.text, fontFamily: 'Outfit_700Bold', fontSize: 16, textAlign: 'center' },
  roundBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
});
