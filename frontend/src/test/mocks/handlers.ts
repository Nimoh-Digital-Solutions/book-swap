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
// Book / Wishlist handlers
// ---------------------------------------------------------------------------

export const TEST_BOOK_OWNER = {
  id: 'usr_test_001',
  username: 'testuser',
  avatar: null,
  neighborhood: 'Jordaan',
  avg_rating: '4.5',
};

export const TEST_BOOK_LIST_ITEM = {
  id: 'book_001',
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  cover_url: 'https://example.com/gatsby.jpg',
  condition: 'good' as const,
  language: 'en' as const,
  status: 'available' as const,
  primary_photo: null,
  owner: TEST_BOOK_OWNER,
  created_at: '2025-07-10T10:00:00Z',
};

export const TEST_BOOK: Record<string, unknown> = {
  ...TEST_BOOK_LIST_ITEM,
  isbn: '9780743273565',
  description: 'A novel about the American Dream.',
  genres: ['Fiction'],
  notes: '',
  page_count: 180,
  publish_year: 1925,
  photos: [],
  updated_at: '2025-07-10T10:00:00Z',
};

export const TEST_WISHLIST_ITEM = {
  id: 'wish_001',
  isbn: '9780140449136',
  title: 'Crime and Punishment',
  author: 'Fyodor Dostoevsky',
  genre: 'Fiction',
  cover_url: '',
  created_at: '2025-07-11T08:00:00Z',
};

const bookHandlers = [
  /** GET /api/v1/books/ — list books (optionally filtered by owner=me) */
  http.get('*/api/v1/books/', ({ request }) => {
    const url = new URL(request.url);
    const owner = url.searchParams.get('owner');
    if (owner === 'me') {
      return HttpResponse.json({
        count: 1,
        next: null,
        previous: null,
        results: [TEST_BOOK_LIST_ITEM],
      });
    }
    return HttpResponse.json({
      count: 1,
      next: null,
      previous: null,
      results: [TEST_BOOK_LIST_ITEM],
    });
  }),

  /** GET /api/v1/books/:id/ — book detail */
  http.get('*/api/v1/books/:id/', () => {
    return HttpResponse.json(TEST_BOOK);
  }),

  /** POST /api/v1/books/ — create book */
  http.post('*/api/v1/books/', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { ...TEST_BOOK, ...body, id: 'book_new_001' },
      { status: 201 },
    );
  }),

  /** PATCH /api/v1/books/:id/ — update book */
  http.patch('*/api/v1/books/:id/', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...TEST_BOOK, ...body });
  }),

  /** DELETE /api/v1/books/:id/ */
  http.delete('*/api/v1/books/:id/', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  /** GET /api/v1/books/isbn-lookup/ */
  http.get('*/api/v1/books/isbn-lookup/', ({ request }) => {
    const url = new URL(request.url);
    const isbn = url.searchParams.get('isbn') ?? '';
    return HttpResponse.json({
      isbn,
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      description: 'A novel about the American Dream.',
      cover_url: 'https://example.com/gatsby.jpg',
      page_count: 180,
      publish_year: 1925,
    });
  }),

  /** GET /api/v1/books/search-external/ */
  http.get('*/api/v1/books/search-external/', () => {
    return HttpResponse.json([
      {
        isbn: '9780743273565',
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        description: '',
        cover_url: '',
        page_count: null,
        publish_year: 1925,
      },
    ]);
  }),

  /** POST /api/v1/books/:bookId/photos/ — upload photo */
  http.post('*/api/v1/books/:bookId/photos/', () => {
    return HttpResponse.json(
      { id: 'photo_001', image: 'https://example.com/photo.jpg', position: 0, created_at: '2025-07-10T10:00:00Z' },
      { status: 201 },
    );
  }),

  /** DELETE /api/v1/books/:bookId/photos/:photoId/ */
  http.delete('*/api/v1/books/:bookId/photos/:photoId/', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  /** PATCH /api/v1/books/:bookId/photos/reorder/ */
  http.patch('*/api/v1/books/:bookId/photos/reorder/', () => {
    return HttpResponse.json([]);
  }),
];

const wishlistHandlers = [
  /** GET /api/v1/wishlist/ */
  http.get('*/api/v1/wishlist/', () => {
    return HttpResponse.json({
      count: 1,
      next: null,
      previous: null,
      results: [TEST_WISHLIST_ITEM],
    });
  }),

  /** POST /api/v1/wishlist/ */
  http.post('*/api/v1/wishlist/', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { ...TEST_WISHLIST_ITEM, ...body, id: 'wish_new_001' },
      { status: 201 },
    );
  }),

  /** DELETE /api/v1/wishlist/:id/ */
  http.delete('*/api/v1/wishlist/:id/', () => {
    return new HttpResponse(null, { status: 204 });
  }),
];

// ---------------------------------------------------------------------------
// Browse / Discovery handlers (Epic 4)
// ---------------------------------------------------------------------------

export const TEST_BROWSE_BOOK = {
  id: 'book_browse_001',
  title: 'The Alchemist',
  author: 'Paulo Coelho',
  cover_url: 'https://example.com/alchemist.jpg',
  condition: 'good' as const,
  language: 'en' as const,
  status: 'available' as const,
  primary_photo: null,
  owner: {
    ...TEST_BOOK_OWNER,
    id: 'usr_other_001',
    username: 'otheruser',
    neighborhood: 'De Pijp',
    location: { latitude: 52.3508, longitude: 4.8952 },
  },
  distance: 2.3,
  created_at: '2025-08-01T12:00:00Z',
};

export const TEST_BROWSE_BOOK_2 = {
  id: 'book_browse_002',
  title: '1984',
  author: 'George Orwell',
  cover_url: 'https://example.com/1984.jpg',
  condition: 'like_new' as const,
  language: 'en' as const,
  status: 'available' as const,
  primary_photo: null,
  owner: {
    ...TEST_BOOK_OWNER,
    id: 'usr_other_002',
    username: 'bookworm',
    neighborhood: 'Oud-West',
    location: { latitude: 52.3640, longitude: 4.8720 },
  },
  distance: 4.1,
  created_at: '2025-08-02T10:00:00Z',
};

const browseHandlers = [
  /** GET /api/v1/books/browse/ — paginated browse */
  http.get('*/api/v1/books/browse/', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');

    if (search) {
      const filtered = [TEST_BROWSE_BOOK, TEST_BROWSE_BOOK_2].filter(
        b =>
          b.title.toLowerCase().includes(search.toLowerCase()) ||
          b.author.toLowerCase().includes(search.toLowerCase()),
      );
      return HttpResponse.json({
        count: filtered.length,
        next: null,
        previous: null,
        results: filtered,
      });
    }

    return HttpResponse.json({
      count: 2,
      next: null,
      previous: null,
      results: [TEST_BROWSE_BOOK, TEST_BROWSE_BOOK_2],
    });
  }),

  /** GET /api/v1/books/browse/radius-counts/ */
  http.get('*/api/v1/books/browse/radius-counts/', () => {
    return HttpResponse.json({
      counts: {
        '1000': 1,
        '3000': 2,
        '5000': 5,
        '10000': 12,
        '25000': 30,
      },
    });
  }),

  /** GET /api/v1/books/nearby-count/ */
  http.get('*/api/v1/books/nearby-count/', () => {
    return HttpResponse.json({
      count: 42,
      radius: 5000,
    });
  }),
];

// ---------------------------------------------------------------------------
// Combined handlers
// ---------------------------------------------------------------------------

/** Default MSW request handlers for all tests. */
export const handlers = [
  ...authHandlers,
  ...profileHandlers,
  ...registrationHandlers,
  ...browseHandlers,
  ...bookHandlers,
  ...wishlistHandlers,
];
