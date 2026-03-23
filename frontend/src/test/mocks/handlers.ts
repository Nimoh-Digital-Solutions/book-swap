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
// Exchange handlers
// ---------------------------------------------------------------------------

const MOCK_EXCHANGE_PARTICIPANT_REQUESTER = {
  id: 'usr_test_001',
  username: 'testuser',
  avatar: null,
  avg_rating: 4.2,
  swap_count: 3,
};

const MOCK_EXCHANGE_PARTICIPANT_OWNER = {
  id: 'usr_owner_001',
  username: 'bookworm',
  avatar: null,
  avg_rating: 4.5,
  swap_count: 7,
};

const MOCK_EXCHANGE_BOOK_REQUESTED = {
  id: 'book_req_001',
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  cover_url: 'https://example.com/gatsby.jpg',
  condition: 'good',
  primary_photo: null,
};

const MOCK_EXCHANGE_BOOK_OFFERED = {
  id: 'book_off_001',
  title: '1984',
  author: 'George Orwell',
  cover_url: 'https://example.com/1984.jpg',
  condition: 'like_new',
  primary_photo: null,
};

const MOCK_EXCHANGE_LIST_ITEM = {
  id: 'exch_001',
  status: 'pending' as const,
  message: 'Would love to swap!',
  requester: MOCK_EXCHANGE_PARTICIPANT_REQUESTER,
  owner: MOCK_EXCHANGE_PARTICIPANT_OWNER,
  requested_book: MOCK_EXCHANGE_BOOK_REQUESTED,
  offered_book: MOCK_EXCHANGE_BOOK_OFFERED,
  created_at: '2025-07-15T10:00:00Z',
  updated_at: '2025-07-15T10:00:00Z',
};

const MOCK_EXCHANGE_DETAIL = {
  ...MOCK_EXCHANGE_LIST_ITEM,
  decline_reason: null,
  counter_to: null,
  requester_confirmed_at: null,
  owner_confirmed_at: null,
  return_requested_at: null,
  return_confirmed_requester: null,
  return_confirmed_owner: null,
  expired_at: null,
  conditions_accepted_by_me: false,
  conditions_accepted_count: 0,
  conditions_version: '1.0',
};

export {
  MOCK_EXCHANGE_LIST_ITEM,
  MOCK_EXCHANGE_DETAIL,
  MOCK_EXCHANGE_PARTICIPANT_REQUESTER,
  MOCK_EXCHANGE_PARTICIPANT_OWNER,
  MOCK_EXCHANGE_BOOK_REQUESTED,
  MOCK_EXCHANGE_BOOK_OFFERED,
};

const exchangeHandlers = [
  /** GET /api/v1/exchanges/ — list exchanges */
  http.get('*/api/v1/exchanges/', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/incoming/count/')) return;
    if (url.pathname.endsWith('/incoming/')) return;
    return HttpResponse.json({
      count: 1,
      next: null,
      previous: null,
      results: [MOCK_EXCHANGE_LIST_ITEM],
    });
  }),

  /** GET /api/v1/exchanges/:id/ — exchange detail */
  http.get('*/api/v1/exchanges/:id/', ({ params }) => {
    return HttpResponse.json({ ...MOCK_EXCHANGE_DETAIL, id: params.id });
  }),

  /** POST /api/v1/exchanges/ — create exchange */
  http.post('*/api/v1/exchanges/', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { ...MOCK_EXCHANGE_DETAIL, id: 'exch_new_001', ...body },
      { status: 201 },
    );
  }),

  /** POST /api/v1/exchanges/:id/accept/ */
  http.post('*/api/v1/exchanges/:id/accept/', ({ params }) => {
    return HttpResponse.json({ ...MOCK_EXCHANGE_DETAIL, id: params.id, status: 'accepted' });
  }),

  /** POST /api/v1/exchanges/:id/decline/ */
  http.post('*/api/v1/exchanges/:id/decline/', ({ params }) => {
    return HttpResponse.json({ ...MOCK_EXCHANGE_DETAIL, id: params.id, status: 'declined' });
  }),

  /** POST /api/v1/exchanges/:id/counter/ */
  http.post('*/api/v1/exchanges/:id/counter/', ({ params }) => {
    return HttpResponse.json({ ...MOCK_EXCHANGE_DETAIL, id: `${String(params.id)}_counter`, status: 'pending' });
  }),

  /** POST /api/v1/exchanges/:id/cancel/ */
  http.post('*/api/v1/exchanges/:id/cancel/', ({ params }) => {
    return HttpResponse.json({ ...MOCK_EXCHANGE_DETAIL, id: params.id, status: 'cancelled' });
  }),

  /** POST /api/v1/exchanges/:id/accept-conditions/ */
  http.post('*/api/v1/exchanges/:id/accept-conditions/', ({ params }) => {
    return HttpResponse.json({
      ...MOCK_EXCHANGE_DETAIL,
      id: params.id,
      status: 'conditions_pending',
      conditions_accepted_by_me: true,
      conditions_accepted_count: 1,
    });
  }),

  /** GET /api/v1/exchanges/:id/conditions/ */
  http.get('*/api/v1/exchanges/:id/conditions/', () => {
    return HttpResponse.json({
      conditions_version: '1.0',
      acceptances: [],
      both_accepted: false,
    });
  }),

  /** POST /api/v1/exchanges/:id/confirm-swap/ */
  http.post('*/api/v1/exchanges/:id/confirm-swap/', ({ params }) => {
    return HttpResponse.json({
      ...MOCK_EXCHANGE_DETAIL,
      id: params.id,
      status: 'active',
      requester_confirmed_at: new Date().toISOString(),
    });
  }),

  /** POST /api/v1/exchanges/:id/request-return/ */
  http.post('*/api/v1/exchanges/:id/request-return/', ({ params }) => {
    return HttpResponse.json({
      ...MOCK_EXCHANGE_DETAIL,
      id: params.id,
      status: 'return_requested',
      return_requested_at: new Date().toISOString(),
    });
  }),

  /** POST /api/v1/exchanges/:id/confirm-return/ */
  http.post('*/api/v1/exchanges/:id/confirm-return/', ({ params }) => {
    return HttpResponse.json({
      ...MOCK_EXCHANGE_DETAIL,
      id: params.id,
      status: 'returned',
      return_confirmed_requester: new Date().toISOString(),
      return_confirmed_owner: new Date().toISOString(),
    });
  }),

  /** GET /api/v1/exchanges/incoming/ */
  http.get('*/api/v1/exchanges/incoming/', ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/count/')) return;
    return HttpResponse.json([
      { ...MOCK_EXCHANGE_LIST_ITEM, id: 'exch_incoming_001' },
    ]);
  }),

  /** GET /api/v1/exchanges/incoming/count/ */
  http.get('*/api/v1/exchanges/incoming/count/', () => {
    return HttpResponse.json({ count: 2 });
  }),
];

// ---------------------------------------------------------------------------
// Messaging handlers (Epic 6)
// ---------------------------------------------------------------------------

const MOCK_MESSAGE_SENDER = {
  id: 'usr_test_001',
  username: 'testuser',
  avatar: null,
};

const MOCK_MESSAGE_PARTNER = {
  id: 'usr_owner_001',
  username: 'bookworm',
  avatar: null,
};

export const MOCK_CHAT_MESSAGE = {
  id: 'msg_001',
  exchange: 'exch_001',
  sender: MOCK_MESSAGE_SENDER,
  content: 'Hello! Ready for the swap?',
  image: null,
  read_at: null,
  created_at: '2025-07-16T10:00:00Z',
};

export const MOCK_CHAT_MESSAGE_PARTNER = {
  id: 'msg_002',
  exchange: 'exch_001',
  sender: MOCK_MESSAGE_PARTNER,
  content: 'Yes, how about tomorrow?',
  image: null,
  read_at: '2025-07-16T10:05:00Z',
  created_at: '2025-07-16T10:01:00Z',
};

export const MOCK_MEETUP_LOCATION = {
  id: 'loc_001',
  name: 'OBA Oosterdok',
  address: 'Oosterdokskade 143',
  category: 'library' as const,
  city: 'Amsterdam',
  latitude: 52.3763,
  longitude: 4.9068,
  distance_km: 1.2,
};

const messagingHandlers = [
  /** GET /api/v1/messaging/exchanges/:exchangeId/messages/ */
  http.get('*/api/v1/messaging/exchanges/:exchangeId/messages/', () => {
    return HttpResponse.json({
      count: 2,
      next: null,
      previous: null,
      results: [MOCK_CHAT_MESSAGE, MOCK_CHAT_MESSAGE_PARTNER],
    });
  }),

  /** POST /api/v1/messaging/exchanges/:exchangeId/messages/ */
  http.post('*/api/v1/messaging/exchanges/:exchangeId/messages/', async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: 'msg_new_001',
        exchange: params.exchangeId,
        sender: MOCK_MESSAGE_SENDER,
        content: body.content ?? '',
        image: null,
        read_at: null,
        created_at: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  /** POST /api/v1/messaging/exchanges/:exchangeId/messages/mark-read/ */
  http.post('*/api/v1/messaging/exchanges/:exchangeId/messages/mark-read/', () => {
    return HttpResponse.json({ marked_read: 1 });
  }),

  /** GET /api/v1/messaging/exchanges/:exchangeId/meetup-suggestions/ */
  http.get('*/api/v1/messaging/exchanges/:exchangeId/meetup-suggestions/', () => {
    return HttpResponse.json([
      MOCK_MEETUP_LOCATION,
      {
        ...MOCK_MEETUP_LOCATION,
        id: 'loc_002',
        name: 'Vondelpark',
        address: 'Vondelpark',
        category: 'park' as const,
        distance_km: 2.5,
      },
    ]);
  }),
];

// ---------------------------------------------------------------------------
// Rating mock data & handlers
// ---------------------------------------------------------------------------

const MOCK_RATING = {
  id: 'rat_001',
  exchange: 'exch_001',
  rater: { id: 'usr_test_001', username: 'testuser', avatar: null },
  rated: { id: 'usr_owner_001', username: 'bookworm', avatar: null },
  score: 5,
  comment: 'Great swap partner!',
  created_at: '2025-07-20T12:00:00Z',
};

const MOCK_RATING_STATUS = {
  exchange_id: 'exch_001',
  my_rating: null as typeof MOCK_RATING | null,
  partner_rating: null as typeof MOCK_RATING | null,
  can_rate: true,
  rating_deadline: '2025-08-15T10:00:00Z',
};

export { MOCK_RATING, MOCK_RATING_STATUS };

const ratingHandlers = [
  /** GET /api/v1/ratings/exchanges/:exchangeId/ — rating status */
  http.get('*/api/v1/ratings/exchanges/:exchangeId/', () => {
    return HttpResponse.json(MOCK_RATING_STATUS);
  }),

  /** POST /api/v1/ratings/exchanges/:exchangeId/ — submit rating */
  http.post('*/api/v1/ratings/exchanges/:exchangeId/', async ({ request, params }) => {
    const body = (await request.json()) as { score: number; comment?: string };
    return HttpResponse.json(
      {
        id: 'rat_new_001',
        exchange: params.exchangeId,
        rater: { id: 'usr_test_001', username: 'testuser', avatar: null },
        rated: { id: 'usr_owner_001', username: 'bookworm', avatar: null },
        score: body.score,
        comment: body.comment ?? '',
        created_at: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  /** GET /api/v1/ratings/users/:userId/ — user ratings list */
  http.get('*/api/v1/ratings/users/:userId/', () => {
    return HttpResponse.json({
      count: 1,
      next: null,
      previous: null,
      results: [MOCK_RATING],
    });
  }),
];

// ---------------------------------------------------------------------------
// Trust & Safety handlers
// ---------------------------------------------------------------------------

const MOCK_BLOCKED_USER = {
  id: 'blk_001',
  blocked_user: {
    id: 'usr_blocked_001',
    username: 'blockeduser',
    first_name: 'Blocked',
    avatar: null,
  },
  created_at: '2025-01-15T10:00:00Z',
};

const trustSafetyHandlers = [
  /** GET /api/v1/users/block/ — list blocked users */
  http.get('*/api/v1/users/block/', () => {
    return HttpResponse.json({
      count: 1,
      next: null,
      previous: null,
      results: [MOCK_BLOCKED_USER],
    });
  }),

  /** POST /api/v1/users/block/ — block a user */
  http.post('*/api/v1/users/block/', async ({ request }) => {
    const body = (await request.json()) as { blocked_user_id: string };
    return HttpResponse.json(
      {
        id: 'blk_new_001',
        blocked_user: body.blocked_user_id,
        created_at: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  /** DELETE /api/v1/users/block/:userId/ — unblock a user */
  http.delete('*/api/v1/users/block/:userId/', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  /** POST /api/v1/reports/ — submit a report */
  http.post('*/api/v1/reports/', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: 'rpt_new_001',
        reporter: 'usr_test_001',
        reported_user: body.reported_user_id,
        reported_book: body.reported_book_id ?? null,
        reported_exchange: body.reported_exchange_id ?? null,
        category: body.category,
        description: body.description ?? '',
        status: 'open',
        created_at: new Date().toISOString(),
      },
      { status: 201 },
    );
  }),

  /** GET /api/v1/users/me/data-export/ — GDPR data export */
  http.get('*/api/v1/users/me/data-export/', () => {
    return HttpResponse.json({
      profile: { id: 'usr_test_001', email: 'test@example.com', first_name: 'Test' },
      books: [],
      exchanges: [],
      messages_sent: [],
      ratings_given: [],
      ratings_received: [],
      blocks: [],
      reports_filed: [],
      exported_at: new Date().toISOString(),
    });
  }),
];

// ---------------------------------------------------------------------------
// Combined handlers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Notification handlers
// ---------------------------------------------------------------------------

export const MOCK_NOTIFICATION = {
  id: 'notif_001',
  notification_type: 'new_request' as const,
  title: 'New swap request',
  body: 'Alice wants to swap for your book.',
  link: '/exchanges/exch_001/',
  is_read: false,
  created_at: new Date().toISOString(),
};

export const MOCK_NOTIFICATION_PREFS = {
  email_new_request: true,
  email_request_accepted: true,
  email_request_declined: true,
  email_new_message: true,
  email_exchange_completed: true,
  email_rating_received: true,
};

const notificationHandlers = [
  http.get('*/api/v1/notifications/', () => {
    return HttpResponse.json({
      unread_count: 1,
      results: [MOCK_NOTIFICATION],
    });
  }),

  http.post('*/api/v1/notifications/*/read/', () => {
    return HttpResponse.json({ marked: 1 });
  }),

  http.post('*/api/v1/notifications/mark-all-read/', () => {
    return HttpResponse.json({ marked: 1 });
  }),

  http.get('*/api/v1/notifications/preferences/', () => {
    return HttpResponse.json(MOCK_NOTIFICATION_PREFS);
  }),

  http.patch('*/api/v1/notifications/preferences/', async ({ request }) => {
    const body = (await request.json()) as Record<string, boolean>;
    return HttpResponse.json({ ...MOCK_NOTIFICATION_PREFS, ...body });
  }),

  http.get('*/api/v1/notifications/unsubscribe/:token', ({ params }) => {
    if ((params['token'] as string) === 'valid-token') {
      return HttpResponse.json({ detail: 'You have been unsubscribed from all BookSwap emails.' });
    }
    return HttpResponse.json({ detail: 'Invalid link.' }, { status: 404 });
  }),
];

/** Default MSW request handlers for all tests. */
export const handlers = [
  ...authHandlers,
  ...profileHandlers,
  ...registrationHandlers,
  ...browseHandlers,
  ...bookHandlers,
  ...wishlistHandlers,
  ...exchangeHandlers,
  ...messagingHandlers,
  ...ratingHandlers,
  ...trustSafetyHandlers,
  ...notificationHandlers,
];
