import { useAppStore } from '@data/useAppStore';
import type { HttpRequestContext } from '@nimoh-digital-solutions/tast-utils';
import { HttpError } from '@nimoh-digital-solutions/tast-utils';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import {
  handleHttpError,
  notificationErrorInterceptor,
  stripClientOnlyHeaders,
  SUPPRESS_TOAST_HEADER,
} from './errorHandlers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function httpError(status: number, body: unknown): HttpError {
  return new HttpError(status, body);
}

function problemBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    type: 'urn:error',
    title: 'Error',
    status: 400,
    detail: 'Something went wrong',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// handleHttpError
// ---------------------------------------------------------------------------

describe('handleHttpError', () => {
  it('returns field errors for 400 with invalid_params', () => {
    const error = httpError(400, problemBody({
      invalid_params: [{ name: 'email', reason: 'Required' }],
    }));

    const result = handleHttpError(error);
    expect(result.fieldErrors).toHaveLength(1);
    expect(result.suppressToast).toBe(true);
    expect(result.variant).toBe('error');
  });

  it('returns non-suppressed toast for 400 without field errors', () => {
    const error = httpError(400, problemBody({
      detail: 'Generic bad request',
    }));

    const result = handleHttpError(error);
    expect(result.fieldErrors).toHaveLength(0);
    expect(result.suppressToast).toBe(false);
    expect(result.message).toBe('Generic bad request');
  });

  it('handles 400 with non-ProblemDetail body', () => {
    const error = httpError(400, 'Bad Request');
    const result = handleHttpError(error);
    expect(result.message).toBe('Invalid request');
    expect(result.suppressToast).toBe(false);
  });

  it('returns warning for 401', () => {
    const result = handleHttpError(httpError(401, null));
    expect(result.variant).toBe('warning');
    expect(result.message).toContain('session');
  });

  it('returns info for 402', () => {
    const result = handleHttpError(httpError(402, null));
    expect(result.variant).toBe('info');
    expect(result.message).toContain('subscription');
  });

  it('returns error for 403', () => {
    const result = handleHttpError(httpError(403, null));
    expect(result.variant).toBe('error');
    expect(result.message).toContain('permission');
  });

  it('returns warning for 404', () => {
    const result = handleHttpError(httpError(404, null));
    expect(result.variant).toBe('warning');
    expect(result.message).toContain('not found');
  });

  it('returns warning for 423 with lockout detail', () => {
    const error = httpError(423, problemBody({
      status: 423,
      detail: 'Account locked. Try again in 15 minutes.',
    }));

    const result = handleHttpError(error);
    expect(result.variant).toBe('warning');
    expect(result.message).toContain('15 minutes');
  });

  it('returns warning for 429 rate limit', () => {
    const error = httpError(429, problemBody({
      status: 429,
      detail: 'Rate limited. Retry after 60 seconds.',
    }));

    const result = handleHttpError(error);
    expect(result.variant).toBe('warning');
    expect(result.message).toContain('60 seconds');
  });

  it('returns error for 500+', () => {
    const result = handleHttpError(httpError(500, null));
    expect(result.variant).toBe('error');
    expect(result.message).toContain('server error');
  });

  it('returns error for 502', () => {
    const result = handleHttpError(httpError(502, null));
    expect(result.variant).toBe('error');
  });

  it('returns fallback for unknown status', () => {
    const result = handleHttpError(httpError(418, null));
    expect(result.message).toContain('418');
    expect(result.variant).toBe('error');
  });

  it('returns DRF field errors for 400 with standard DRF validation format', () => {
    // Body is NOT a ProblemDetail, but IS a DRF { field: ["msg"] } structure
    const error = httpError(400, {
      email: ['This field is required.'],
      username: ['A user with that username already exists.'],
    });
    const result = handleHttpError(error);
    expect(result.fieldErrors.length).toBeGreaterThan(0);
    expect(result.suppressToast).toBe(true);
    expect(result.variant).toBe('error');
    expect(result.message).toBe('Please correct the errors below');
  });
});

// ---------------------------------------------------------------------------
// notificationErrorInterceptor
// ---------------------------------------------------------------------------

describe('notificationErrorInterceptor', () => {
  const addNotification = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the Zustand store's addNotification
    const originalState = useAppStore.getState();
    useAppStore.setState({
      ...originalState,
      addNotification: addNotification as typeof originalState.addNotification,
    });
  });

  it('shows a toast for a 500 error', () => {
    const error = httpError(500, null);
    const context = { url: '/api/test', method: 'GET', headers: {} };

    expect(() => notificationErrorInterceptor(error, context)).toThrow(HttpError);
    expect(addNotification).toHaveBeenCalledWith(
      expect.stringContaining('server error'),
      expect.objectContaining({ variant: 'error' }),
    );
  });

  it('suppresses toast when handler says suppressToast', () => {
    const error = httpError(400, problemBody({
      invalid_params: [{ name: 'email', reason: 'Required' }],
    }));
    const context = { url: '/api/test', method: 'POST', headers: {} };

    expect(() => notificationErrorInterceptor(error, context)).toThrow(HttpError);
    expect(addNotification).not.toHaveBeenCalled();
  });

  it('suppresses toast when X-Suppress-Toast header is set', () => {
    const error = httpError(404, null);
    const context = {
      url: '/api/test',
      method: 'GET',
      headers: { [SUPPRESS_TOAST_HEADER]: 'true' },
    };

    expect(() => notificationErrorInterceptor(error, context)).toThrow(HttpError);
    expect(addNotification).not.toHaveBeenCalled();
  });

  it('re-throws non-HttpError without showing toast', () => {
    const error = new Error('Network failure');
    const context = { url: '/api/test', method: 'GET', headers: {} };

    expect(() => notificationErrorInterceptor(error, context)).toThrow('Network failure');
    expect(addNotification).not.toHaveBeenCalled();
  });

  it('always re-throws the original error', () => {
    const error = httpError(403, null);
    const context = { url: '/api/test', method: 'DELETE', headers: {} };

    expect(() => notificationErrorInterceptor(error, context)).toThrow(HttpError);
  });
});

// ---------------------------------------------------------------------------
// stripClientOnlyHeaders
// ---------------------------------------------------------------------------

describe('stripClientOnlyHeaders', () => {
  const baseContext: HttpRequestContext = { url: '/api/test', method: 'GET', headers: {} };

  it('removes X-Suppress-Toast from headers when present', () => {
    const context = {
      ...baseContext,
      headers: { [SUPPRESS_TOAST_HEADER]: 'true', 'Content-Type': 'application/json' },
    };

    const result = stripClientOnlyHeaders(context) as HttpRequestContext;

    expect(result.headers).not.toHaveProperty(SUPPRESS_TOAST_HEADER);
    expect(result.headers).toHaveProperty('Content-Type', 'application/json');
  });

  it('returns the context unchanged when X-Suppress-Toast is absent', () => {
    const context = {
      ...baseContext,
      headers: { 'Content-Type': 'application/json' },
    };

    const result = stripClientOnlyHeaders(context) as HttpRequestContext;

    expect(result).toStrictEqual(context);
  });
});
