import Constants from 'expo-constants';
import { File, UploadType } from 'expo-file-system';

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

// Native multipart upload streams the file from disk instead of loading it into JS memory.
export async function uploadVideo(
  uri: string,
  mimeType: string | undefined,
  language: string,
  onProgress?: (fraction: number) => void,
): Promise<Job> {
  const res = await new File(uri).upload(API_URL + '/jobs', {
    uploadType: UploadType.MULTIPART,
    fieldName: 'video',
    mimeType: mimeType ?? 'video/mp4',
    parameters: { language },
    onProgress: ({ bytesSent, totalBytes }) => totalBytes > 0 && onProgress?.(bytesSent / totalBytes),
  });
  const body = JSON.parse(res.body || '{}');
  if (res.status < 200 || res.status >= 300) throw new Error(body.error || `HTTP ${res.status}`);
  return body as Job;
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
