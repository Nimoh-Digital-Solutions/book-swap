import { afterEach, beforeEach,describe, expect, it, vi } from 'vitest';

import { http,HttpError } from './http';

// ---------------------------------------------------------------------------
// Mock APP_CONFIG so HTTP tests are not dependent on env vars being set
// ---------------------------------------------------------------------------
vi.mock('@configs', () => ({
  APP_CONFIG: { apiUrl: 'https://api.example.com', appName: 'Test App' },
}));

// ---------------------------------------------------------------------------
// Fetch mock helpers
// ---------------------------------------------------------------------------

function mockFetch(status: number, body: unknown, ok?: boolean): void {
  const resolvedOk = ok ?? (status >= 200 && status < 300);
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: resolvedOk,
      status,
      statusText: String(status),
      json: body === null ? () => Promise.reject(new Error('no body')) : () => Promise.resolve(body),
    })
  );
}

// Suppress console.debug from the logging interceptor in tests
beforeEach(() => {
  vi.spyOn(console, 'debug').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// HttpError
// ---------------------------------------------------------------------------

describe('HttpError', () => {
  it('has the correct name, status, and body', () => {
    const err = new HttpError(404, { message: 'Not found' });

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(HttpError);
    expect(err.name).toBe('HttpError');
    expect(err.status).toBe(404);
    expect(err.body).toEqual({ message: 'Not found' });
    expect(err.message).toBe('HTTP Error 404');
  });

  it('works with a null body', () => {
    const err = new HttpError(500, null);
    expect(err.body).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// http.get
// ---------------------------------------------------------------------------

describe('http.get', () => {
  it('sends a GET request with correct headers and returns parsed data', async () => {
    mockFetch(200, { id: 1 });

    const result = await http.get<{ id: number }>('/users/1');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/users/1',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Accept: 'application/json',
        }),
      })
    );
    expect(result.data).toEqual({ id: 1 });
    expect(result.status).toBe(200);
  });

  it('throws HttpError on non-2xx response', async () => {
    mockFetch(404, { error: 'Not found' }, false);

    await expect(http.get('/missing')).rejects.toMatchObject({
      status: 404,
      body: { error: 'Not found' },
      name: 'HttpError',
    });
  });
});

// ---------------------------------------------------------------------------
// http.post
// ---------------------------------------------------------------------------

describe('http.post', () => {
  it('sends a POST request with a JSON body', async () => {
    mockFetch(201, { id: 42 });

    const result = await http.post<{ id: number }>('/users', { name: 'Alice' });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name: 'Alice' }),
      })
    );
    expect(result.data).toEqual({ id: 42 });
    expect(result.status).toBe(201);
  });

  it('sends POST with no body when called without body argument', async () => {
    mockFetch(204, null);

    await http.post('/trigger');

    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1]! as RequestInit;
    expect(call.body).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// http.put
// ---------------------------------------------------------------------------

describe('http.put', () => {
  it('sends a PUT request with a JSON body', async () => {
    mockFetch(200, { updated: true });

    await http.put('/users/1', { name: 'Bob' });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/users/1',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ name: 'Bob' }) })
    );
  });
});

// ---------------------------------------------------------------------------
// http.patch
// ---------------------------------------------------------------------------

describe('http.patch', () => {
  it('sends a PATCH request with a JSON body', async () => {
    mockFetch(200, { patched: true });

    await http.patch('/users/1', { name: 'Carol' });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/users/1',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ name: 'Carol' }) })
    );
  });
});

// ---------------------------------------------------------------------------
// http.delete
// ---------------------------------------------------------------------------

describe('http.delete', () => {
  it('sends a DELETE request with no body', async () => {
    mockFetch(204, null);

    await http.delete('/users/1');

    const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1]! as RequestInit;
    expect(call.method).toBe('DELETE');
    expect(call.body).toBeUndefined();
  });

  it('throws HttpError on non-2xx response', async () => {
    mockFetch(403, { error: 'Forbidden' }, false);

    await expect(http.delete('/admin')).rejects.toMatchObject({
      status: 403,
      name: 'HttpError',
    });
  });
});

// ---------------------------------------------------------------------------
// 204 No Content — null body handling
// ---------------------------------------------------------------------------

describe('http — 204 No Content', () => {
  it('resolves with data: null when the response has no parseable body', async () => {
    mockFetch(204, null); // json() rejects → falls back to null

    const result = await http.delete('/resource/1');

    expect(result.data).toBeNull();
    expect(result.status).toBe(204);
  });
});

// ---------------------------------------------------------------------------
// credentials — httpOnly cookie support
// ---------------------------------------------------------------------------

describe('http — credentials', () => {
  it('includes credentials: include on all requests for httpOnly cookie auth', async () => {
    mockFetch(200, { ok: true });

    await http.get('/profile');

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: 'include' })
    );
  });
});

// ---------------------------------------------------------------------------
// timeout — AbortSignal.timeout support
// ---------------------------------------------------------------------------

describe('http — timeout', () => {
  it('passes an AbortSignal to fetch for request timeout', async () => {
    mockFetch(200, { ok: true });

    await http.get('/slow-endpoint');

    const fetchCall = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1]! as RequestInit;
    expect(fetchCall.signal).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// interceptors — runtime interceptor management
// ---------------------------------------------------------------------------

describe('http — interceptors', () => {
  it('exposes addRequestInterceptor for runtime interceptor registration', () => {
    expect(typeof http.addRequestInterceptor).toBe('function');
  });

  it('exposes addResponseInterceptor for runtime interceptor registration', () => {
    expect(typeof http.addResponseInterceptor).toBe('function');
  });

  it('exposes addErrorInterceptor for runtime interceptor registration', () => {
    expect(typeof http.addErrorInterceptor).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// createHttpClient — factory with config object
// ---------------------------------------------------------------------------

describe('createHttpClient — config object', () => {
  it('accepts a config object with baseUrl and interceptors', async () => {
    const { createHttpClient } = await import('@nimoh-digital-solutions/tast-utils');

    const interceptorSpy = vi.fn((ctx: { url: string; method: string; headers: Record<string, string> }) => {
      ctx.headers['X-Custom'] = 'test';
      return ctx;
    });

    const client = createHttpClient({
      baseUrl: 'https://custom-api.example.com',
      requestInterceptors: [interceptorSpy],
    });

    mockFetch(200, { custom: true });
    await client.get('/endpoint');

    expect(interceptorSpy).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      'https://custom-api.example.com/endpoint',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Custom': 'test' }),
      })
    );
  });

  it('still accepts a plain string for backwards compatibility', async () => {
    const { createHttpClient } = await import('@nimoh-digital-solutions/tast-utils');
    const client = createHttpClient('https://legacy.example.com');

    mockFetch(200, { legacy: true });
    const result = await client.get('/data');

    expect(fetch).toHaveBeenCalledWith(
      'https://legacy.example.com/data',
      expect.any(Object)
    );
    expect(result.data).toEqual({ legacy: true });
  });
});
