import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addBreadcrumb, captureException } from '@/lib/sentry';
import { queryClient } from './queryClient';

const STORAGE_KEY = 'bookswap-mutation-queue';

let mmkv: import('react-native-mmkv').MMKV | null = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MMKV } = require('react-native-mmkv');
    mmkv = new MMKV({ id: 'bookswap-mutation-queue' });
  } catch {
    // Expo Go fallback — will use AsyncStorage
  }
}

let _asyncCache: string | null = null;
let _asyncCacheLoaded = false;

function readRaw(): string | null {
  if (mmkv) return mmkv.getString(STORAGE_KEY) ?? null;
  if (Platform.OS === 'web') return localStorage.getItem(STORAGE_KEY);
  return _asyncCache;
}

function writeRaw(value: string) {
  if (mmkv) {
    mmkv.set(STORAGE_KEY, value);
  } else if (Platform.OS === 'web') {
    localStorage.setItem(STORAGE_KEY, value);
  } else {
    _asyncCache = value;
    AsyncStorage.setItem(STORAGE_KEY, value).catch(() => {});
  }
}

export async function hydrateOfflineQueue(): Promise<void> {
  if (mmkv || Platform.OS === 'web' || _asyncCacheLoaded) return;
  try {
    _asyncCache = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    _asyncCache = null;
  }
  _asyncCacheLoaded = true;
}

/**
 * AUD-M-103: minimal image-attachment descriptor so multipart sends can be
 * queued. We only persist the local file URI + filename + mime; the actual
 * FormData is reconstructed at drain time. This keeps the queue payload
 * JSON-serialisable and avoids re-encoding bytes into AsyncStorage / MMKV.
 *
 * Note: the local URI must still be valid when the queue drains. For the
 * camera roll on iOS/Android this is true within the same install — once
 * the user reinstalls the app the URI is invalid; we accept that trade-off
 * because the queue is also subject to ``MAX_AGE_MS`` (24h) anyway.
 */
export interface QueuedImageAttachment {
  field: string;          // form field name (e.g. 'image')
  uri: string;            // local file:// URI
  filename: string;
  mimeType: string;
}

export interface QueuedMutation {
  id: string;
  endpoint: string;
  method: 'post' | 'put' | 'patch' | 'delete';
  data?: unknown;
  /** Optional list of image attachments — when set, the request is sent as multipart/form-data. */
  attachments?: QueuedImageAttachment[];
  invalidateKeys?: string[];
  createdAt: number;
  retries: number;
}

const MAX_RETRIES = 3;
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function loadQueue(): QueuedMutation[] {
  try {
    const raw = readRaw();
    if (!raw) return [];
    const parsed: QueuedMutation[] = JSON.parse(raw);
    const now = Date.now();
    return parsed.filter((m) => now - m.createdAt < MAX_AGE_MS);
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedMutation[]) {
  writeRaw(JSON.stringify(queue));
}

export function enqueueMutation(mutation: Omit<QueuedMutation, 'id' | 'createdAt' | 'retries'>) {
  const queue = loadQueue();
  const entry: QueuedMutation = {
    ...mutation,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    retries: 0,
  };
  queue.push(entry);
  saveQueue(queue);
  addBreadcrumb('offline-queue', `Enqueued ${mutation.method} ${mutation.endpoint}`, {
    queueSize: queue.length,
  });
}

export async function drainMutationQueue(): Promise<{ succeeded: number; failed: number; failedKeys: string[] }> {
  const queue = loadQueue();
  if (queue.length === 0) return { succeeded: 0, failed: 0, failedKeys: [] };

  addBreadcrumb('offline-queue', `Draining ${queue.length} queued mutations`);

  const { http } = await import('@/services/http');
  const remaining: QueuedMutation[] = [];
  let succeeded = 0;
  let failed = 0;
  const failedKeys: string[] = [];

  for (const mutation of queue) {
    try {
      if (mutation.attachments?.length) {
        // AUD-M-103: rebuild FormData from the persisted descriptor.
        // We append the regular ``data`` fields first, then each image
        // as { uri, name, type } — the same shape the live send hooks use.
        const form = new FormData();
        if (mutation.data && typeof mutation.data === 'object') {
          for (const [key, value] of Object.entries(
            mutation.data as Record<string, unknown>,
          )) {
            if (value === undefined || value === null) continue;
            form.append(key, String(value));
          }
        }
        for (const a of mutation.attachments) {
          form.append(
            a.field,
            { uri: a.uri, name: a.filename, type: a.mimeType } as unknown as Blob,
          );
        }
        await http.request({
          url: mutation.endpoint,
          method: mutation.method,
          data: form,
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await http.request({
          url: mutation.endpoint,
          method: mutation.method,
          data: mutation.data,
        });
      }
      succeeded++;

      if (mutation.invalidateKeys?.length) {
        for (const key of mutation.invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: [key] });
        }
      }
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status && status >= 400 && status < 500 && status !== 429) {
        failed++;
        if (mutation.invalidateKeys) failedKeys.push(...mutation.invalidateKeys);
        addBreadcrumb('offline-queue', `Dropped mutation (${status}): ${mutation.method} ${mutation.endpoint}`);
      } else {
        mutation.retries++;
        if (mutation.retries < MAX_RETRIES) {
          remaining.push(mutation);
        } else {
          failed++;
          if (mutation.invalidateKeys) failedKeys.push(...mutation.invalidateKeys);
          captureException(error, { offlineMutation: mutation.endpoint });
        }
      }
    }
  }

  saveQueue(remaining);

  for (const key of new Set(failedKeys)) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }

  addBreadcrumb('offline-queue', `Drain complete: ${succeeded} ok, ${failed} dropped, ${remaining.length} retry later`);
  return { succeeded, failed, failedKeys };
}

export function pendingMutationCount(): number {
  return loadQueue().length;
}

export function clearMutationQueue() {
  saveQueue([]);
}
