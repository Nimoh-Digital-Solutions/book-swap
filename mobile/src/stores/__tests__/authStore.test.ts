import type { User } from '@/types';
import { useAuthStore } from '@/stores/authStore';

jest.mock('@/lib/storage', () => ({
  tokenStorage: {
    getAccess: jest.fn(() => null),
    getRefresh: jest.fn(() => null),
    setTokens: jest.fn(),
    clearAll: jest.fn(),
    clearPushToken: jest.fn(),
    getBiometricEnabled: jest.fn(() => false),
    setBiometricEnabled: jest.fn(),
  },
  secureUserStorage: {
    get: jest.fn(() => null),
    set: jest.fn(),
    remove: jest.fn(),
  },
}));

jest.mock('@/lib/offlineMutationQueue', () => ({
  clearMutationQueue: jest.fn(),
}));

jest.mock('@/lib/queryClient', () => ({ queryClient: { clear: jest.fn() } }));

jest.mock('@/features/auth/api/auth.api', () => ({
  authApi: {
    getMe: jest.fn(),
  },
}));

jest.mock('@/lib/sentry', () => ({
  setSentryUser: jest.fn(),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  initSentry: jest.fn(),
  reactNavigationIntegration: { registerNavigationContainer: jest.fn() },
  wrapRootComponent: jest.fn((c: unknown) => c),
}));

import { authApi } from '@/features/auth/api/auth.api';
import { tokenStorage, secureUserStorage } from '@/lib/storage';
import { clearMutationQueue } from '@/lib/offlineMutationQueue';
import { queryClient } from '@/lib/queryClient';
import { setSentryUser } from '@/lib/sentry';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'a@b.com',
    username: 'tester',
    first_name: 'T',
    last_name: 'E',
    date_of_birth: null,
    bio: '',
    avatar: null,
    location: null,
    neighborhood: '',
    preferred_genres: [],
    preferred_language: 'en',
    preferred_radius: 10,
    avg_rating: 0,
    swap_count: 0,
    rating_count: 0,
    profile_public: true,
    onboarding_completed: true,
    email_verified: true,
    created_at: '2020-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('useAuthStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(authApi.getMe).mockRejectedValue(new Error('network'));
    useAuthStore.setState({ user: null, isAuthenticated: false, isHydrated: false });
  });

  it('initial state is not authenticated and not hydrated', () => {
    const { user, isAuthenticated, isHydrated } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(isAuthenticated).toBe(false);
    expect(isHydrated).toBe(false);
  });

  it('setAuth stores tokens and sets user', async () => {
    const user = makeUser();
    await useAuthStore.getState().setAuth(user, 'access-xyz', 'refresh-xyz');

    expect(tokenStorage.setTokens).toHaveBeenCalledWith('access-xyz', 'refresh-xyz');
    expect(secureUserStorage.set).toHaveBeenCalledWith(JSON.stringify(user));
    expect(setSentryUser).toHaveBeenCalledWith(user.id);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
  });

  it('logout clears tokens, persisted user, query client, and Sentry user', async () => {
    const user = makeUser();
    await useAuthStore.getState().setAuth(user, 'a', 'b');
    await useAuthStore.getState().logout();

    expect(tokenStorage.clearAll).toHaveBeenCalled();
    expect(tokenStorage.clearPushToken).toHaveBeenCalled();
    expect(tokenStorage.setBiometricEnabled).toHaveBeenCalledWith(false);
    expect(secureUserStorage.remove).toHaveBeenCalled();
    expect(clearMutationQueue).toHaveBeenCalled();
    expect(queryClient.clear).toHaveBeenCalled();
    expect(setSentryUser).toHaveBeenCalledWith(null);

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('hydrate with valid tokens sets authenticated', async () => {
    const user = makeUser();
    jest.mocked(tokenStorage.getAccess).mockReturnValue('acc');
    jest.mocked(tokenStorage.getRefresh).mockReturnValue('ref');
    jest.mocked(secureUserStorage.get).mockReturnValue(JSON.stringify(user));

    await useAuthStore.getState().hydrate();

    expect(setSentryUser).toHaveBeenCalledWith(user.id);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isHydrated).toBe(true);
    expect(state.user).toEqual(user);
  });

  it('hydrate with no tokens stays unauthenticated', async () => {
    jest.mocked(tokenStorage.getAccess).mockReturnValue(null);
    jest.mocked(tokenStorage.getRefresh).mockReturnValue(null);
    jest.mocked(secureUserStorage.get).mockReturnValue(null);

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isHydrated).toBe(true);
    expect(state.user).toBeNull();
  });

  it('hydrate with corrupt user JSON still sets isHydrated', async () => {
    jest.mocked(tokenStorage.getAccess).mockReturnValue('acc');
    jest.mocked(tokenStorage.getRefresh).mockReturnValue('ref');
    jest.mocked(secureUserStorage.get).mockReturnValue('not-valid-json{');

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(state.isHydrated).toBe(true);
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
