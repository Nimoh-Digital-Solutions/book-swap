import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock http.get
vi.mock('@services', () => ({
  http: {
    get: vi.fn(),
  },
}));

// Mock logger
vi.mock('@utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { http } from '@services';

import { useHealthCheck } from './useHealthCheck';

describe('useHealthCheck', () => {
  beforeEach(() => {
    vi.mocked(http.get).mockResolvedValue({ status: 'ok' } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('performs an initial health check on mount', async () => {
    renderHook(() => useHealthCheck({ intervalMs: 0 }));

    // Flush microtask queue
    await act(async () => {});

    expect(http.get).toHaveBeenCalledWith('/api/v1/health/', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('returns isHealthy: true when check succeeds', async () => {
    const { result } = renderHook(() => useHealthCheck({ intervalMs: 0 }));

    await act(async () => {});

    expect(result.current.isHealthy).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('returns isHealthy: false when check fails', async () => {
    vi.mocked(http.get).mockRejectedValueOnce(new Error('Connection refused'));

    const { result } = renderHook(() => useHealthCheck({ intervalMs: 0 }));

    await act(async () => {});

    expect(result.current.isHealthy).toBe(false);
    expect(result.current.error).toBe('Connection refused');
  });

  it('uses a custom endpoint when provided', async () => {
    renderHook(() => useHealthCheck({ endpoint: '/health', intervalMs: 0 }));

    await act(async () => {});

    expect(http.get).toHaveBeenCalledWith('/health', expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it('does not run when enabled is false', async () => {
    renderHook(() => useHealthCheck({ enabled: false, intervalMs: 0 }));

    await act(async () => {});

    expect(http.get).not.toHaveBeenCalled();
  });

  it('sets lastCheckedAt after a check', async () => {
    const { result } = renderHook(() => useHealthCheck({ intervalMs: 0 }));

    await act(async () => {});

    expect(result.current.lastCheckedAt).not.toBeNull();
  });
});
