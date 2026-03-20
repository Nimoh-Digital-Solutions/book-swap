import type { ReactNode } from 'react';
import { createElement } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mock http before importing the hook (avoids circular deps + network calls)
// ---------------------------------------------------------------------------
vi.mock('@services', () => ({
  http: {
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { http } from '@services';

import { useApiMutation } from './useApiMutation';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { mutations: { retry: false } },
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

describe('useApiMutation', () => {
  it('calls http.post by default (no method argument)', async () => {
    vi.mocked(http.post).mockResolvedValue({ data: { id: 1 } } as never);

    const qc = makeQueryClient();
    const { result } = renderHook(
      () => useApiMutation<{ id: number }, { name: string }>('/api/items'),
      { wrapper: makeWrapper(qc) },
    );

    await act(async () => {
      result.current.mutate({ name: 'Alice' });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(http.post).toHaveBeenCalledWith('/api/items', { name: 'Alice' });
    expect(result.current.data).toEqual({ id: 1 });
  });

  it('calls http.put when method is PUT', async () => {
    vi.mocked(http.put).mockResolvedValue({ data: { id: 2 } } as never);

    const qc = makeQueryClient();
    const { result } = renderHook(
      () => useApiMutation<{ id: number }, { name: string }>('/api/items/2', 'PUT'),
      { wrapper: makeWrapper(qc) },
    );

    await act(async () => {
      result.current.mutate({ name: 'Bob' });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(http.put).toHaveBeenCalledWith('/api/items/2', { name: 'Bob' });
  });

  it('calls http.patch when method is PATCH', async () => {
    vi.mocked(http.patch).mockResolvedValue({ data: { id: 3 } } as never);

    const qc = makeQueryClient();
    const { result } = renderHook(
      () => useApiMutation<{ id: number }, { name: string }>('/api/items/3', 'PATCH'),
      { wrapper: makeWrapper(qc) },
    );

    await act(async () => {
      result.current.mutate({ name: 'Carol' });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(http.patch).toHaveBeenCalledWith('/api/items/3', { name: 'Carol' });
  });

  it('calls http.delete when method is DELETE (no body)', async () => {
    vi.mocked(http.delete).mockResolvedValue({ data: null } as never);

    const qc = makeQueryClient();
    const { result } = renderHook(
      () => useApiMutation<null, void>('/api/items/4', 'DELETE'),
      { wrapper: makeWrapper(qc) },
    );

    await act(async () => {
      result.current.mutate(undefined);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(http.delete).toHaveBeenCalledWith('/api/items/4');
  });

  it('exposes isError and error when the request fails', async () => {
    vi.mocked(http.post).mockRejectedValue(new Error('Server error'));

    const qc = makeQueryClient();
    const { result } = renderHook(
      () => useApiMutation<unknown, unknown>('/api/fail'),
      { wrapper: makeWrapper(qc) },
    );

    await act(async () => {
      result.current.mutate({});
    });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('forwards extra UseMutationOptions to useMutation', async () => {
    const onSuccess = vi.fn();
    vi.mocked(http.post).mockResolvedValue({ data: 'ok' } as never);

    const qc = makeQueryClient();
    const { result } = renderHook(
      () =>
        useApiMutation<string, { name: string }>('/api/items', 'POST', {
          onSuccess,
        }),
      { wrapper: makeWrapper(qc) },
    );

    await act(async () => {
      result.current.mutate({ name: 'Dave' });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(onSuccess).toHaveBeenCalledWith('ok', { name: 'Dave' }, undefined, expect.anything());
  });
});
