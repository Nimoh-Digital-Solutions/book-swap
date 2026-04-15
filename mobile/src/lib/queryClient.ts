import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { syncQueryStorage, asyncQueryStorage, usesMmkv } from '@/lib/storage';

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 401 || status === 403 || status === 429) return false;
  return true;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      staleTime: 2 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
    },
    mutations: { retry: 0 },
  },
});

export const queryPersister = usesMmkv
  ? createSyncStoragePersister({ storage: syncQueryStorage!, key: 'bookswap-rq-cache' })
  : createAsyncStoragePersister({ storage: asyncQueryStorage, key: 'bookswap-rq-cache' });

export const CACHE_BUSTER = 'v1';
