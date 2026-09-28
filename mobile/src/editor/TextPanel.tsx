import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { VideoPlayer } from 'expo-video';
import { activePhrase, Phrase } from '../../../shared/captions';
import { usePlayerTime } from '../captions/usePlayerTime';
import { colors } from '../theme';

type Props = {
  phrases: Phrase[];
  player: VideoPlayer;
  onChangeText: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onSeek: (t: number) => void;
};

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}.${Math.floor((t % 1) * 10)}`;

export function TextPanel({ phrases, player, onChangeText, onDelete, onAdd, onSeek }: Props) {
  const currentId = activePhrase(phrases, usePlayerTime(player, 250))?.id ?? null;
  return (
    <View style={{ gap: 8, paddingHorizontal: 16 }}>
      <Pressable style={s.add} onPress={onAdd}>
        <Ionicons name="add-circle" size={20} color={colors.accent} />
        <Text style={s.addText}>Hozirgi joyga ibora qo'shish</Text>
      </Pressable>
      {phrases.map((p) => (
        <PhraseRow
          key={p.id}
          phrase={p}
          active={p.id === currentId}
          onChangeText={(t) => onChangeText(p.id, t)}
          onDelete={() => onDelete(p.id)}
          onSeek={() => onSeek(p.start + 0.01)}
        />
      ))}
    </View>
  );
}

function PhraseRow({ phrase, active, onChangeText, onDelete, onSeek }: {
  phrase: Phrase; active: boolean; onChangeText: (t: string) => void; onDelete: () => void; onSeek: () => void;
}) {
  const initial = phrase.words.map((w) => w.word).join(' ');
  const [draft, setDraft] = useState(initial);

  return (
    <View style={[s.row, active && s.rowActive]}>
      <Pressable onPress={onSeek} hitSlop={6}>
        <Text style={s.time}>{fmt(phrase.start)}</Text>
      </Pressable>
      <TextInput
        style={s.input}
        value={draft}
        onChangeText={setDraft}
        onFocus={onSeek}
        onEndEditing={() => draft !== initial && onChangeText(draft)}
        multiline
        blurOnSubmit
        returnKeyType="done"
      />
      <Pressable onPress={onDelete} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={colors.muted} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  add: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  addText: { color: colors.accent, fontWeight: '700' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'transparent',
  },
  rowActive: { borderColor: colors.accent },
  time: { color: colors.muted, fontSize: 12, fontVariant: ['tabular-nums'], width: 44 },
  input: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 6 },
});
