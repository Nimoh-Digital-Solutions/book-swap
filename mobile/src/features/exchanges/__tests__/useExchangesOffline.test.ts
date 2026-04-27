/**
 * AUD-M-102 — verifies that the four exchange-mutation hooks that were
 * previously bypassing the offline queue now enqueue their requests and
 * return an optimistic response when ``useNetworkStatus`` reports offline.
 *
 * The hooks under test:
 *  - useCounterExchange
 *  - useApproveCounter
 *  - useAcceptConditions
 *  - useConfirmSwap
 *
 * We mock the offline queue, the network-status hook and the toast layer,
 * then drive each hook with ``renderHook``/``act`` and assert the queue
 * received the right payload.
 */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react-native';

import { API } from '@/configs/apiEndpoints';
import {
  useAcceptConditions,
  useApproveCounter,
  useConfirmSwap,
  useCounterExchange,
} from '@/features/exchanges/hooks/useExchanges';

jest.mock('@/lib/offlineMutationQueue', () => ({
  enqueueMutation: jest.fn(),
}));

jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(() => ({ isOffline: true })),
}));

jest.mock('@/services/http', () => ({
  http: {
    get: jest.fn(),
    post: jest.fn(),
    request: jest.fn(),
  },
}));

jest.mock('@/components/Toast', () => ({
  showInfoToast: jest.fn(),
  showErrorToast: jest.fn(),
}));

jest.mock('@/features/exchanges/exchangeApi', () => ({
  acceptExchange: jest.fn(),
  completeExchange: jest.fn(),
  confirmSwap: jest.fn(),
  createExchange: jest.fn(),
  declineExchange: jest.fn(),
  requestReturn: jest.fn(),
}));

import { enqueueMutation } from '@/lib/offlineMutationQueue';
import { showInfoToast } from '@/components/Toast';
import { http } from '@/services/http';

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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useCounterExchange (AUD-M-102)', () => {
  it('queues the counter-offer when offline and skips the live request', async () => {
    const { result } = renderHook(() => useCounterExchange(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        exchangeId: 'ex-1',
        payload: {
          offered_book_id: 'b9',
          message: 'How about this one?',
        },
      });
    });

    expect(enqueue).toHaveBeenCalledWith({
      endpoint: API.exchanges.counter('ex-1'),
      method: 'post',
      data: { offered_book_id: 'b9', message: 'How about this one?' },
      invalidateKeys: ['exchanges'],
    });
    expect(httpPost).not.toHaveBeenCalled();
    expect(showInfoToast).toHaveBeenCalledWith('offline.queuedForSync');
  });
});

describe('useApproveCounter (AUD-M-102)', () => {
  it('queues approve-counter when offline', async () => {
    const { result } = renderHook(() => useApproveCounter(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync('ex-2');
    });

    expect(enqueue).toHaveBeenCalledWith({
      endpoint: API.exchanges.approveCounter('ex-2'),
      method: 'post',
      invalidateKeys: ['exchanges'],
    });
    expect(httpPost).not.toHaveBeenCalled();
  });
});

describe('useAcceptConditions (AUD-M-102)', () => {
  it('queues accept-conditions when offline', async () => {
    const { result } = renderHook(() => useAcceptConditions(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync('ex-3');
    });

    expect(enqueue).toHaveBeenCalledWith({
      endpoint: API.exchanges.acceptConditions('ex-3'),
      method: 'post',
      invalidateKeys: ['exchanges'],
    });
    expect(httpPost).not.toHaveBeenCalled();
  });
});

describe('useConfirmSwap (AUD-M-102)', () => {
  it('queues confirm-swap when offline and invalidates exchanges + myBooks', async () => {
    const { result } = renderHook(() => useConfirmSwap(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync('ex-4');
    });

    expect(enqueue).toHaveBeenCalledWith({
      endpoint: API.exchanges.confirmSwap('ex-4'),
      method: 'post',
      invalidateKeys: ['exchanges', 'myBooks'],
    });
    // The live confirmSwap api wrapper must NOT be called when queued
    const { confirmSwap } = jest.requireMock('@/features/exchanges/exchangeApi');
    expect(confirmSwap).not.toHaveBeenCalled();
  });
});
