import { StyleSheet, Text } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { mediaUrl, User } from '../api';
import { BRAND_GRADIENT } from './Gradient';

// Profile photo, or gradient initials when there is none.
export function Avatar({ user, size }: { user: User; size: number }) {
  const name = user.name || 'U';
  const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const round = { width: size, height: size, borderRadius: size / 2 };
  if (user.avatarUrl) {
    return <Image source={{ uri: mediaUrl(user.avatarUrl) }} style={[round, s.photo]} contentFit="cover" transition={150} />;
  }
  return (
    <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[round, s.center]}>
      <Text style={[s.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  photo: { backgroundColor: 'rgba(255,255,255,0.1)' },
  center: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontFamily: 'Outfit_800ExtraBold' },
});

