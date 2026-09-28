import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { deleteAccount, listVideos, mediaUrl, User, VideoItem } from '../api';
import { Avatar } from '../ui/Avatar';
import { openPrivacy, openTerms } from '../links';
import { colors } from '../theme';
import { BRAND_GRADIENT, GlassCard, GradientText } from '../ui/Gradient';

type Props = {
  user: User;
  onBack: () => void;
  onOpenVideo: (v: VideoItem) => void;
  onContact: () => void;
  onEdit: () => void;
  onUserChange: (u: User) => void;
  onSignOut: () => void;
  onNewVideo: () => void;
};

const fmtDuration = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const fmtDate = (ms: number) => new Date(ms).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });

export function ProfileScreen({ user, onBack, onOpenVideo, onContact, onEdit, onUserChange, onSignOut, onNewVideo }: Props) {
  const [videos, setVideos] = useState<VideoItem[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setVideos((await listVideos()).videos);
    } catch (e: any) {
      setVideos((v) => v ?? []);
      Alert.alert('Videolar yuklanmadi', e?.message ?? String(e));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function confirmDelete() {
    Alert.alert(
      'Akkauntni o‘chirish',
      'Akkauntingiz va barcha videolaringiz serverdan butunlay o‘chiriladi. Bu amalni qaytarib bo‘lmaydi.',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'O‘chirish',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              onSignOut();
            } catch (e: any) {
              Alert.alert('Xatolik', e?.message ?? String(e));
            }
          },
        },
      ],
    );
  }

  const displayName = user.name || 'Foydalanuvchi';
  // +998901234567 -> +998 90 123 45 67
  const phone = user.phone?.replace(/^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/, '+998 $1 $2 $3 $4');
  const contactLine = phone ?? user.email ?? 'Apple akkaunt';

  const header = (
    <View>
      <View style={s.topBar}>
        <Pressable onPress={onBack} hitSlop={12} style={s.roundBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={s.topTitle}>Profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <GlassCard style={s.profileCard} radius={24}>
        <Pressable onPress={onEdit}>
          <Avatar user={user} size={58} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>{displayName}</Text>
          <Text style={s.contactLine} numberOfLines={1}>{contactLine}</Text>
        </View>
        <View style={s.stat}>
          <GradientText style={s.statValue}>{String(videos?.length ?? '–')}</GradientText>
          <Text style={s.statLabel}>video</Text>
        </View>
      </GlassCard>

      <Pressable onPress={onEdit} style={({ pressed }) => [s.editBtn, pressed && { opacity: 0.8 }]}>
        <Ionicons name="create-outline" size={18} color="#fff" />
        <Text style={s.editText}>Profilni tahrirlash</Text>
      </Pressable>

      <Text style={s.section}>Mening videolarim</Text>
    </View>
  );

  const footer = (
    <View style={{ marginTop: 10 }}>
      <Text style={s.section}>Sozlamalar</Text>
      <GlassCard radius={20}>
        <Row icon="person-circle-outline" label="Profilni tahrirlash" onPress={onEdit} />
        <Row icon="chatbubbles-outline" label="Biz bilan bog‘lanish" onPress={onContact} />
        <Row icon="shield-checkmark-outline" label="Maxfiylik siyosati" onPress={openPrivacy} />
        <Row icon="document-text-outline" label="Foydalanish shartlari" onPress={openTerms} />
        <Row icon="log-out-outline" label="Chiqish" onPress={onSignOut} />
        <Row icon="trash-outline" label="Akkauntni o‘chirish" onPress={confirmDelete} danger last />
      </GlassCard>
      <Text style={s.version}>Captionit 1.0.0</Text>
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={s.container}
      data={videos ?? []}
      keyExtractor={(v) => v.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      ListHeaderComponent={header}
      ListFooterComponent={footer}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor="#fff" onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      ListEmptyComponent={
        videos === null ? (
          <ActivityIndicator color="#fff" style={{ marginVertical: 30 }} />
        ) : (
          <GlassCard style={s.empty} radius={20}>
            <Ionicons name="film-outline" size={32} color={colors.muted} />
            <Text style={s.emptyText}>Hali video yo‘q. Birinchi videongizga subtitr qo‘shing!</Text>
            <Pressable onPress={onNewVideo} hitSlop={6}>
              <Text style={s.link}>Video tanlash</Text>
            </Pressable>
          </GlassCard>
        )
      }
      renderItem={({ item }) => (
        <Pressable style={s.card} onPress={() => onOpenVideo(item)}>
          <Image source={{ uri: mediaUrl(item.thumbUrl) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={s.cardShade} />
          <View style={s.duration}>
            <Ionicons name="play" size={10} color="#fff" />
            <Text style={s.durationText}>{fmtDuration(item.duration)}</Text>
          </View>
          <View style={s.cardInfo}>
            <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={s.cardDate}>{fmtDate(item.createdAt)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

function Row({ icon, label, onPress, danger, last }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; danger?: boolean; last?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.row, !last && s.rowBorder, pressed && { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
      <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.text} />
      <Text style={[s.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  container: { paddingHorizontal: 18, paddingBottom: 30, gap: 12 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  topTitle: { color: colors.text, fontFamily: 'Outfit_700Bold', fontSize: 17 },
  roundBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, marginTop: 10 },
  avatar: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontFamily: 'Outfit_800ExtraBold', fontSize: 22 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: '#fff', fontFamily: 'Outfit_700Bold', fontSize: 19, flexShrink: 1 },
  nameInput: { color: '#fff', fontSize: 18, fontWeight: '700', borderBottomWidth: 1, borderColor: colors.accent, paddingVertical: 2 },
  contactLine: { color: colors.muted, marginTop: 3 },
  stat: { alignItems: 'center' },
  statValue: { fontFamily: 'Outfit_800ExtraBold', fontSize: 26, lineHeight: 30 },
  statLabel: { color: colors.muted, fontSize: 12 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, height: 46, borderRadius: 14,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  editText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  section: { color: colors.text, fontFamily: 'Outfit_700Bold', fontSize: 17, marginTop: 22, marginBottom: 12 },
  card: { flex: 1, aspectRatio: 9 / 14, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.surface, marginBottom: 12 },
  cardShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  duration: {
    position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999,
  },
  durationText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardInfo: { position: 'absolute', left: 10, right: 10, bottom: 10 },
  cardTitle: { color: '#fff', fontWeight: '700', fontSize: 13 },
  cardDate: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 3 },
  empty: { alignItems: 'center', gap: 10, padding: 24 },
  emptyText: { color: colors.muted, textAlign: 'center' },
  link: { color: colors.accent, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  rowLabel: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  version: { color: colors.muted, textAlign: 'center', fontSize: 12, marginTop: 18 },
});
