import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { TRANSITION_MODES, TransitionSettings } from '../../../shared/transitions';
import { colors } from '../theme';

type Props = { value: TransitionSettings; onChange: (v: TransitionSettings) => void };

export function TransitionPanel({ value, onChange }: Props) {
  return (
    <View style={{ gap: 14 }}>
      <Text style={s.label}>{"Shisha o'tish effekti"}</Text>
      <View style={s.grid}>
        {TRANSITION_MODES.map((m) => (
          <Pressable key={m.id} onPress={() => onChange({ ...value, mode: m.id })} style={[s.item, value.mode === m.id && s.itemActive]}>
            <Text style={[s.text, value.mode === m.id && { color: colors.text }]}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
      {value.mode !== 'none' && (
        <View style={s.row}>
          <Text style={s.rowText}>Ovoz effekti (whoosh)</Text>
          <Switch value={value.sfx} onValueChange={(sfx) => onChange({ ...value, sfx })} trackColor={{ true: colors.accent }} />
        </View>
      )}
      {value.mode !== 'none' && (
        <Text style={s.hint}>{"Bu yerda soddalashtirilgan ko'rinish. To'liq shisha effekti va ovoz eksportda qo'shiladi."}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  label: { color: colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 16 },
  grid: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  item: {
    flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.surface,
    alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
  },
  itemActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  text: { color: colors.muted, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  rowText: { color: colors.text, fontWeight: '600' },
  hint: { color: colors.muted, fontSize: 12, paddingHorizontal: 16 },
});
