import type { ReactNode } from 'react';
import { createElement } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock http before importing the hook (avoids network calls)
// ---------------------------------------------------------------------------
vi.mock('@services', () => ({
  http: {
    get: vi.fn(),
  },
}));

import { http } from '@services';

import { useApiQuery } from './useApiQuery';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQueryClient(): QueryClient {
  // Disable retries in tests for immediate error surfacing
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useApiQuery', () => {
  it('calls http.get with the given endpoint and passes the AbortSignal', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: [{ id: 1 }] } as never);

    const qc = makeQueryClient();
    const { result } = renderHook(
      () => useApiQuery<{ id: number }[]>(['items'], '/api/items'),
      { wrapper: makeWrapper(qc) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(http.get).toHaveBeenCalledWith(
      '/api/items',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result.current.data).toEqual([{ id: 1 }]);
  });

  it('starts in a loading state before the request resolves', () => {
    let resolve!: (value: unknown) => void;
    vi.mocked(http.get).mockReturnValue(
      new Promise(r => {
        resolve = r;
      }) as never,
    );

    const qc = makeQueryClient();
    const { result } = renderHook(
      () => useApiQuery(['loading'], '/api/slow'),
      { wrapper: makeWrapper(qc) },
    );

    // Before resolution the query should be in a pending / loading state
    expect(result.current.isLoading || result.current.isPending).toBe(true);

    // Resolve so the test doesn't leave a hanging promise
    resolve({ data: [] });
  });

  it('surfaces an error when http.get rejects', async () => {
    vi.mocked(http.get).mockRejectedValue(new Error('Network failure'));

    const qc = makeQueryClient();
    const { result } = renderHook(
      () => useApiQuery(['error'], '/api/fail'),
      { wrapper: makeWrapper(qc) },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('respects UseQueryOptions overrides (e.g. enabled: false)', () => {
    vi.mocked(http.get).mockResolvedValue({ data: [] } as never);

    const qc = makeQueryClient();
    const { result } = renderHook(
      () => useApiQuery(['disabled'], '/api/items', { enabled: false }),
      { wrapper: makeWrapper(qc) },
    );

    // When enabled is false the query should not fire
    expect(http.get).not.toHaveBeenCalled();
    expect(result.current.isFetching).toBe(false);
  });
});
