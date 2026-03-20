import type { ReactNode } from 'react';
import { createElement } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock http before importing the hook
// ---------------------------------------------------------------------------
vi.mock('@services', () => ({
  http: {
    get: vi.fn(),
  },
}));

import { http } from '@services';

import { usePaginatedQuery } from './usePaginatedQuery';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function makePage<T>(results: T[], next: string | null = null) {
  return { count: results.length, next, previous: null, results };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('usePaginatedQuery', () => {
  it('fetches the first page and returns results', async () => {
    const page1 = makePage([{ id: 1 }, { id: 2 }]);
    vi.mocked(http.get).mockResolvedValue({ data: page1 } as never);

    const qc = makeQueryClient();
    const { result } = renderHook(
      () => usePaginatedQuery<{ id: number }>(['items'], '/api/items'),
      { wrapper: makeWrapper(qc) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // queryFn builds `endpoint?page=1` (initialPageParam = 1)
    expect(http.get).toHaveBeenCalledWith(
      '/api/items?page=1',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result.current.data?.pages[0]?.results).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('appends extra params to the query string', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: makePage([]) } as never);

    const qc = makeQueryClient();
    const { result } = renderHook(
      () =>
        usePaginatedQuery<unknown>(['items', 'filtered'], '/api/items', {
          page_size: 20,
          category: 'heritage',
        }),
      { wrapper: makeWrapper(qc) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = vi.mocked(http.get).mock.calls[0]?.[0] as string;
    expect(calledUrl).toContain('page_size=20');
    expect(calledUrl).toContain('category=heritage');
    expect(calledUrl).toContain('page=1');
  });

  it('skips undefined param values', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: makePage([]) } as never);

    const qc = makeQueryClient();
    const { result } = renderHook(
      () =>
        usePaginatedQuery<unknown>(['items'], '/api/items', {
          category: undefined,
          page_size: 10,
        }),
      { wrapper: makeWrapper(qc) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = vi.mocked(http.get).mock.calls[0]?.[0] as string;
    expect(calledUrl).not.toContain('category');
    expect(calledUrl).toContain('page_size=10');
  });

  it('hasNextPage is true when `next` is set', async () => {
    const page1 = makePage([{ id: 1 }], 'https://api.example.com/items?page=2&page_size=10');
    vi.mocked(http.get).mockResolvedValue({ data: page1 } as never);

    const qc = makeQueryClient();
    const { result } = renderHook(
      () => usePaginatedQuery<{ id: number }>(['items-next'], '/api/items'),
      { wrapper: makeWrapper(qc) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(true);
  });

  it('hasNextPage is false when `next` is null', async () => {
    vi.mocked(http.get).mockResolvedValue({ data: makePage([{ id: 1 }], null) } as never);

    const qc = makeQueryClient();
    const { result } = renderHook(
      () => usePaginatedQuery<{ id: number }>(['items-nonext'], '/api/items'),
      { wrapper: makeWrapper(qc) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(false);
  });

  it('fetchNextPage requests page 2 using the page number from `next` URL', async () => {
    const page1 = makePage([{ id: 1 }], 'https://api.example.com/items?page=2');
    const page2 = makePage([{ id: 2 }], null);

    vi.mocked(http.get)
      .mockResolvedValueOnce({ data: page1 } as never)
      .mockResolvedValueOnce({ data: page2 } as never);

    const qc = makeQueryClient();
    const { result } = renderHook(
      () => usePaginatedQuery<{ id: number }>(['items-paged'], '/api/items'),
      { wrapper: makeWrapper(qc) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);

    await act(async () => {
      void result.current.fetchNextPage();
    });

    await waitFor(() => expect(vi.mocked(http.get)).toHaveBeenCalledTimes(2));

    const secondCallUrl = vi.mocked(http.get).mock.calls[1]?.[0] as string;
    expect(secondCallUrl).toContain('page=2');
  });

  it('handles a malformed `next` URL gracefully (returns undefined nextPage)', async () => {
    const pageWithBadNext = makePage([{ id: 1 }], 'not-a-valid-url');
    vi.mocked(http.get).mockResolvedValue({ data: pageWithBadNext } as never);

    const qc = makeQueryClient();
    const { result } = renderHook(
      () => usePaginatedQuery<{ id: number }>(['items-bad-next'], '/api/items'),
      { wrapper: makeWrapper(qc) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // getNextPageParam catches the URL parse error and returns undefined
    expect(result.current.hasNextPage).toBe(false);
  });
});
