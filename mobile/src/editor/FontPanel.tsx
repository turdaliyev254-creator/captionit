import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { CaptionStyle, FontFamily, FONTS, nearestWeight } from '../../../shared/captions';
import { rnFont } from '../fonts';
import { colors } from '../theme';

type Props = {
  style: CaptionStyle; // resolved
  onFont: (f: FontFamily) => void;
  onSize: (size: number) => void;
  onUppercase: (v: boolean) => void;
};

export function FontPanel({ style, onFont, onSize, onUppercase }: Props) {
  return (
    <View style={{ gap: 16 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {(Object.keys(FONTS) as FontFamily[]).map((f) => {
          const w = nearestWeight(f, 800);
          const active = style.font.family === f;
          return (
            <Pressable key={f} onPress={() => onFont(f)} style={[s.card, active && s.cardActive]}>
              <Text style={[s.sample, { fontFamily: rnFont(f, w, FONTS[f].italic) }]}>Aa</Text>
              <Text style={s.name} numberOfLines={1}>{FONTS[f].label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={s.line}>
        <Text style={s.label}>O'lcham</Text>
        <Slider
          style={{ flex: 1 }}
          minimumValue={36}
          maximumValue={160}
          step={2}
          value={style.font.size}
          onValueChange={onSize}
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.border}
          thumbTintColor="#fff"
        />
        <Text style={s.value}>{Math.round(style.font.size)}</Text>
      </View>

      <View style={s.line}>
        <Text style={s.label}>KATTA HARFLAR</Text>
        <View style={{ flex: 1 }} />
        <Switch value={style.font.uppercase} onValueChange={onUppercase} trackColor={{ true: colors.accent }} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  card: {
    width: 78, height: 78, borderRadius: 14, backgroundColor: colors.surface, alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', gap: 2,
  },
  cardActive: { borderColor: colors.accent },
  sample: { color: colors.text, fontSize: 28 },
  name: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  label: { color: colors.text, fontWeight: '700', fontSize: 14 },
  value: { color: colors.muted, width: 32, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
