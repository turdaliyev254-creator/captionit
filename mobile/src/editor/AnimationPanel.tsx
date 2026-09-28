import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ANIMATIONS, AnimationType } from '../../../shared/captions';
import { colors } from '../theme';

export function AnimationPanel({ value, onPick }: { value: AnimationType; onPick: (a: AnimationType) => void }) {
  return (
    <View style={s.grid}>
      {ANIMATIONS.map((a) => (
        <Pressable key={a.id} onPress={() => onPick(a.id)} style={[s.item, value === a.id && s.itemActive]}>
          <Text style={[s.text, value === a.id && { color: colors.text }]}>{a.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  item: {
    width: '31.5%', paddingVertical: 14, borderRadius: 12, backgroundColor: colors.surface,
    alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  itemActive: { borderColor: colors.accent, backgroundColor: '#2A2150' },
  text: { color: colors.muted, fontWeight: '700' },
});
