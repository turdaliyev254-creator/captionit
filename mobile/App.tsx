import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { API_URL, Job, Position, renderJob, uploadVideo, waitForJob, Word } from './src/api';
import { Button, Loading } from './src/components';
import { HomeScreen, PickedVideo } from './src/screens/HomeScreen';
import { EditorScreen } from './src/screens/EditorScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { colors } from './src/theme';

type Step =
  | { name: 'home' }
  | { name: 'transcribing' }
  | { name: 'editor'; job: Job }
  | { name: 'rendering'; job: Job }
  | { name: 'result'; job: Job; videoUrl: string }
  | { name: 'error'; message: string };

export default function App() {
  const [step, setStep] = useState<Step>({ name: 'home' });
  const [video, setVideo] = useState<PickedVideo | null>(null);

  async function handlePicked(picked: PickedVideo, language: string) {
    setVideo(picked);
    setStep({ name: 'transcribing' });
    try {
      const job = await uploadVideo(picked.uri, picked.mimeType, language);
      setStep({ name: 'editor', job: await waitForJob(job.id, 'transcribing') });
    } catch (e: any) {
      setStep({ name: 'error', message: e?.message ?? String(e) });
    }
  }

  async function handleRender(job: Job, opts: { style: string; position: Position; words: Word[] }) {
    const edited = { ...job, words: opts.words };
    setStep({ name: 'rendering', job: edited });
    try {
      await renderJob(job.id, opts);
      const done = await waitForJob(job.id, 'rendering');
      setStep({ name: 'result', job: done, videoUrl: `${API_URL}${done.videoUrl}?t=${Date.now()}` });
    } catch (e: any) {
      setStep({ name: 'error', message: e?.message ?? String(e) });
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar style="light" />
        {step.name === 'home' && <HomeScreen onPicked={handlePicked} />}
        {step.name === 'transcribing' && (
          <Loading title="Nutq matnga aylantirilmoqda…" subtitle="Video uzunligiga qarab bir necha soniya ketadi" />
        )}
        {step.name === 'editor' && video && (
          <EditorScreen
            job={step.job}
            videoUri={video.uri}
            onBack={() => setStep({ name: 'home' })}
            onRender={(opts) => handleRender(step.job, opts)}
          />
        )}
        {step.name === 'rendering' && <Loading title="Subtitrlar videoga qo'shilmoqda…" />}
        {step.name === 'result' && (
          <ResultScreen
            videoUrl={step.videoUrl}
            onEditAgain={() => setStep({ name: 'editor', job: step.job })}
            onNew={() => setStep({ name: 'home' })}
          />
        )}
        {step.name === 'error' && (
          <View style={styles.error}>
            <Text style={styles.errorTitle}>Xatolik</Text>
            <Text style={styles.errorText}>{step.message}</Text>
            <Button title="Bosh sahifa" onPress={() => setStep({ name: 'home' })} />
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
