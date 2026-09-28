import { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { removeAvatar, startPhoneChange, updateProfile, uploadAvatar, User, verifyPhoneChange } from '../api';
import { colors } from '../theme';
import { Avatar } from '../ui/Avatar';
import { GlassCard, GradientButton } from '../ui/Gradient';

type Props = { user: User; onBack: () => void; onUserChange: (u: User) => void };

const formatPhone = (p: string | null) => p?.replace(/^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/, '+998 $1 $2 $3 $4') ?? '';

export function EditProfileScreen({ user, onBack, onUserChange }: Props) {
  const [name, setName] = useState(user.name ?? '');
  const [email, setEmail] = useState(user.email ?? '');
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);

  // Phone change flow
  const [phoneStep, setPhoneStep] = useState<'idle' | 'enter' | 'code'>('idle');
  const [digits, setDigits] = useState('');
  const [code, setCode] = useState('');
  const [phoneBusy, setPhoneBusy] = useState(false);

  const dirty = name.trim() !== (user.name ?? '') || email.trim().toLowerCase() !== (user.email ?? '');

  async function save() {
    setSaving(true);
    try {
      onUserChange((await updateProfile({ name: name.trim(), email: email.trim() })).user);
      onBack();
    } catch (e: any) {
      Alert.alert('Saqlanmadi', e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  async function pickAvatar() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    const a = res.assets?.[0];
    if (res.canceled || !a) return;
    setAvatarBusy(true);
    try {
      onUserChange(await uploadAvatar(a.uri, a.mimeType));
    } catch (e: any) {
      Alert.alert('Rasm yuklanmadi', e?.message ?? String(e));
    } finally {
      setAvatarBusy(false);
    }
  }

  function avatarMenu() {
    if (!user.avatarUrl) return pickAvatar();
    Alert.alert('Profil rasmi', undefined, [
      { text: 'Yangi rasm tanlash', onPress: pickAvatar },
      {
        text: 'Rasmni o‘chirish',
        style: 'destructive',
        onPress: async () => {
          try {
            onUserChange((await removeAvatar()).user);
          } catch (e: any) {
            Alert.alert('Xatolik', e?.message ?? String(e));
          }
        },
      },
      { text: 'Bekor qilish', style: 'cancel' },
    ]);
  }

  async function sendPhoneCode() {
    if (digits.length !== 9) return Alert.alert('Telefon raqam', "Raqamni to'liq kiriting: 9 ta raqam.");
    setPhoneBusy(true);
    try {
      const r = await startPhoneChange(`+998${digits}`);
      setPhoneStep('code');
      if (r.devCode) Alert.alert('Sinov rejimi', `Kod: ${r.devCode}`);
    } catch (e: any) {
      Alert.alert('Xatolik', e?.message ?? String(e));
    } finally {
      setPhoneBusy(false);
    }
  }

  async function confirmPhone() {
    setPhoneBusy(true);
    try {
      onUserChange((await verifyPhoneChange(`+998${digits}`, code)).user);
      setPhoneStep('idle');
      setDigits('');
      setCode('');
      Alert.alert('Tayyor', 'Telefon raqam yangilandi.');
    } catch (e: any) {
      Alert.alert('Xatolik', e?.message ?? String(e));
    } finally {
      setPhoneBusy(false);
    }
  }

  const providers = [user.providers.google && 'Google', user.providers.apple && 'Apple', user.providers.phone && 'Telefon'].filter(Boolean).join(', ');

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.topBar}>
        <Pressable onPress={onBack} hitSlop={12} style={s.roundBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={s.topTitle}>Profilni tahrirlash</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <Pressable onPress={avatarMenu} style={s.avatarWrap} disabled={avatarBusy}>
          <Avatar user={user} size={104} />
          <View style={s.cameraBadge}>
            {avatarBusy ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="camera" size={16} color="#fff" />}
          </View>
        </Pressable>
        <Text style={s.avatarHint}>{user.avatarUrl ? 'Rasmni o‘zgartirish' : 'Rasm qo‘shish'}</Text>

        <Text style={s.label}>Ism</Text>
        <GlassCard style={s.field} radius={16}>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Ismingiz" placeholderTextColor={colors.muted} maxLength={60} />
        </GlassCard>

        <Text style={s.label}>Email</Text>
        <GlassCard style={s.field} radius={16}>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="email@misol.uz"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            maxLength={120}
          />
        </GlassCard>

        <Text style={s.label}>Telefon raqam</Text>
        {phoneStep === 'idle' && (
          <GlassCard style={[s.field, s.row]} radius={16}>
            <Text style={[s.input, !user.phone && { color: colors.muted }]}>{formatPhone(user.phone) || 'Qo‘shilmagan'}</Text>
            <Pressable onPress={() => setPhoneStep('enter')} hitSlop={8}>
              <Text style={s.link}>{user.phone ? 'O‘zgartirish' : 'Qo‘shish'}</Text>
            </Pressable>
          </GlassCard>
        )}
        {phoneStep === 'enter' && (
          <>
            <GlassCard style={[s.field, s.row]} radius={16}>
              <Text style={s.prefix}>+998</Text>
              <TextInput
                style={s.input}
                value={digits}
                onChangeText={(t) => setDigits(t.replace(/\D/g, '').slice(0, 9))}
                keyboardType="number-pad"
                placeholder="90 123 45 67"
                placeholderTextColor={colors.muted}
                autoFocus
              />
            </GlassCard>
            <View style={s.phoneActions}>
              <Pressable onPress={() => setPhoneStep('idle')} hitSlop={8}><Text style={s.muted}>Bekor qilish</Text></Pressable>
              <Pressable onPress={sendPhoneCode} disabled={phoneBusy} hitSlop={8}>
                <Text style={s.link}>{phoneBusy ? 'Yuborilmoqda…' : 'Kod yuborish'}</Text>
              </Pressable>
            </View>
          </>
        )}
        {phoneStep === 'code' && (
          <>
            <GlassCard style={s.field} radius={16}>
              <TextInput
                style={[s.input, { letterSpacing: 8, textAlign: 'center' }]}
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                placeholder="SMS kod"
                placeholderTextColor={colors.muted}
                textContentType="oneTimeCode"
                autoFocus
              />
            </GlassCard>
            <View style={s.phoneActions}>
              <Pressable onPress={() => setPhoneStep('enter')} hitSlop={8}><Text style={s.muted}>Orqaga</Text></Pressable>
              <Pressable onPress={confirmPhone} disabled={phoneBusy || code.length !== 6} hitSlop={8}>
                <Text style={[s.link, code.length !== 6 && { opacity: 0.5 }]}>{phoneBusy ? 'Tekshirilmoqda…' : 'Tasdiqlash'}</Text>
              </Pressable>
            </View>
          </>
        )}

        <GlassCard style={s.info} radius={16}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
          <Text style={s.infoText}>
            Captionit parol ishlatmaydi — kirish {providers || 'SMS kod'} orqali amalga oshadi. Bu xavfsizroq va parolni eslab qolish shart emas.
          </Text>
        </GlassCard>

        <GradientButton
          style={{ marginTop: 24, opacity: dirty ? 1 : 0.5 }}
          title={saving ? 'Saqlanmoqda…' : 'Saqlash'}
          icon={saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="checkmark" size={20} color="#fff" />}
          onPress={() => dirty && !saving && save()}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 6 },
  topTitle: { color: colors.text, fontFamily: 'Outfit_700Bold', fontSize: 17 },
  roundBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  container: { paddingHorizontal: 22, paddingBottom: 40 },
  avatarWrap: { alignSelf: 'center', marginTop: 16 },
  cameraBadge: {
    position: 'absolute', right: 0, bottom: 0, width: 34, height: 34, borderRadius: 17, backgroundColor: '#FF3D9A',
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.bg,
  },
  avatarHint: { color: colors.accent, fontWeight: '700', textAlign: 'center', marginTop: 10, marginBottom: 10 },
  label: { color: 'rgba(255,255,255,0.75)', fontWeight: '700', fontSize: 13, marginTop: 18, marginBottom: 8 },
  field: { height: 54, paddingHorizontal: 16, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  prefix: { color: '#fff', fontSize: 16, fontWeight: '700' },
  input: { flex: 1, color: '#fff', fontSize: 16 },
  link: { color: colors.accent, fontWeight: '700' },
  muted: { color: colors.muted, fontWeight: '700' },
  phoneActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 4 },
  info: { flexDirection: 'row', gap: 10, padding: 14, marginTop: 24, alignItems: 'flex-start' },
  infoText: { flex: 1, color: colors.muted, fontSize: 13, lineHeight: 19 },
});
