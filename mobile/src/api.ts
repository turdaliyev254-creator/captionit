import Constants from 'expo-constants';
import { File, UploadType } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
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
  title?: string;
  progress?: number;
  videoUrl?: string;
  error?: string | null;
};
export type User = { id: string; phone: string | null; email: string | null; name: string | null; aiConsent: boolean; createdAt: number };
export type VideoItem = { id: string; title: string; duration: number; createdAt: number; width: number; height: number; videoUrl: string; thumbUrl: string };

const PRODUCTION_API = 'https://backend-production-fc51.up.railway.app';

// Production server by default. EXPO_PUBLIC_API_URL=local uses a backend running next to the
// Expo dev server (port 4000); any other value is used as the URL itself.
function resolveBaseUrl() {
  const env = process.env.EXPO_PUBLIC_API_URL;
  if (env === 'local') {
    const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
    return `http://${host}:4000`;
  }
  return env || PRODUCTION_API;
}

export const API_URL = resolveBaseUrl();

// ---------- session token ----------

const TOKEN_KEY = 'captionit.token';
let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export async function loadToken() {
  token = await SecureStore.getItemAsync(TOKEN_KEY);
  return token;
}
export async function setToken(value: string | null) {
  token = value;
  if (value) await SecureStore.setItemAsync(TOKEN_KEY, value);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}
export const setUnauthorizedHandler = (fn: () => void) => (onUnauthorized = fn);

const authHeaders = (): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {});

// Media URLs for players/images, which can't send headers.
export const mediaUrl = (path: string) => `${API_URL}${path}${path.includes('?') ? '&' : '?'}token=${encodeURIComponent(token ?? '')}`;

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(API_URL + path, { ...init, headers: { ...authHeaders(), ...(init.headers as Record<string, string>) } });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401 && token) onUnauthorized?.();
  if (!res.ok) throw new ApiError(body.error || `HTTP ${res.status}`, res.status, body.code);
  return body as T;
}

const json = (method: string, data?: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: data === undefined ? undefined : JSON.stringify(data),
});

// ---------- auth & profile ----------

type Session = { token: string; user: User };

export const startOtp = (phone: string) => request<{ phone: string; devCode?: string }>('/auth/otp/start', json('POST', { phone }));
export const verifyOtp = (phone: string, code: string) => request<Session>('/auth/otp/verify', json('POST', { phone, code }));
export const signInApple = (identityToken: string, fullName?: string) => request<Session>('/auth/apple', json('POST', { identityToken, fullName }));
export const signInGoogle = (idToken: string) => request<Session>('/auth/google', json('POST', { idToken }));

export const getMe = () => request<{ user: User; videos: number }>('/me');
export const updateName = (name: string) => request<{ user: User }>('/me', json('PATCH', { name }));
export const giveConsent = () => request<{ user: User }>('/me/consent', json('POST'));
export const deleteAccount = () => request<{ ok: true }>('/me', json('DELETE'));
export const listVideos = () => request<{ videos: VideoItem[] }>('/me/videos');
export const deleteVideo = (id: string) => request<{ ok: true }>(`/jobs/${id}`, json('DELETE'));

// ---------- jobs ----------

async function upload(path: string, uri: string, fieldName: string, mimeType: string, parameters?: Record<string, string>, onProgress?: (f: number) => void) {
  const res = await new File(uri).upload(API_URL + path, {
    uploadType: UploadType.MULTIPART,
    fieldName,
    mimeType,
    parameters,
    headers: authHeaders(),
    onProgress: ({ bytesSent, totalBytes }) => totalBytes > 0 && onProgress?.(bytesSent / totalBytes),
  });
  let body: any = {};
  try {
    body = JSON.parse(res.body || '{}');
  } catch {}
  if (res.status === 401 && token) onUnauthorized?.();
  if (res.status < 200 || res.status >= 300) throw new ApiError(body.error || `Server xatosi (HTTP ${res.status})`, res.status, body.code);
  return body;
}

// Native multipart upload streams the file from disk instead of loading it into JS memory.
export function uploadVideo(uri: string, mimeType: string | undefined, language: string, onProgress?: (fraction: number) => void): Promise<Job> {
  return upload('/jobs', uri, 'video', mimeType ?? 'video/mp4', { language }, onProgress);
}

// Uploads an image/clip used as an overlay; returns its backend path.
export async function uploadAsset(jobId: string, uri: string, mimeType?: string): Promise<string> {
  const body = await upload(`/jobs/${jobId}/assets`, uri, 'file', mimeType ?? 'application/octet-stream');
  if (!body.src) throw new ApiError('Media yuklanmadi', 500);
  return body.src;
}

export const getJob = (id: string) => request<Job>(`/jobs/${id}`);

// phrases/overlays must already be on the trimmed timeline (see shared/overlays shiftForTrim).
export function renderJob(id: string, opts: { phrases: Phrase[]; style: CaptionStyle; trim: Trim; overlays: Overlay[] }) {
  return request<Job>(`/jobs/${id}/render`, json('POST', opts));
}

// Polls until the job leaves the given in-progress status.
export async function waitForJob(id: string, whileStatus: JobStatus, onUpdate?: (job: Job) => void, intervalMs = 1000): Promise<Job> {
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
