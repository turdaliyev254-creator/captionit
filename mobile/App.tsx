import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { buildPhrases, resolveStyle } from '../shared/captions';
import { getStyle } from '../shared/styles';
import { API_URL, Job, renderJob, uploadVideo, waitForJob } from './src/api';
import { Button, Loading } from './src/components';
import { useCaptionFonts } from './src/fonts';
import { EditorScreen, EditorSession } from './src/screens/EditorScreen';
import { HomeScreen, PickedVideo } from './src/screens/HomeScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { colors } from './src/theme';

type Step =
  | { name: 'home' }
  | { name: 'uploading'; progress: number }
  | { name: 'transcribing' }
  | { name: 'editor' }
  | { name: 'rendering'; progress: number }
  | { name: 'result'; videoUrl: string }
  | { name: 'error'; message: string; canReturn: boolean };

export default function App() {
  const [fontsLoaded] = useCaptionFonts();
  const [step, setStep] = useState<Step>({ name: 'home' });
  const [video, setVideo] = useState<PickedVideo | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [session, setSession] = useState<EditorSession | null>(null);

  async function handlePicked(picked: PickedVideo, language: string) {
    setVideo(picked);
    setStep({ name: 'uploading', progress: 0 });
    try {
      const uploaded = await uploadVideo(picked.uri, picked.mimeType, language, (progress) =>
        setStep((s) => (s.name === 'uploading' ? { name: 'uploading', progress } : s)),
      );
      setStep({ name: 'transcribing' });
      const done = await waitForJob(uploaded.id, 'transcribing');
      setJob(done);
      setSession({ phrases: buildPhrases(done.words), styleId: 'liquid-glass', overrides: {} });
      setStep({ name: 'editor' });
    } catch (e: any) {
      setStep({ name: 'error', message: e?.message ?? String(e), canReturn: false });
    }
  }

  async function handleExport() {
    if (!job || !session) return;
    setStep({ name: 'rendering', progress: 0 });
    try {
      const style = resolveStyle(getStyle(session.styleId), session.overrides);
      await renderJob(job.id, { phrases: session.phrases, style });
      const done = await waitForJob(job.id, 'rendering', (j) => setStep({ name: 'rendering', progress: j.progress ?? 0 }));
      setStep({ name: 'result', videoUrl: `${API_URL}${done.videoUrl}?t=${Date.now()}` });
    } catch (e: any) {
      setStep({ name: 'error', message: e?.message ?? String(e), canReturn: true });
    }
  }

  const reset = () => {
    setJob(null);
    setSession(null);
    setStep({ name: 'home' });
  };

  if (!fontsLoaded) return <View style={styles.root} />;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />
        {step.name === 'home' && <HomeScreen onPicked={handlePicked} />}
        {step.name === 'uploading' && <Loading title="Video yuklanmoqda…" subtitle={`${Math.round(step.progress * 100)}%`} />}
        {step.name === 'transcribing' && (
          <Loading title="Nutq matnga aylantirilmoqda…" subtitle="Video uzunligiga qarab bir necha soniya ketadi" />
        )}
        {step.name === 'editor' && job && video && session && (
          <EditorScreen job={job} videoUri={video.uri} session={session} onChange={setSession} onExport={handleExport} onBack={reset} />
        )}
        {step.name === 'rendering' && (
          <Loading title="Video tayyorlanmoqda…" subtitle={`${Math.round(step.progress * 100)}%`} />
        )}
        {step.name === 'result' && (
          <ResultScreen videoUrl={step.videoUrl} onEditAgain={() => setStep({ name: 'editor' })} onNew={reset} />
        )}
        {step.name === 'error' && (
          <View style={styles.error}>
            <Text style={styles.errorTitle}>Xatolik</Text>
            <Text style={styles.errorText}>{step.message}</Text>
            {step.canReturn && <Button title="Muharrirga qaytish" onPress={() => setStep({ name: 'editor' })} />}
            <Button title="Bosh sahifa" variant="secondary" onPress={reset} />
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  error: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
  errorTitle: { color: colors.danger, fontSize: 22, fontWeight: '800' },
  errorText: { color: colors.muted, fontSize: 15 },
});
