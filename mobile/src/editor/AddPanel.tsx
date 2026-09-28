import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import type { VideoPlayer } from 'expo-video';
import { Overlay, OVERLAY_ANIMATIONS } from '../../../shared/overlays';
import { Chip } from '../components';
import { colors } from '../theme';

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}.${Math.floor((t % 1) * 10)}`;

type Props = {
  player: VideoPlayer;
  selected: Overlay | null;
  onAddMedia: (kind: 'image' | 'video') => void;
  onChange: (id: string, patch: Partial<Overlay>) => void;
  onDelete: (id: string) => void;
  onDeselect: () => void;
};

export function AddPanel({ player, selected, onAddMedia, onChange, onDelete, onDeselect }: Props) {
  if (selected) {
    const o = selected;
    return (
      <View style={{ gap: 14, paddingHorizontal: 16 }}>
        <View style={s.headRow}>
          <Text style={s.title}>{o.type === 'image' ? 'Rasm' : 'Video'}{o.src ? '' : ' · yuklanmoqda…'}</Text>
          <Pressable onPress={onDeselect} hitSlop={8}>
            <Text style={s.link}>Tayyor</Text>
          </Pressable>
        </View>
        <Text style={s.hint}>Videoda barmoq bilan suring, ikki barmoq bilan kattalashtiring.</Text>

        <View style={s.line}>
          <Text style={s.label}>O'lcham</Text>
          <Slider
            style={{ flex: 1 }}
            minimumValue={0.08}
            maximumValue={1.2}
            value={o.width}
            onValueChange={(width) => onChange(o.id, { width })}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor={colors.border}
            thumbTintColor="#fff"
          />
        </View>

        <View style={s.row}>
          <Pressable style={s.timeBtn} onPress={() => onChange(o.id, { start: Math.min(player.currentTime, o.end - 0.2) })}>
            <Text style={s.timeLabel}>Boshlanishi</Text>
            <Text style={s.timeValue}>{fmt(o.start)}</Text>
            <Text style={s.hint}>hozirgi joyga</Text>
          </Pressable>
          <Pressable style={s.timeBtn} onPress={() => onChange(o.id, { end: Math.max(player.currentTime, o.start + 0.2) })}>
            <Text style={s.timeLabel}>Tugashi</Text>
            <Text style={s.timeValue}>{fmt(o.end)}</Text>
            <Text style={s.hint}>hozirgi joyga</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
          {OVERLAY_ANIMATIONS.map((a) => (
            <Chip key={a.id} label={a.label} active={o.animation === a.id} onPress={() => onChange(o.id, { animation: a.id })} />
          ))}
        </ScrollView>

        <Pressable style={s.delete} onPress={() => onDelete(o.id)}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
          <Text style={{ color: colors.danger, fontWeight: '700' }}>O'chirish</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ gap: 14, paddingHorizontal: 16 }}>
      <View style={s.row}>
        <AddButton icon="image-outline" label="Rasm" onPress={() => onAddMedia('image')} />
        <AddButton icon="film-outline" label="Video" onPress={() => onAddMedia('video')} />
      </View>
      <Text style={s.hint}>Qo'shilgan element videoning hozirgi joyidan boshlanadi. Uni timeline'da yoki videoda bosib tanlang.</Text>
    </View>
  );
}

function AddButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable style={s.add} onPress={onPress}>
      <Ionicons name={icon} size={24} color={colors.text} />
      <Text style={s.addText}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  add: { flex: 1, backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 16, alignItems: 'center', gap: 6 },
  addText: { color: colors.text, fontWeight: '700' },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontWeight: '800', fontSize: 16 },
  link: { color: colors.accent, fontWeight: '700' },
  hint: { color: colors.muted, fontSize: 12 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { color: colors.text, fontWeight: '700' },
  timeBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 12, alignItems: 'center', gap: 2 },
  timeLabel: { color: colors.text, fontWeight: '700' },
  timeValue: { color: '#7FE3FF', fontVariant: ['tabular-nums'], fontWeight: '600' },
  delete: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 6 },
});
