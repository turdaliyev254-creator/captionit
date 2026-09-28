// Google Sign-In is a native module: present in real builds (EAS/TestFlight), absent in Expo Go.
// Load it lazily so the app still runs in Expo Go, where the Google button is simply hidden.

export const GOOGLE_IOS_CLIENT_ID = '682449897788-jmtli8omau2fs3er8kqhaea7phqqkedn.apps.googleusercontent.com';

type GoogleModule = typeof import('@react-native-google-signin/google-signin');
let mod: GoogleModule | null | undefined;

function load(): GoogleModule | null {
  if (mod !== undefined) return mod;
  try {
    mod = require('@react-native-google-signin/google-signin') as GoogleModule;
    mod.GoogleSignin.configure({ iosClientId: GOOGLE_IOS_CLIENT_ID });
  } catch {
    mod = null;
  }
  return mod;
}

export const googleAvailable = () => load() !== null;

// Returns the Google ID token, or null if the user cancelled.
export async function googleIdToken(): Promise<string | null> {
  const g = load();
  if (!g) throw new Error('Google orqali kirish bu versiyada mavjud emas');
  const res = await g.GoogleSignin.signIn();
  if (!g.isSuccessResponse(res)) return null;
  if (!res.data.idToken) throw new Error('Google tokeni olinmadi');
  return res.data.idToken;
}
