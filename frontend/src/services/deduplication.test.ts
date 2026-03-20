import { describe, expect, it, vi } from 'vitest';

// Mock the HTTP client
vi.mock('@services', () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    addRequestInterceptor: vi.fn(),
    addResponseInterceptor: vi.fn(),
    addErrorInterceptor: vi.fn(),
  },
}));

// Mock the logger
vi.mock('@utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { http } from '@services';

import { withDeduplication } from './deduplication';

describe('withDeduplication', () => {
  it('returns a client with the same interface', () => {
    const deduped = withDeduplication(http);
    expect(typeof deduped.get).toBe('function');
    expect(typeof deduped.post).toBe('function');
    expect(typeof deduped.put).toBe('function');
    expect(typeof deduped.patch).toBe('function');
    expect(typeof deduped.delete).toBe('function');
  });

  it('deduplicates concurrent identical GET requests', async () => {
    const mockResponse = { data: { id: 1 }, status: 200 };
    vi.mocked(http.get).mockResolvedValueOnce(mockResponse as never);

    const deduped = withDeduplication(http);

    // Fire two identical requests simultaneously
    const [result1, result2] = await Promise.all([
      deduped.get('/users'),
      deduped.get('/users'),
    ]);

    // Both return the same data
    expect(result1).toEqual(mockResponse);
    expect(result2).toEqual(mockResponse);

    // But only one network call was made
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('allows separate requests after the first resolves', async () => {
    vi.mocked(http.get)
      .mockResolvedValueOnce({ data: 'first', status: 200 } as never)
      .mockResolvedValueOnce({ data: 'second', status: 200 } as never);

    const deduped = withDeduplication(http);

    const first = await deduped.get('/users');
    expect(first).toEqual({ data: 'first', status: 200 });

    const second = await deduped.get('/users');
    expect(second).toEqual({ data: 'second', status: 200 });

    expect(http.get).toHaveBeenCalledTimes(2);
  });

  it('does not deduplicate different endpoints', async () => {
    vi.mocked(http.get)
      .mockResolvedValueOnce({ data: 'users', status: 200 } as never)
      .mockResolvedValueOnce({ data: 'posts', status: 200 } as never);

    const deduped = withDeduplication(http);

    const [r1, r2] = await Promise.all([
      deduped.get('/users'),
      deduped.get('/posts'),
    ]);

    expect(r1).toEqual({ data: 'users', status: 200 });
    expect(r2).toEqual({ data: 'posts', status: 200 });
    expect(http.get).toHaveBeenCalledTimes(2);
  });

  it('cleans up the cache after a failed request', async () => {
    vi.mocked(http.get)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: 'recovered', status: 200 } as never);

    const deduped = withDeduplication(http);

    await expect(deduped.get('/users')).rejects.toThrow('Network error');

    // After failure, cache should be cleared, allowing a fresh request
    const result = await deduped.get('/users');
    expect(result).toEqual({ data: 'recovered', status: 200 });
    expect(http.get).toHaveBeenCalledTimes(2);
  });
});
