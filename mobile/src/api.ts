import Constants from 'expo-constants';
import { File, UploadType } from 'expo-file-system';
import type { CaptionStyle, Phrase, Word } from '../../shared/captions';
import type { Overlay, Trim } from '../../shared/overlays';

export type JobStatus = 'transcribing' | 'transcribed' | 'rendering' | 'done' | 'error';
export type Job = {
  id: string;
  status: JobStatus;
  words: Word[];
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  text?: string;
  progress?: number;
  videoUrl?: string;
  error?: string | null;
};

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
  let body: any = {};
  try {
    body = JSON.parse(res.body || '{}');
  } catch {}
  if (res.status < 200 || res.status >= 300) throw new Error(body.error || `Server xatosi (HTTP ${res.status})`);
  return body as Job;
}

export const getJob = (id: string) => request<Job>(`/jobs/${id}`);

// Uploads an image/clip used as an overlay; returns its backend path.
export async function uploadAsset(jobId: string, uri: string, mimeType?: string): Promise<string> {
  const res = await new File(uri).upload(`${API_URL}/jobs/${jobId}/assets`, {
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType: mimeType ?? 'application/octet-stream',
  });
  let body: any = {};
  try {
    body = JSON.parse(res.body || '{}');
  } catch {}
  if (res.status < 200 || res.status >= 300 || !body.src) throw new Error(body.error || `Media yuklanmadi (HTTP ${res.status})`);
  return body.src;
}

// phrases/overlays must already be on the trimmed timeline (see shared/overlays shiftForTrim).
export function renderJob(id: string, opts: { phrases: Phrase[]; style: CaptionStyle; trim: Trim; overlays: Overlay[] }) {
  return request<Job>(`/jobs/${id}/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  });
}

// Polls until the job leaves the given in-progress status.
export async function waitForJob(
  id: string,
  whileStatus: JobStatus,
  onUpdate?: (job: Job) => void,
  intervalMs = 1000,
): Promise<Job> {
  for (;;) {
    const job = await getJob(id);
    if (job.status !== whileStatus) {
      if (job.status === 'error') throw new Error(job.error || 'Xatolik yuz berdi');
      return job;
    }
    onUpdate?.(job);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
