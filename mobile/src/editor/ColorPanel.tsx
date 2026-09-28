import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CaptionStyle, HighlightMode } from '../../../shared/captions';
import { Chip } from '../components';
import { colors } from '../theme';

const SWATCHES = [
  '#FFFFFF', '#000000', '#FFE600', '#FFC400', '#FF9F0A', '#FF3B6B', '#FF3DF2',
  '#B388FF', '#7C5CFF', '#8AB4FF', '#00E5FF', '#3CFF6B', '#B7FF7A', '#E6FBFF',
];

const MODES: { id: HighlightMode; label: string }[] = [
  { id: 'color', label: 'Rang' },
  { id: 'scale', label: 'Rang + katta' },
  { id: 'box', label: 'Fon' },
  { id: 'dim', label: 'Karaoke' },
  { id: 'none', label: "Yo'q" },
];

type Props = {
  style: CaptionStyle;
  onColor: (c: string) => void;
  onHighlightColor: (c: string) => void;
  onHighlightMode: (m: HighlightMode) => void;
};

export function ColorPanel({ style, onColor, onHighlightColor, onHighlightMode }: Props) {
  return (
    <View style={{ gap: 14 }}>
      <Text style={s.label}>Matn rangi</Text>
      <Swatches value={style.color} onPick={onColor} />
      <Text style={s.label}>Aytilayotgan so'z</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {MODES.map((m) => (
          <Chip key={m.id} label={m.label} active={style.highlightMode === m.id} onPress={() => onHighlightMode(m.id)} />
        ))}
      </ScrollView>
      <Swatches value={style.highlightColor} onPick={onHighlightColor} />
    </View>
  );
}

function Swatches({ value, onPick }: { value: string; onPick: (c: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
      {SWATCHES.map((c) => (
        <Pressable key={c} onPress={() => onPick(c)} style={[s.swatchRing, value.toUpperCase() === c && s.swatchRingActive]}>
          <View style={[s.swatch, { backgroundColor: c }]} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  label: { color: colors.text, fontWeight: '700', fontSize: 14, paddingHorizontal: 16 },
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, alignItems: 'center' },
  swatchRing: { padding: 3, borderRadius: 22, borderWidth: 2, borderColor: 'transparent' },
  swatchRingActive: { borderColor: colors.accent },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
});
