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
// Profile / User handlers
// ---------------------------------------------------------------------------

export const TEST_PROFILE = {
  ...TEST_USER,
  username: 'testuser',
  date_of_birth: null,
  bio: '',
  avatar: null,
  location: null,
  neighborhood: '',
  preferred_genres: [],
  preferred_language: 'en' as const,
  preferred_radius: 5,
  avg_rating: '0.0',
  swap_count: 0,
  rating_count: 0,
  auth_provider: 'email',
  onboarding_completed: false,
  email_verified: true,
  member_since: '2025-01-01T00:00:00Z',
};

const profileHandlers = [
  /** GET /api/v1/users/me/ — current user profile */
  http.get('*/api/v1/users/me/', () => {
    return HttpResponse.json(TEST_PROFILE);
  }),

  /** PATCH /api/v1/users/me/ — update profile */
  http.patch('*/api/v1/users/me/', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...TEST_PROFILE, ...body });
  }),

  /** POST /api/v1/users/me/location/ — set location */
  http.post('*/api/v1/users/me/location/', async ({ request }) => {
    const body = (await request.json()) as { latitude: number; longitude: number };
    return HttpResponse.json({
      location: { latitude: body.latitude, longitude: body.longitude },
      neighborhood: 'Jordaan',
    });
  }),

  /** POST /api/v1/users/me/onboarding/complete/ — mark onboarding done */
  http.post('*/api/v1/users/me/onboarding/complete/', () => {
    return HttpResponse.json({ onboarding_completed: true });
  }),

  /** GET /api/v1/users/:id/ — public profile */
  http.get('*/api/v1/users/:id/', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      username: 'publicuser',
      first_name: 'Public',
      last_name: 'User',
      bio: '',
      avatar: null,
      neighborhood: 'De Pijp',
      preferred_genres: [],
      preferred_language: 'en',
      avg_rating: '0.0',
      swap_count: 0,
      rating_count: 0,
      member_since: '2025-01-01T00:00:00Z',
    });
  }),

  /** GET /api/v1/users/check-username/ — username availability */
  http.get('*/api/v1/users/check-username/', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') ?? '';
    const taken = q === 'taken_user';
    return HttpResponse.json({
      available: !taken,
      ...(taken ? { suggestions: [`${q}_1`, `${q}_2`] } : {}),
    });
  }),

  /** POST /api/v1/users/me/delete/ — request account deletion */
  http.post('*/api/v1/users/me/delete/', async ({ request }) => {
    const body = (await request.json()) as { password?: string };
    if (body.password === 'wrong') {
      return HttpResponse.json(
        { password: ['Invalid password.'] },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      detail: 'Account scheduled for deletion.',
      cancel_token: 'signed-cancel-token-abc',
    });
  }),

  /** POST /api/v1/users/me/delete/cancel/ — cancel account deletion */
  http.post('*/api/v1/users/me/delete/cancel/', () => {
    return HttpResponse.json({
      detail: 'Account deletion cancelled.',
    });
  }),
];

// ---------------------------------------------------------------------------
// Registration handler
// ---------------------------------------------------------------------------

const registrationHandlers = [
  /** POST /api/v1/auth/register/ — create account */
  http.post('*/api/v1/auth/register/', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        user: {
          id: 'usr_new_001',
          email: body.email ?? 'new@example.com',
          first_name: body.first_name ?? '',
          last_name: body.last_name ?? '',
        },
      },
      { status: 201 },
    );
  }),
];

// ---------------------------------------------------------------------------
// Combined handlers
// ---------------------------------------------------------------------------

/** Default MSW request handlers for all tests. */
export const handlers = [...authHandlers, ...profileHandlers, ...registrationHandlers];
