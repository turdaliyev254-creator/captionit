import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { openPrivacy } from '../links';
import { colors } from '../theme';
import { GlassCard, GradientButton } from './Gradient';

// Explicit permission before any audio goes to a third-party AI (App Store guideline 5.1.2(i)).
export function ConsentModal({ visible, onAccept, onCancel }: { visible: boolean; onAccept: () => void; onCancel: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.backdrop}>
        <GlassCard style={s.card} radius={26}>
          <View style={s.icon}>
            <Ionicons name="shield-checkmark" size={28} color="#fff" />
          </View>
          <Text style={s.title}>Ovozni matnga aylantirish</Text>
          <Text style={s.body}>
            Subtitr yaratish uchun videongizning <Text style={s.bold}>faqat ovozi</Text> nutqni tanish xizmati —{' '}
            <Text style={s.bold}>ElevenLabs</Text> (AQSh) sun’iy intellektiga yuboriladi. Video tasviri yuborilmaydi.
          </Text>
          <View style={s.points}>
            <Point text="Ovoz faqat matnga aylantirish uchun ishlatiladi" />
            <Point text="Videolaringizni istalgan vaqtda o‘chirishingiz mumkin" />
            <Point text="Rozilikni sozlamalarda qaytarib olish mumkin" />
          </View>
          <Pressable onPress={openPrivacy} hitSlop={6}>
            <Text style={s.link}>Maxfiylik siyosati</Text>
          </Pressable>
          <GradientButton style={{ marginTop: 18, alignSelf: 'stretch' }} title="Roziman, davom etish" onPress={onAccept} />
          <Pressable onPress={onCancel} style={s.cancel} hitSlop={8}>
            <Text style={s.cancelText}>Bekor qilish</Text>
          </Pressable>
        </GlassCard>
      </View>
    </Modal>
  );
}

function Point({ text }: { text: string }) {
  return (
    <View style={s.point}>
      <Ionicons name="checkmark-circle" size={18} color="#7CFFB2" />
      <Text style={s.pointText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  card: { padding: 22, alignItems: 'center' },
  icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { color: '#fff', fontFamily: 'Outfit_800ExtraBold', fontSize: 22, textAlign: 'center' },
  body: { color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10 },
  bold: { color: '#fff', fontWeight: '700' },
  points: { alignSelf: 'stretch', gap: 8, marginVertical: 16 },
  point: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pointText: { color: '#fff', fontSize: 14, flex: 1 },
  link: { color: colors.accent, fontWeight: '700' },
  cancel: { marginTop: 12, paddingVertical: 4 },
  cancelText: { color: colors.muted, fontWeight: '700' },
});
