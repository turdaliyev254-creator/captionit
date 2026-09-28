import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CaptionStyle, Phrase } from '../../../shared/captions';
import { CATEGORIES, STYLES } from '../../../shared/styles';
import { CaptionOverlay } from '../captions/CaptionOverlay';
import { useLoopClock } from '../captions/usePlayerTime';
import { Chip } from '../components';
import { colors } from '../theme';

const CARD_W = 120;
const CARD_H = 150;

// Sample phrase for thumbnails, with fake word timings that loop.
const SAMPLE: Phrase[] = [
  {
    id: 'sample',
    start: 0,
    end: 1.6,
    words: ['Salom', 'do‘stlar', 'bugun'].map((word, i) => ({ word, start: 0.1 + i * 0.45, end: 0.5 + i * 0.45 })),
  },
];

export function StylePanel({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const [category, setCategory] = useState<CaptionStyle['category']>('glass');
  const time = useLoopClock(2.4);
  const list = useMemo(() => STYLES.filter((s) => s.category === category), [category]);

  return (
    <View style={{ gap: 12 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} label={c.label} active={category === c.id} onPress={() => setCategory(c.id)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {list.map((st) => (
          <Pressable key={st.id} onPress={() => onSelect(st.id)} style={[s.card, selected === st.id && s.cardActive]}>
            <LinearGradient colors={['#5B4B8A', '#1E3A5F', '#0F2027']} style={StyleSheet.absoluteFill} />
            <View style={s.stripes} />
            <CaptionOverlay
              phrases={SAMPLE}
              style={{ ...st, y: 0.45, maxWidth: 0.95, font: { ...st.font, size: Math.min(st.font.size, 90) } }}
              time={time}
              width={CARD_W}
              height={CARD_H - 30}
              scale={CARD_W / 620}
            />
            <Text style={s.label} numberOfLines={1}>{st.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  card: {
    width: CARD_W, height: CARD_H, borderRadius: 14, overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent', justifyContent: 'flex-end',
  },
  cardActive: { borderColor: colors.accent },
  // A few bright shapes behind the caption so glass styles have something to blur.
  stripes: {
    position: 'absolute', top: 30, left: 20, width: 70, height: 50, borderRadius: 25,
    backgroundColor: '#FF7A59', opacity: 0.85, transform: [{ rotate: '-20deg' }],
  },
  label: {
    color: colors.text, fontSize: 12, fontWeight: '700', textAlign: 'center',
    paddingVertical: 7, backgroundColor: 'rgba(0,0,0,0.55)',
  },
});
