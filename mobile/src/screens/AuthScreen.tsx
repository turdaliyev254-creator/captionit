import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { signInApple, startOtp, User, verifyOtp } from '../api';
import { openPrivacy, openTerms } from '../links';
import { colors } from '../theme';
import { BRAND_GRADIENT, GlassCard, GradientButton, GradientText } from '../ui/Gradient';

type Props = { onSignedIn: (token: string, user: User) => void };

// "90 123 45 67" as the user types.
function formatLocal(digits: string) {
  const d = digits.slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean).join(' ');
}

export function AuthScreen({ onSignedIn }: Props) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [digits, setDigits] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const codeInput = useRef<TextInput>(null);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => {});
  }, []);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const phone = `+998${digits}`;

  async function sendCode() {
    if (digits.length !== 9) return Alert.alert('Telefon raqam', "Raqamni to'liq kiriting: 9 ta raqam.");
    setBusy(true);
    try {
      const res = await startOtp(phone);
      setStep('code');
      setResendIn(60);
      setTimeout(() => codeInput.current?.focus(), 300);
      // Development servers without an SMS provider return the code directly.
      if (res.devCode) Alert.alert('Sinov rejimi', `SMS xizmati ulanmagan. Kod: ${res.devCode}`);
    } catch (e: any) {
      Alert.alert('Xatolik', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function confirm(value = code) {
    if (value.length !== 6) return;
    setBusy(true);
    try {
      const s = await verifyOtp(phone, value);
      onSignedIn(s.token, s.user);
    } catch (e: any) {
      setCode('');
      Alert.alert('Xatolik', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  async function apple() {
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (!cred.identityToken) throw new Error('Apple tokeni olinmadi');
      setBusy(true);
      const fullName = [cred.fullName?.givenName, cred.fullName?.familyName].filter(Boolean).join(' ');
      const s = await signInApple(cred.identityToken, fullName || undefined);
      onSignedIn(s.token, s.user);
    } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED') Alert.alert('Apple orqali kirib bo‘lmadi', e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.brandRow}>
        <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.logo}>
          <Ionicons name="text" size={18} color="#fff" />
        </LinearGradient>
        <Text style={s.brand}>Captionit</Text>
      </View>

      <View style={s.hero}>
        <Text style={s.title}>{step === 'phone' ? 'Xush' : 'Kodni'}</Text>
        <GradientText style={s.title}>{step === 'phone' ? 'kelibsiz' : 'kiriting'}</GradientText>
        <Text style={s.subtitle}>
          {step === 'phone'
            ? 'Videolaringiz profilingizda saqlanishi uchun tizimga kiring.'
            : `${'+998 ' + formatLocal(digits)} raqamiga SMS orqali 6 xonali kod yubordik.`}
        </Text>
      </View>

      {step === 'phone' ? (
        <>
          <GlassCard style={s.inputCard} radius={18}>
            <Text style={s.prefix}>🇺🇿 +998</Text>
            <View style={s.divider} />
            <TextInput
              style={s.input}
              value={formatLocal(digits)}
              onChangeText={(t) => setDigits(t.replace(/\D/g, '').slice(0, 9))}
              keyboardType="number-pad"
              placeholder="90 123 45 67"
              placeholderTextColor="rgba(255,255,255,0.35)"
              textContentType="telephoneNumber"
              autoComplete="tel"
              returnKeyType="done"
              onSubmitEditing={sendCode}
            />
          </GlassCard>
          <GradientButton
            style={{ marginTop: 14 }}
            title={busy ? 'Yuborilmoqda…' : 'Kod olish'}
            icon={busy ? <ActivityIndicator color="#fff" /> : <Ionicons name="chatbubble-ellipses" size={19} color="#fff" />}
            onPress={() => !busy && sendCode()}
          />

          {appleAvailable && (
            <>
              <View style={s.orRow}>
                <View style={s.orLine} />
                <Text style={s.orText}>yoki</Text>
                <View style={s.orLine} />
              </View>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={18}
                style={s.appleBtn}
                onPress={apple}
              />
            </>
          )}
        </>
      ) : (
        <>
          <GlassCard style={s.inputCard} radius={18}>
            <TextInput
              ref={codeInput}
              style={[s.input, s.codeInput]}
              value={code}
              onChangeText={(t) => {
                const v = t.replace(/\D/g, '').slice(0, 6);
                setCode(v);
                if (v.length === 6) confirm(v);
              }}
              keyboardType="number-pad"
              placeholder="• • • • • •"
              placeholderTextColor="rgba(255,255,255,0.35)"
              textContentType="oneTimeCode"
              autoComplete="sms-otp"
              maxLength={6}
            />
          </GlassCard>
          <GradientButton
            style={{ marginTop: 14 }}
            title={busy ? 'Tekshirilmoqda…' : 'Tasdiqlash'}
            icon={busy ? <ActivityIndicator color="#fff" /> : <Ionicons name="checkmark-circle" size={20} color="#fff" />}
            onPress={() => !busy && confirm()}
          />
          <View style={s.codeActions}>
            <Pressable onPress={() => { setStep('phone'); setCode(''); }} hitSlop={8}>
              <Text style={s.link}>Raqamni o‘zgartirish</Text>
            </Pressable>
            <Pressable disabled={resendIn > 0 || busy} onPress={sendCode} hitSlop={8}>
              <Text style={[s.link, resendIn > 0 && { color: colors.muted }]}>
                {resendIn > 0 ? `Qayta yuborish (${resendIn})` : 'Qayta yuborish'}
              </Text>
            </Pressable>
          </View>
        </>
      )}

      <View style={{ flex: 1 }} />
      <Text style={s.legal}>
        Davom etish orqali siz{' '}
        <Text style={s.legalLink} onPress={openTerms}>Foydalanish shartlari</Text> va{' '}
        <Text style={s.legalLink} onPress={openPrivacy}>Maxfiylik siyosati</Text>ga rozilik bildirasiz.
      </Text>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  brand: { color: '#fff', fontFamily: 'Outfit_800ExtraBold', fontSize: 20 },
  hero: { marginTop: 40, marginBottom: 28 },
  title: { color: '#fff', fontFamily: 'Outfit_800ExtraBold', fontSize: 44, lineHeight: 50, letterSpacing: -0.5 },
  subtitle: { color: 'rgba(255,255,255,0.72)', fontSize: 16, lineHeight: 23, marginTop: 12 },
  inputCard: { flexDirection: 'row', alignItems: 'center', height: 62, paddingHorizontal: 18 },
  prefix: { color: '#fff', fontSize: 18, fontWeight: '700' },
  divider: { width: 1, height: 26, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 14 },
  input: { flex: 1, color: '#fff', fontSize: 20, fontWeight: '600', letterSpacing: 1 },
  codeInput: { textAlign: 'center', fontSize: 28, letterSpacing: 12 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  orLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  orText: { color: colors.muted, fontWeight: '600' },
  appleBtn: { height: 56, width: '100%' },
  codeActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  link: { color: colors.accent, fontWeight: '700' },
  legal: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  legalLink: { color: '#fff', textDecorationLine: 'underline' },
});
