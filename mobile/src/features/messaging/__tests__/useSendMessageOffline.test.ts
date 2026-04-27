/**
 * AUD-M-103 — verifies that ``useSendMessage`` queues image-bearing
 * messages (not only text-only) when the device is offline. The optimistic
 * Message returned by the hook should also surface the local image URI so
 * the chat UI can render it instantly.
 */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react-native';

import { API } from '@/configs/apiEndpoints';

jest.mock('@/services/http', () => ({
  http: { post: jest.fn(), get: jest.fn() },
}));
jest.mock('@/components/Toast', () => ({ showInfoToast: jest.fn() }));
jest.mock('@/lib/offlineMutationQueue', () => ({
  enqueueMutation: jest.fn(),
}));
jest.mock('@/lib/resolveMediaUrl', () => ({
  resolveMediaUrl: jest.fn((url: string) => url),
}));
jest.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(
    jest.fn((sel: (s: any) => any) =>
      sel({ user: { id: 'u1', username: 'me' } }),
    ),
    { getState: jest.fn(), setState: jest.fn(), subscribe: jest.fn() },
  ),
}));
jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(() => ({ isOffline: true })),
}));

import { enqueueMutation } from '@/lib/offlineMutationQueue';
import { http } from '@/services/http';
import { useSendMessage } from '@/features/messaging/hooks/useMessages';

const enqueue = enqueueMutation as jest.MockedFunction<typeof enqueueMutation>;
const httpPost = http.post as jest.MockedFunction<typeof http.post>;

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => jest.clearAllMocks());

describe('useSendMessage offline image branch (AUD-M-103)', () => {
  it('queues an image-only message with the right attachment descriptor', async () => {
    const { result } = renderHook(() => useSendMessage(), {
      wrapper: makeWrapper(),
    });

    let optimistic: any;
    await act(async () => {
      optimistic = await result.current.mutateAsync({
        exchangeId: 'ex-1',
        imageUri: 'file:///tmp/photo.jpg',
      });
    });

    expect(httpPost).not.toHaveBeenCalled();
    expect(enqueue).toHaveBeenCalledTimes(1);

    const arg = enqueue.mock.calls[0]?.[0];
    expect(arg).toMatchObject({
      endpoint: API.messaging.messages('ex-1'),
      method: 'post',
      // No content was passed → no data field
      data: undefined,
      attachments: [
        {
          field: 'image',
          uri: 'file:///tmp/photo.jpg',
          filename: 'photo.jpg',
          mimeType: 'image/jpeg',
        },
      ],
      invalidateKeys: ['messages'],
    });

    // Optimistic UI must surface the local image so the chat doesn't show
    // a blank bubble while the queue waits for connectivity.
    expect(optimistic.image).toBe('file:///tmp/photo.jpg');
  });

  it('queues a caption + image message together', async () => {
    const { result } = renderHook(() => useSendMessage(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        exchangeId: 'ex-2',
        content: 'See you there',
        imageUri: 'file:///tmp/cover.png',
      });
    });

    const arg = enqueue.mock.calls[0]?.[0];
    expect(arg.data).toEqual({ content: 'See you there' });
    expect(arg.attachments?.[0]).toEqual({
      field: 'image',
      uri: 'file:///tmp/cover.png',
      filename: 'cover.png',
      mimeType: 'image/png',
    });
  });
});
