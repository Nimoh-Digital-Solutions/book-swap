import type { HttpRequestContext } from '@nimoh-digital-solutions/tast-utils';
import { HttpError } from '@nimoh-digital-solutions/tast-utils';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { setCsrfToken,useAuthStore } from '../stores/authStore';
import {
  authErrorInterceptor,
  authRequestInterceptor,
  csrfRequestInterceptor,
} from './authInterceptors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext(overrides?: Partial<HttpRequestContext>): HttpRequestContext {
  return {
    url: 'https://api.example.com/api/v1/test/',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    ...overrides,
  };
}

function resetStore() {
  useAuthStore.setState({
    accessToken: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('authRequestInterceptor', () => {
  beforeEach(resetStore);

  it('attaches Authorization header when token is present', () => {
    useAuthStore.getState().setAuth('tok_123', { id: 'usr_test_001', email: 'a@b.com', first_name: 'A', last_name: 'B' });

    const ctx = makeContext();
    const result = authRequestInterceptor(ctx) as HttpRequestContext;

    expect(result.headers['Authorization']).toBe('Bearer tok_123');
  });

  it('does not attach Authorization header when no token', () => {
    const ctx = makeContext();
    const result = authRequestInterceptor(ctx) as HttpRequestContext;

    expect(result.headers['Authorization']).toBeUndefined();
  });
});

describe('csrfRequestInterceptor', () => {
  beforeEach(() => {
    setCsrfToken(null);
  });

  it('attaches X-CSRFToken on mutating methods', () => {
    setCsrfToken('csrf_abc');

    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
      const ctx = makeContext({ method });
      const result = csrfRequestInterceptor(ctx) as HttpRequestContext;
      expect(result.headers['X-CSRFToken']).toBe('csrf_abc');
    }
  });

  it('does not attach X-CSRFToken on GET requests', () => {
    setCsrfToken('csrf_abc');

    const ctx = makeContext({ method: 'GET' });
    const result = csrfRequestInterceptor(ctx) as HttpRequestContext;

    expect(result.headers['X-CSRFToken']).toBeUndefined();
  });

  it('does not attach header when no CSRF token is set', () => {
    const ctx = makeContext({ method: 'POST' });
    const result = csrfRequestInterceptor(ctx) as HttpRequestContext;

    expect(result.headers['X-CSRFToken']).toBeUndefined();
  });
});

describe('authErrorInterceptor', () => {
  beforeEach(() => {
    resetStore();
    vi.restoreAllMocks();
  });

  it('re-throws non-401 errors', async () => {
    const error = new HttpError(403, { detail: 'Forbidden' });
    const ctx = makeContext();

    await expect(authErrorInterceptor(error, ctx)).rejects.toThrow('HTTP Error 403');
  });

  it('re-throws non-HttpError errors', async () => {
    const error = new TypeError('Network error');
    const ctx = makeContext();

    await expect(authErrorInterceptor(error, ctx)).rejects.toThrow('Network error');
  });

  it('clears auth and re-throws if the failing request is the refresh endpoint', async () => {
    useAuthStore.getState().setAuth('tok', { id: 'usr_test_001', email: 'a@b.com', first_name: 'A', last_name: 'B' });

    const error = new HttpError(401, { detail: 'Token expired' });
    const ctx = makeContext({
      url: 'https://api.example.com/api/v1/auth/token/refresh/',
    });

    await expect(authErrorInterceptor(error, ctx)).rejects.toThrow('HTTP Error 401');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('attempts refresh and retries request on 401', async () => {
    useAuthStore.getState().setAuth('old_tok', { id: 'usr_test_001', email: 'a@b.com', first_name: 'A', last_name: 'B' });

    // Mock refreshToken to succeed
    const refreshSpy = vi.spyOn(useAuthStore.getState(), 'refreshToken')
      .mockResolvedValueOnce(true);

    // After refresh, store has new token
    useAuthStore.setState({ accessToken: 'new_tok' });

    // Mock fetch for the retry
    const mockResponse = new Response(JSON.stringify({ ok: true }), { status: 200 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(mockResponse));

    const error = new HttpError(401, { detail: 'Token expired' });
    const ctx = makeContext({ method: 'GET' });

    const result = await authErrorInterceptor(error, ctx);

    expect(refreshSpy).toHaveBeenCalledOnce();
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(200);

    vi.unstubAllGlobals();
  });

  it('re-throws 401 when refresh fails', async () => {
    useAuthStore.getState().setAuth('old_tok', { id: 'usr_test_001', email: 'a@b.com', first_name: 'A', last_name: 'B' });

    vi.spyOn(useAuthStore.getState(), 'refreshToken')
      .mockResolvedValueOnce(false);

    const error = new HttpError(401, { detail: 'Expired' });
    const ctx = makeContext();

    await expect(authErrorInterceptor(error, ctx)).rejects.toThrow('HTTP Error 401');
  });
});
