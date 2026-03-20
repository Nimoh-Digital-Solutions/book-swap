import { http, HttpResponse } from 'msw';

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

export const TEST_USER = {
  id: 'usr_test_001',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
};

export const TEST_ACCESS_TOKEN = 'test-access-token-abc123';
export const TEST_CSRF_TOKEN = 'test-csrf-token-xyz789';

// ---------------------------------------------------------------------------
// Auth handlers
// ---------------------------------------------------------------------------

const authHandlers = [
  /** POST /api/v1/auth/login/ — successful login */
  http.post('*/api/v1/auth/login/', async ({ request }) => {
    const body = (await request.json()) as { email_or_username?: string; password?: string };

    if (body.email_or_username === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        access: TEST_ACCESS_TOKEN,
        expires_in: 3600,
        token_type: 'Bearer',
        user: TEST_USER,
      });
    }

    return HttpResponse.json(
      { detail: 'Invalid credentials' },
      { status: 401 },
    );
  }),

  /** POST /api/v1/auth/logout/ */
  http.post('*/api/v1/auth/logout/', () => {
    return HttpResponse.json({ detail: 'Logged out' });
  }),

  /** POST /api/v1/auth/token/refresh/ — successful token refresh */
  http.post('*/api/v1/auth/token/refresh/', () => {
    return HttpResponse.json({
      access: 'refreshed-access-token',
      expires_in: 3600,
      token_type: 'Bearer',
    });
  }),

  /** GET /api/v1/auth/csrf/ */
  http.get('*/api/v1/auth/csrf/', () => {
    return HttpResponse.json({ csrfToken: TEST_CSRF_TOKEN });
  }),

  /** GET /api/v1/auth/me/ — current user profile */
  http.get('*/api/v1/auth/me/', () => {
    return HttpResponse.json(TEST_USER);
  }),
];

// ---------------------------------------------------------------------------
// Combined handlers
// ---------------------------------------------------------------------------

/** Default MSW request handlers for all tests. */
export const handlers = [...authHandlers];
