import {
  clearMutationQueue,
  drainMutationQueue,
  enqueueMutation,
  pendingMutationCount,
} from '@/lib/offlineMutationQueue';

jest.mock('@/lib/sentry', () => ({
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  setSentryUser: jest.fn(),
  initSentry: jest.fn(),
  reactNavigationIntegration: { registerNavigationContainer: jest.fn() },
  wrapRootComponent: jest.fn((c: unknown) => c),
}));

jest.mock('@/lib/queryClient', () => ({
  queryClient: { invalidateQueries: jest.fn(), clear: jest.fn() },
}));

jest.mock('@/services/http', () => ({
  http: { request: jest.fn(async () => ({ data: {} })) },
}));

import { http } from '@/services/http';
import { queryClient } from '@/lib/queryClient';

const httpRequest = http.request as jest.MockedFunction<typeof http.request>;

describe('offlineMutationQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearMutationQueue();
    httpRequest.mockResolvedValue({ data: {} });
  });

  it('enqueueMutation adds to queue and pendingMutationCount reflects it', () => {
    expect(pendingMutationCount()).toBe(0);
    enqueueMutation({ endpoint: '/api/x', method: 'post' });
    expect(pendingMutationCount()).toBe(1);
  });

  it('clearMutationQueue empties queue', () => {
    enqueueMutation({ endpoint: '/a', method: 'post' });
    enqueueMutation({ endpoint: '/b', method: 'put' });
    clearMutationQueue();
    expect(pendingMutationCount()).toBe(0);
  });

  it('drainMutationQueue processes and clears successful mutations', async () => {
    enqueueMutation({ endpoint: '/ok', method: 'post', data: { x: 1 } });
    const result = await drainMutationQueue();
    expect(result).toEqual({ succeeded: 1, failed: 0 });
    expect(httpRequest).toHaveBeenCalledWith({
      url: '/ok',
      method: 'post',
      data: { x: 1 },
    });
    expect(pendingMutationCount()).toBe(0);
  });

  it('drainMutationQueue retries on 5xx errors', async () => {
    const serverErr = Object.assign(new Error('Server'), { response: { status: 500 } });
    httpRequest.mockRejectedValueOnce(serverErr).mockResolvedValueOnce({ data: {} });

    enqueueMutation({ endpoint: '/flaky', method: 'post' });

    const first = await drainMutationQueue();
    expect(first).toEqual({ succeeded: 0, failed: 0 });
    expect(pendingMutationCount()).toBe(1);

    const second = await drainMutationQueue();
    expect(second.succeeded).toBe(1);
    expect(pendingMutationCount()).toBe(0);
  });

  it('drainMutationQueue drops on 4xx client errors', async () => {
    const clientErr = Object.assign(new Error('Bad'), { response: { status: 400 } });
    httpRequest.mockRejectedValue(clientErr);

    enqueueMutation({ endpoint: '/bad', method: 'post' });

    const result = await drainMutationQueue();
    expect(result).toEqual({ succeeded: 0, failed: 1 });
    expect(pendingMutationCount()).toBe(0);
  });

  it('invalidates query keys after successful drain', async () => {
    enqueueMutation({
      endpoint: '/x',
      method: 'patch',
      invalidateKeys: ['books'],
    });
    await drainMutationQueue();
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['books'] });
  });
});
