import { HttpError } from '@nimoh-digital-solutions/tast-utils';
import { describe, expect, it, vi } from 'vitest';

import { queryClient } from './queryClient';

vi.mock('@configs', () => ({
  APP_CONFIG: { apiUrl: 'https://api.example.com', appName: 'Test App' },
}));

describe('queryClient', () => {
  it('is a QueryClient instance', () => {
    expect(queryClient).toBeDefined();
    expect(typeof queryClient.getQueryData).toBe('function');
    expect(typeof queryClient.invalidateQueries).toBe('function');
  });

  it('has default query options configured', () => {
    const defaults = queryClient.getDefaultOptions();

    expect(defaults.queries?.staleTime).toBe(5 * 60 * 1000);
    expect(defaults.queries?.gcTime).toBe(10 * 60 * 1000);
    expect(defaults.queries?.refetchOnWindowFocus).toBe(true);
    expect(defaults.queries?.refetchOnReconnect).toBe(true);
  });

  it('disables retry for mutations by default', () => {
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.mutations?.retry).toBe(false);
  });

  it('uses smart retry logic for queries', () => {
    const defaults = queryClient.getDefaultOptions();
    // retry is a function (not a boolean or number)
    expect(typeof defaults.queries?.retry).toBe('function');
  });

  describe('shouldRetry logic', () => {
    function getRetry(): (failureCount: number, error: unknown) => boolean {
      return queryClient.getDefaultOptions().queries!.retry as (
        failureCount: number,
        error: unknown,
      ) => boolean;
    }

    it('never retries 4xx HttpErrors — they will not self-resolve', () => {
      const retry = getRetry();
      expect(retry(0, new HttpError(400, 'Bad Request'))).toBe(false);
      expect(retry(0, new HttpError(401, 'Unauthorized'))).toBe(false);
      expect(retry(0, new HttpError(403, 'Forbidden'))).toBe(false);
      expect(retry(0, new HttpError(404, 'Not Found'))).toBe(false);
      expect(retry(0, new HttpError(422, 'Unprocessable'))).toBe(false);
    });

    it('retries 5xx HttpErrors — transient server failures', () => {
      const retry = getRetry();
      expect(retry(0, new HttpError(500, 'Internal'))).toBe(true);
      expect(retry(0, new HttpError(502, 'Bad Gateway'))).toBe(true);
      expect(retry(0, new HttpError(503, 'Service Unavailable'))).toBe(true);
    });

    it('retries non-HttpError errors (network / timeout failures)', () => {
      const retry = getRetry();
      expect(retry(0, new Error('Network failure'))).toBe(true);
      expect(retry(1, new TypeError('fetch failed'))).toBe(true);
    });

    it('stops retrying once failureCount reaches maxRetries (3)', () => {
      const retry = getRetry();
      // failure count starts at 0 for first attempt; 3 means 3 retries already done
      expect(retry(3, new Error('Network'))).toBe(false);
      expect(retry(4, new HttpError(500, 'Error'))).toBe(false);
    });

    it('still retries below maxRetries for server errors', () => {
      const retry = getRetry();
      expect(retry(2, new HttpError(503, 'Unavailable'))).toBe(true);
      expect(retry(2, new Error('timeout'))).toBe(true);
    });
  });
});
