import Constants from 'expo-constants';

export type Word = { word: string; start: number; end: number };
export type JobStatus = 'transcribing' | 'transcribed' | 'rendering' | 'done' | 'error';
export type Job = {
  id: string;
  status: JobStatus;
  words: Word[];
  width?: number;
  height?: number;
  duration?: number;
  text?: string;
  videoUrl?: string;
  error?: string | null;
};
export type CaptionStyle = { id: string; label: string; primary: string; highlight: string };
export type Position = 'top' | 'middle' | 'bottom';

// In development the backend runs on the same machine as the Expo dev server.
function resolveBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
  return `http://${host}:4000`;
}

export const API_URL = resolveBaseUrl();

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API_URL + path, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body as T;
}

export function uploadVideo(uri: string, mimeType: string | undefined, language: string) {
  const form = new FormData();
  const ext = mimeType?.split('/')[1] ?? 'mp4';
  form.append('video', { uri, name: `video.${ext === 'quicktime' ? 'mov' : ext}`, type: mimeType ?? 'video/mp4' } as any);
  form.append('language', language);
  return request<Job>('/jobs', { method: 'POST', body: form });
}

export const getJob = (id: string) => request<Job>(`/jobs/${id}`);

export const getStyles = () => request<CaptionStyle[]>('/styles');

export function renderJob(id: string, opts: { style: string; position: Position; words: Word[] }) {
  return request<Job>(`/jobs/${id}/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
}

// Polls until the job leaves the given in-progress status.
export async function waitForJob(id: string, whileStatus: JobStatus, intervalMs = 1500): Promise<Job> {
  for (;;) {
    const job = await getJob(id);
    if (job.status !== whileStatus) {
      if (job.status === 'error') throw new Error(job.error || 'Xatolik yuz berdi');
      return job;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
