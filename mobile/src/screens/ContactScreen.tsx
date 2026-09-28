import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CONTACT, openSupport, openUrl } from '../links';
import { colors } from '../theme';
import { GlassCard, GradientText } from '../ui/Gradient';

const CHANNELS: { icon: keyof typeof Ionicons.glyphMap; title: string; value: string; url: string; colors: [string, string] }[] = [
  { icon: 'call', title: 'Telefon', value: CONTACT.phone, url: CONTACT.phoneUrl, colors: ['#34C759', '#0FA968'] },
  { icon: 'paper-plane', title: 'Telegram', value: CONTACT.telegram, url: CONTACT.telegramUrl, colors: ['#2AABEE', '#1E88D0'] },
  { icon: 'logo-instagram', title: 'Instagram', value: CONTACT.instagram, url: CONTACT.instagramUrl, colors: ['#FEDA75', '#D62976'] },
];

export function ContactScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={s.container}>
      <View style={s.topBar}>
        <Pressable onPress={onBack} hitSlop={12} style={s.roundBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ width: 40 }} />
      </View>

      <Text style={s.title}>Biz bilan</Text>
      <GradientText style={s.title}>bog‘laning</GradientText>
      <Text style={s.subtitle}>Savol, taklif yoki muammo bo‘lsa — yozing yoki qo‘ng‘iroq qiling. Imkon qadar tez javob beramiz.</Text>

      <View style={{ gap: 12, marginTop: 26 }}>
        {CHANNELS.map((c) => (
          <Pressable key={c.title} onPress={() => openUrl(c.url)} style={({ pressed }) => pressed && { opacity: 0.8 }}>
            <GlassCard style={s.channel} radius={20}>
              <LinearGradient colors={c.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.channelIcon}>
                <Ionicons name={c.icon} size={22} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={s.channelTitle}>{c.title}</Text>
                <Text style={s.channelValue}>{c.value}</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={colors.muted} />
            </GlassCard>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={openSupport} style={s.faq} hitSlop={8}>
        <Ionicons name="help-circle-outline" size={18} color={colors.accent} />
        <Text style={s.faqText}>Ko‘p so‘raladigan savollar</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 22 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, marginBottom: 20 },
  roundBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: '#fff', fontFamily: 'Outfit_800ExtraBold', fontSize: 40, lineHeight: 46 },
  subtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 16, lineHeight: 23, marginTop: 12 },
  channel: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  channelIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  channelTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  channelValue: { color: colors.muted, marginTop: 2 },
  faq: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', marginTop: 28 },
  faqText: { color: colors.accent, fontWeight: '700' },
});
