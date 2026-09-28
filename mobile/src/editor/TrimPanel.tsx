import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { VideoPlayer } from 'expo-video';
import type { Trim } from '../../../shared/overlays';
import { colors } from '../theme';

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}.${Math.floor((t % 1) * 10)}`;
const MIN_LENGTH = 0.5;

type Props = { player: VideoPlayer; duration: number; trim: Trim; onChange: (t: Trim) => void };

// Timeline'ni kerakli joyga surib, boshini yoki oxirini o'sha joydan kesasiz.
export function TrimPanel({ player, duration, trim, onChange }: Props) {
  const setStart = () => {
    const t = player.currentTime;
    onChange({ ...trim, start: Math.min(t, trim.end - MIN_LENGTH) });
  };
  const setEnd = () => {
    const t = player.currentTime;
    onChange({ ...trim, end: Math.max(t, trim.start + MIN_LENGTH) });
  };

  return (
    <View style={{ gap: 14, paddingHorizontal: 16 }}>
      <Text style={s.hint}>Timeline'ni kerakli joyga suring va boshini yoki oxirini o'sha joydan kesing.</Text>
      <View style={s.row}>
        <Pressable style={s.btn} onPress={setStart}>
          <Ionicons name="play-skip-back-outline" size={20} color={colors.text} />
          <Text style={s.btnText}>Boshini kesish</Text>
          <Text style={s.value}>{fmt(trim.start)}</Text>
        </Pressable>
        <Pressable style={s.btn} onPress={setEnd}>
          <Ionicons name="play-skip-forward-outline" size={20} color={colors.text} />
          <Text style={s.btnText}>Oxirini kesish</Text>
          <Text style={s.value}>{fmt(trim.end)}</Text>
        </Pressable>
      </View>
      <View style={s.footer}>
        <Text style={s.hint}>Uzunligi: <Text style={{ color: colors.text }}>{fmt(trim.end - trim.start)}</Text> / {fmt(duration)}</Text>
        <Pressable onPress={() => onChange({ start: 0, end: duration })} hitSlop={8}>
          <Text style={s.reset}>Qayta tiklash</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  hint: { color: colors.muted, fontSize: 13 },
  row: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 14, gap: 6, alignItems: 'center' },
  btnText: { color: colors.text, fontWeight: '700' },
  value: { color: '#FFD60A', fontVariant: ['tabular-nums'], fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reset: { color: colors.accent, fontWeight: '700' },
});
