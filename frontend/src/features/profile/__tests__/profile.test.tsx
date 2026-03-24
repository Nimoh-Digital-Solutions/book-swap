/**
 * Profile feature tests
 *
 * Covers: types, service layer, query/mutation hooks, key factory, and schemas.
 * Uses MSW to mock the backend API responses.
 */
import type { ReactNode } from 'react';

import { API } from '@configs/apiEndpoints';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { server } from '../../../test/mocks/server';
import { profileKeys } from '../hooks/profileKeys';
import { useCheckUsername } from '../hooks/useCheckUsername';
import { useCompleteOnboarding } from '../hooks/useCompleteOnboarding';
import { useDeleteAccount } from '../hooks/useDeleteAccount';
import { useProfile } from '../hooks/useProfile';
import { usePublicProfile } from '../hooks/usePublicProfile';
import { useSetLocation } from '../hooks/useSetLocation';
import { useUpdateProfile } from '../hooks/useUpdateProfile';
import { locationSchema, profileEditSchema } from '../schemas/profile.schemas';
import { profileService } from '../services/profile.service';
import type { UserProfile, UserPublicProfile } from '../types/profile.types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_PROFILE: UserProfile = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'alice@example.com',
  username: 'alice',
  first_name: 'Alice',
  last_name: 'de Vries',
  date_of_birth: '1995-03-15',
  bio: 'Book lover from Amsterdam',
  avatar: null,
  location: { latitude: 52.37, longitude: 4.89 },
  neighborhood: 'Centrum',
  preferred_genres: ['Fiction', 'Science'],
  preferred_language: 'nl',
  preferred_radius: 5000,
  avg_rating: '4.50',
  swap_count: 12,
  rating_count: 8,
  auth_provider: 'email',
  onboarding_completed: true,
  email_verified: true,
  profile_public: true,
  member_since: '2025-06-01T10:00:00Z',
};

const MOCK_PUBLIC_PROFILE: UserPublicProfile = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  username: 'alice',
  first_name: 'Alice',
  bio: 'Book lover from Amsterdam',
  avatar: null,
  location: { latitude: 52.37, longitude: 4.89 },
  neighborhood: 'Centrum',
  preferred_genres: ['Fiction', 'Science'],
  preferred_language: 'nl',
  avg_rating: '4.50',
  swap_count: 12,
  rating_count: 8,
  member_since: '2025-06-01T10:00:00Z',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function createWrapper() {
  const client = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

// ---------------------------------------------------------------------------
// MSW handlers
// ---------------------------------------------------------------------------

function setupProfileHandlers() {
  server.use(
    http.get(`*${API.users.me}`, () => HttpResponse.json(MOCK_PROFILE)),
    http.patch(`*${API.users.me}`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      return HttpResponse.json({ ...MOCK_PROFILE, ...body });
    }),
    http.get(`*${API.users.detail(MOCK_PROFILE.id)}`, () =>
      HttpResponse.json(MOCK_PUBLIC_PROFILE),
    ),
    http.post(`*${API.users.meLocation}`, () =>
      HttpResponse.json({
        location: { latitude: 52.37, longitude: 4.89 },
        neighborhood: 'Centrum',
      }),
    ),
    http.post(`*${API.users.meOnboardingComplete}`, () =>
      HttpResponse.json({ onboarding_completed: true }),
    ),
    http.get(`*${API.users.checkUsername}*`, ({ request }) => {
      const url = new URL(request.url);
      const q = url.searchParams.get('q') ?? '';
      return HttpResponse.json({
        available: q !== 'taken',
        ...(q === 'taken' ? { suggestions: ['taken_1', 'taken_2'] } : {}),
      });
    }),
    http.post(`*${API.users.meDelete}`, () =>
      HttpResponse.json({
        detail: 'Account scheduled for deletion.',
        cancel_token: 'test-cancel-token',
      }),
    ),
    http.post(`*${API.users.meDeleteCancel}`, () =>
      HttpResponse.json({ detail: 'Account deletion cancelled.' }),
    ),
  );
}

// =========================================================================
// Tests
// =========================================================================

// ---------------------------------------------------------------------------
// 1. profileKeys — key factory
// ---------------------------------------------------------------------------
describe('profileKeys', () => {
  it('returns correct cache keys', () => {
    expect(profileKeys.all).toEqual(['profile']);
    expect(profileKeys.me()).toEqual(['profile', 'me']);
    expect(profileKeys.details()).toEqual(['profile', 'detail']);
    expect(profileKeys.detail('abc-123')).toEqual(['profile', 'detail', 'abc-123']);
  });

  it('returns correct checkUsername key', () => {
    expect(profileKeys.checkUsername('alice')).toEqual(['profile', 'check-username', 'alice']);
  });
});

// ---------------------------------------------------------------------------
// 2. profileService — API wrappers
// ---------------------------------------------------------------------------
describe('profileService', () => {
  beforeEach(setupProfileHandlers);

  it('getMe returns the full profile', async () => {
    const profile = await profileService.getMe();
    expect(profile.email).toBe('alice@example.com');
    expect(profile.onboarding_completed).toBe(true);
  });

  it('updateMe sends a PATCH and returns the updated profile', async () => {
    const updated = await profileService.updateMe({ bio: 'New bio' });
    expect(updated.bio).toBe('New bio');
  });

  it('getPublicProfile returns public fields only', async () => {
    const profile = await profileService.getPublicProfile(MOCK_PROFILE.id);
    expect(profile.username).toBe('alice');
    expect(profile).not.toHaveProperty('email');
  });

  it('setLocation sends POST and returns location data', async () => {
    const result = await profileService.setLocation({ postcode: '1012 AB' });
    expect(result.neighborhood).toBe('Centrum');
    expect(result.location.latitude).toBe(52.37);
  });

  it('completeOnboarding returns onboarding status', async () => {
    const result = await profileService.completeOnboarding();
    expect(result.onboarding_completed).toBe(true);
  });

  it('checkUsername returns availability', async () => {
    const result = await profileService.checkUsername('available_name');
    expect(result.available).toBe(true);
  });

  it('checkUsername returns suggestions for taken name', async () => {
    const result = await profileService.checkUsername('taken');
    expect(result.available).toBe(false);
    expect(result.suggestions).toEqual(['taken_1', 'taken_2']);
  });

  it('requestDeletion sends POST and returns cancel token', async () => {
    const result = await profileService.requestDeletion({ password: 'pass123' });
    expect(result.detail).toBe('Account scheduled for deletion.');
    expect(result.cancel_token).toBe('test-cancel-token');
  });

  it('cancelDeletion sends POST and returns confirmation', async () => {
    const result = await profileService.cancelDeletion({ token: 'some-token' });
    expect(result.detail).toBe('Account deletion cancelled.');
  });
});

// ---------------------------------------------------------------------------
// 3. useProfile hook
// ---------------------------------------------------------------------------
describe('useProfile', () => {
  beforeEach(setupProfileHandlers);

  it('fetches the authenticated user profile', async () => {
    const { result } = renderHook(() => useProfile(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.email).toBe('alice@example.com');
    expect(result.current.data?.neighborhood).toBe('Centrum');
  });

  it('does not fetch when disabled', () => {
    const { result } = renderHook(() => useProfile(false), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ---------------------------------------------------------------------------
// 4. usePublicProfile hook
// ---------------------------------------------------------------------------
describe('usePublicProfile', () => {
  beforeEach(setupProfileHandlers);

  it('fetches another user by ID', async () => {
    const { result } = renderHook(
      () => usePublicProfile(MOCK_PROFILE.id),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.username).toBe('alice');
  });

  it('does not fetch when id is undefined', () => {
    const { result } = renderHook(
      () => usePublicProfile(undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ---------------------------------------------------------------------------
// 5. useUpdateProfile hook
// ---------------------------------------------------------------------------
describe('useUpdateProfile', () => {
  beforeEach(setupProfileHandlers);

  it('updates profile and sets cache data on success', async () => {
    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ bio: 'Updated bio' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.bio).toBe('Updated bio');
  });
});

// ---------------------------------------------------------------------------
// 6. useSetLocation hook
// ---------------------------------------------------------------------------
describe('useSetLocation', () => {
  beforeEach(setupProfileHandlers);

  it('sets location via postcode', async () => {
    const { result } = renderHook(() => useSetLocation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ postcode: '1012 AB' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.neighborhood).toBe('Centrum');
  });

  it('sets location via coordinates', async () => {
    const { result } = renderHook(() => useSetLocation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ latitude: 52.37, longitude: 4.89 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.location.latitude).toBe(52.37);
  });
});

// ---------------------------------------------------------------------------
// 7. useCompleteOnboarding hook
// ---------------------------------------------------------------------------
describe('useCompleteOnboarding', () => {
  beforeEach(setupProfileHandlers);

  it('marks onboarding as complete', async () => {
    const { result } = renderHook(() => useCompleteOnboarding(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.onboarding_completed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 8. useDeleteAccount hook
// ---------------------------------------------------------------------------
describe('useDeleteAccount', () => {
  beforeEach(setupProfileHandlers);

  it('requests account deletion with password', async () => {
    const { result } = renderHook(() => useDeleteAccount(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ password: 'mypassword' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.detail).toBe('Account scheduled for deletion.');
    expect(result.current.data?.cancel_token).toBe('test-cancel-token');
  });
});

// ---------------------------------------------------------------------------
// 9. useCheckUsername hook
// ---------------------------------------------------------------------------
describe('useCheckUsername', () => {
  beforeEach(setupProfileHandlers);

  it('does not fetch when query is too short', () => {
    const { result } = renderHook(
      () => useCheckUsername('ab'),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('does not fetch when query matches current username', () => {
    const { result } = renderHook(
      () => useCheckUsername('alice', 'alice'),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
  });
});

// ---------------------------------------------------------------------------
// 8. Zod schemas
// ---------------------------------------------------------------------------
describe('profileEditSchema', () => {
  it('accepts valid profile data', () => {
    const result = profileEditSchema.safeParse({
      first_name: 'Alice',
      last_name: 'de Vries',
      bio: 'I love books',
      preferred_genres: ['Fiction'],
      preferred_language: 'nl',
      preferred_radius: 5000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects more than 5 genres', () => {
    const result = profileEditSchema.safeParse({
      first_name: 'Alice',
      last_name: 'de Vries',
      preferred_genres: ['A', 'B', 'C', 'D', 'E', 'F'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects bio over 300 chars', () => {
    const result = profileEditSchema.safeParse({
      first_name: 'Alice',
      last_name: 'de Vries',
      bio: 'x'.repeat(301),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid language', () => {
    const result = profileEditSchema.safeParse({
      first_name: 'Alice',
      last_name: 'de Vries',
      preferred_language: 'fr',
    });
    expect(result.success).toBe(false);
  });

  it('rejects radius below 500', () => {
    const result = profileEditSchema.safeParse({
      first_name: 'Alice',
      last_name: 'de Vries',
      preferred_radius: 100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects radius above 50000', () => {
    const result = profileEditSchema.safeParse({
      first_name: 'Alice',
      last_name: 'de Vries',
      preferred_radius: 60000,
    });
    expect(result.success).toBe(false);
  });
});

describe('locationSchema', () => {
  it('accepts a valid Dutch postcode', () => {
    const result = locationSchema.safeParse({ postcode: '1012 AB' });
    expect(result.success).toBe(true);
  });

  it('accepts coordinates', () => {
    const result = locationSchema.safeParse({
      latitude: 52.37,
      longitude: 4.89,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty input', () => {
    const result = locationSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects invalid postcode format', () => {
    const result = locationSchema.safeParse({ postcode: '123' });
    expect(result.success).toBe(false);
  });

  it('rejects latitude only (missing longitude)', () => {
    const result = locationSchema.safeParse({ latitude: 52.37 });
    expect(result.success).toBe(false);
  });
});
