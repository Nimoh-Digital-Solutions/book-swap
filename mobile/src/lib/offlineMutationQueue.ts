import { Platform } from 'react-native';
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
    // Expo Go fallback
  }
}

function readRaw(): string | null {
  if (mmkv) return mmkv.getString(STORAGE_KEY) ?? null;
  if (Platform.OS === 'web') return localStorage.getItem(STORAGE_KEY);
  return null;
}

function writeRaw(value: string) {
  if (mmkv) {
    mmkv.set(STORAGE_KEY, value);
  } else if (Platform.OS === 'web') {
    localStorage.setItem(STORAGE_KEY, value);
  }
}

export interface QueuedMutation {
  id: string;
  endpoint: string;
  method: 'post' | 'put' | 'patch' | 'delete';
  data?: unknown;
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

export async function drainMutationQueue(): Promise<{ succeeded: number; failed: number }> {
  const queue = loadQueue();
  if (queue.length === 0) return { succeeded: 0, failed: 0 };

  addBreadcrumb('offline-queue', `Draining ${queue.length} queued mutations`);

  const { http } = await import('@/services/http');
  const remaining: QueuedMutation[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const mutation of queue) {
    try {
      await http.request({
        url: mutation.endpoint,
        method: mutation.method,
        data: mutation.data,
      });
      succeeded++;

      if (mutation.invalidateKeys?.length) {
        for (const key of mutation.invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: [key] });
        }
      }
    } catch (error: any) {
      const status = error?.response?.status;
      if (status && status >= 400 && status < 500 && status !== 429) {
        failed++;
        addBreadcrumb('offline-queue', `Dropped mutation (${status}): ${mutation.method} ${mutation.endpoint}`);
      } else {
        mutation.retries++;
        if (mutation.retries < MAX_RETRIES) {
          remaining.push(mutation);
        } else {
          failed++;
          captureException(error, { offlineMutation: mutation.endpoint });
        }
      }
    }
  }

  saveQueue(remaining);
  addBreadcrumb('offline-queue', `Drain complete: ${succeeded} ok, ${failed} dropped, ${remaining.length} retry later`);
  return { succeeded, failed };
}

export function pendingMutationCount(): number {
  return loadQueue().length;
}

export function clearMutationQueue() {
  saveQueue([]);
}
