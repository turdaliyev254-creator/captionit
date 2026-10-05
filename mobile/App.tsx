import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { buildPhrases, resolveStyle } from '../shared/captions';
import { shiftForTrim, shiftPhrasesForTrim } from '../shared/overlays';
import { getStyle } from '../shared/styles';
import { DEFAULT_TRANSITION } from '../shared/transitions';
import {
  getMe, giveConsent, Job, loadToken, mediaUrl, renderJob, setToken, setUnauthorizedHandler, uploadVideo, User, VideoItem, waitForJob,
} from './src/api';
import { Button, Loading } from './src/components';
import { useCaptionFonts } from './src/fonts';
import { AuthScreen } from './src/screens/AuthScreen';
import { ContactScreen } from './src/screens/ContactScreen';
import { EditorScreen, EditorSession } from './src/screens/EditorScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { HomeScreen, PickedVideo } from './src/screens/HomeScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { VideoScreen } from './src/screens/VideoScreen';
import { colors } from './src/theme';
import { ConsentModal } from './src/ui/ConsentModal';
import { GradientBackground } from './src/ui/GradientBackground';

type Step =
  | { name: 'home' }
  | { name: 'uploading'; progress: number }
  | { name: 'transcribing' }
  | { name: 'editor' }
  | { name: 'rendering'; progress: number }
  | { name: 'result'; videoUrl: string }
  | { name: 'profile' }
  | { name: 'video'; video: VideoItem }
  | { name: 'contact'; back: Step }
  | { name: 'editProfile' }
  | { name: 'error'; message: string; canReturn: boolean };

export default function App() {
  const [fontsLoaded] = useCaptionFonts();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [step, setStep] = useState<Step>({ name: 'home' });
  const [video, setVideo] = useState<PickedVideo | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [session, setSession] = useState<EditorSession | null>(null);
  const [pendingPick, setPendingPick] = useState<{ picked: PickedVideo; language: string } | null>(null);

  // Restore the saved session on launch.
  useEffect(() => {
    setUnauthorizedHandler(() => signOut());
    (async () => {
      try {
        if (await loadToken()) setUser((await getMe()).user);
      } catch {
        await setToken(null);
      } finally {
        setAuthChecked(true);
      }
    })();
  }, []);

  async function signIn(token: string, u: User) {
    await setToken(token);
    setUser(u);
    setStep({ name: 'home' });
  }

  async function signOut() {
    await setToken(null);
    setUser(null);
    setJob(null);
    setSession(null);
    setStep({ name: 'home' });
  }

  async function handlePicked(picked: PickedVideo, language: string, consented = user?.aiConsent) {
    // Ask once for permission to send audio to the AI transcription service.
    if (!consented) {
      setPendingPick({ picked, language });
      return;
    }
    setVideo(picked);
    setStep({ name: 'uploading', progress: 0 });
    try {
      const uploaded = await uploadVideo(picked.uri, picked.mimeType, language, (progress) =>
        setStep((s) => (s.name === 'uploading' ? { name: 'uploading', progress } : s)),
      );
      setStep({ name: 'transcribing' });
      const done = await waitForJob(uploaded.id, 'transcribing');
      setJob(done);
      setSession({
        phrases: buildPhrases(done.words),
        styleId: 'liquid-glass',
        overrides: {},
        trim: { start: 0, end: done.duration ?? 0 },
        overlays: [],
        transition: DEFAULT_TRANSITION,
      });
      setStep({ name: 'editor' });
    } catch (e: any) {
      setStep({ name: 'error', message: e?.message ?? String(e), canReturn: false });
    }
  }

  async function acceptConsent() {
    const pending = pendingPick;
    setPendingPick(null);
    try {
      setUser((await giveConsent()).user);
      if (pending) await handlePicked(pending.picked, pending.language, true);
    } catch (e: any) {
      Alert.alert('Xatolik', e?.message ?? String(e));
    }
  }

  async function handleExport() {
    if (!job || !session) return;
    if (session.overlays.some((o) => !o.src)) {
      Alert.alert('Biroz kuting', "Qo'shilgan media hali serverga yuklanmoqda.");
      return;
    }
    setStep({ name: 'rendering', progress: 0 });
    try {
      const style = resolveStyle(getStyle(session.styleId), session.overrides);
      const { trim } = session;
      await renderJob(job.id, {
        style,
        trim,
        phrases: shiftPhrasesForTrim(session.phrases, trim),
        overlays: shiftForTrim(session.overlays, trim).map(({ uri, ...o }) => o),
        transition: session.transition ?? DEFAULT_TRANSITION,
      });
      const done = await waitForJob(job.id, 'rendering', (j) => setStep({ name: 'rendering', progress: j.progress ?? 0 }));
      setStep({ name: 'result', videoUrl: mediaUrl(`${done.videoUrl}?t=${Date.now()}`) });
    } catch (e: any) {
      setStep({ name: 'error', message: e?.message ?? String(e), canReturn: true });
    }
  }

  const reset = () => {
    setJob(null);
    setSession(null);
    setStep({ name: 'home' });
  };

  const ready = fontsLoaded && authChecked;
  const intensity = !user || step.name === 'home' ? 1 : step.name === 'editor' || step.name === 'result' || step.name === 'video' ? 0.35 : 0.6;

  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        {/* Gradient backdrop; dimmer in the editor/result so the video stays the focus. */}
        <GradientBackground intensity={intensity} />
        <SafeAreaView style={styles.safe}>
          <StatusBar style="light" />
          {!ready && <ActivityIndicator color="#fff" style={{ flex: 1 }} />}
          {ready && !user && <AuthScreen onSignedIn={signIn} />}
          {ready && user && (
            <>
              {step.name === 'home' && <HomeScreen user={user} onPicked={(p, l) => handlePicked(p, l)} onProfile={() => setStep({ name: 'profile' })} />}
              {step.name === 'uploading' && <Loading title="Video yuklanmoqda…" subtitle={`${Math.round(step.progress * 100)}%`} />}
              {step.name === 'transcribing' && (
                <Loading title="Nutq matnga aylantirilmoqda…" subtitle="Video uzunligiga qarab bir necha soniya ketadi" />
              )}
              {step.name === 'editor' && job && video && session && (
                <EditorScreen job={job} videoUri={video.uri} session={session} setSession={setSession} onExport={handleExport} onBack={reset} />
              )}
              {step.name === 'rendering' && <Loading title="Video tayyorlanmoqda…" subtitle={`${Math.round(step.progress * 100)}%`} />}
              {step.name === 'result' && (
                <ResultScreen
                  videoUrl={step.videoUrl}
                  onEditAgain={() => setStep({ name: 'editor' })}
                  onNew={reset}
                  onProfile={() => setStep({ name: 'profile' })}
                />
              )}
              {step.name === 'profile' && (
                <ProfileScreen
                  user={user}
                  onBack={() => setStep({ name: 'home' })}
                  onOpenVideo={(v) => setStep({ name: 'video', video: v })}
                  onContact={() => setStep({ name: 'contact', back: { name: 'profile' } })}
                  onEdit={() => setStep({ name: 'editProfile' })}
                  onUserChange={setUser}
                  onSignOut={signOut}
                  onNewVideo={reset}
                />
              )}
              {step.name === 'video' && (
                <VideoScreen
                  video={step.video}
                  onBack={() => setStep({ name: 'profile' })}
                  onDeleted={() => setStep({ name: 'profile' })}
                  onNew={reset}
                />
              )}
              {step.name === 'contact' && <ContactScreen onBack={() => setStep(step.back)} />}
              {step.name === 'editProfile' && (
                <EditProfileScreen user={user} onBack={() => setStep({ name: 'profile' })} onUserChange={setUser} />
              )}
              {step.name === 'error' && (
                <View style={styles.error}>
                  <Text style={styles.errorTitle}>Xatolik</Text>
                  <Text style={styles.errorText}>{step.message}</Text>
                  {step.canReturn && <Button title="Muharrirga qaytish" onPress={() => setStep({ name: 'editor' })} />}
                  <Button title="Bosh sahifa" variant="secondary" onPress={reset} />
                </View>
              )}
              <ConsentModal visible={!!pendingPick} onAccept={acceptConsent} onCancel={() => setPendingPick(null)} />
            </>
          )}
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  error: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  errorTitle: { color: colors.danger, fontSize: 22, fontWeight: '800' },
  errorText: { color: colors.muted, fontSize: 15 },
});
