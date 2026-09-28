import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { CaptionStyle, getStyles, Job, Position, Word } from '../api';
import { Button, Chip } from '../components';
import { colors } from '../theme';

const POSITIONS: { id: Position; label: string }[] = [
  { id: 'top', label: 'Tepada' },
  { id: 'middle', label: "O'rtada" },
  { id: 'bottom', label: 'Pastda' },
];

type Props = {
  job: Job;
  videoUri: string;
  onRender: (opts: { style: string; position: Position; words: Word[] }) => void;
  onBack: () => void;
};

export function EditorScreen({ job, videoUri, onRender, onBack }: Props) {
  const [words, setWords] = useState<Word[]>(job.words);
  const [captionStyles, setCaptionStyles] = useState<CaptionStyle[]>([]);
  const [style, setStyle] = useState('classic');
  const [position, setPosition] = useState<Position>('bottom');
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState('');

  const player = useVideoPlayer(videoUri, (p) => {
    p.loop = true;
  });

  useEffect(() => {
    getStyles().then(setCaptionStyles).catch(() => {});
  }, []);

  function openEditor(i: number) {
    setEditing(i);
    setDraft(words[i].word.trim());
  }

  function saveWord() {
    if (editing === null) return;
    const text = draft.trim();
    setWords((ws) => (text ? ws.map((w, i) => (i === editing ? { ...w, word: text } : w)) : ws.filter((_, i) => i !== editing)));
    setEditing(null);
  }

  function seekTo(w: Word) {
    player.currentTime = w.start;
    player.play();
  }

  const portrait = (job.height ?? 16) >= (job.width ?? 9);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={s.back}>‹ Orqaga</Text>
        </Pressable>
        <Text style={s.title}>Tahrirlash</Text>
        <View style={{ width: 70 }} />
      </View>

      <VideoView player={player} style={[s.video, { aspectRatio: portrait ? 9 / 16 : 16 / 9 }]} contentFit="contain" nativeControls />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll}>
        <Text style={s.label}>Stil</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
          {captionStyles.map((st) => (
            <Pressable key={st.id} onPress={() => setStyle(st.id)} style={[s.styleCard, style === st.id && s.styleCardActive]}>
              <Text style={[s.stylePreview, { color: st.primary }]}>
                Aa <Text style={{ color: st.highlight }}>Bb</Text>
              </Text>
              <Text style={s.styleLabel}>{st.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={s.label}>Joylashuv</Text>
        <View style={s.row}>
          {POSITIONS.map((p) => (
            <Chip key={p.id} label={p.label} active={position === p.id} onPress={() => setPosition(p.id)} />
          ))}
        </View>

        <Text style={s.label}>
          Matn <Text style={s.hint}>(bosing — o'sha joyga o'tadi, bosib turing — tahrirlash)</Text>
        </Text>
        {words.length === 0 ? (
          <Text style={s.hint}>Videoda nutq topilmadi.</Text>
        ) : (
          <View style={s.words}>
            {words.map((w, i) => (
              <Pressable key={i} onPress={() => seekTo(w)} onLongPress={() => openEditor(i)} style={s.word}>
                <Text style={s.wordText}>{w.word.trim()}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={s.footer}>
        <Button
          title="Subtitr qo'shish"
          disabled={words.length === 0}
          onPress={() => {
            player.pause();
            onRender({ style, position, words });
          }}
        />
      </View>

      <Modal visible={editing !== null} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={s.modalBg}>
          <View style={s.modal}>
            <Text style={s.label}>So'zni tahrirlash</Text>
            <TextInput value={draft} onChangeText={setDraft} autoFocus style={s.input} onSubmitEditing={saveWord} />
            <Text style={s.hint}>Bo'sh qoldirsangiz, so'z o'chiriladi.</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Button title="Bekor" variant="secondary" onPress={() => setEditing(null)} /></View>
              <View style={{ flex: 1 }}><Button title="Saqlash" onPress={saveWord} /></View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  back: { color: colors.accent, fontSize: 16, fontWeight: '600', width: 70 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  video: { maxHeight: 320, alignSelf: 'center', backgroundColor: '#000', borderRadius: 12 },
  scroll: { padding: 16, gap: 12 },
  label: { color: colors.text, fontWeight: '700', fontSize: 15, marginTop: 6 },
  hint: { color: colors.muted, fontWeight: '400', fontSize: 13 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  styleCard: {
    width: 86, height: 72, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  styleCardActive: { borderColor: colors.accent, backgroundColor: '#2A2150' },
  stylePreview: { fontSize: 18, fontWeight: '900' },
  styleLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  words: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  word: { backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  wordText: { color: colors.text, fontSize: 15 },
  footer: { padding: 16 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 12 },
  input: {
    backgroundColor: colors.bg, color: colors.text, borderRadius: 10, padding: 12, fontSize: 17,
    borderWidth: 1, borderColor: colors.border,
  },
});
