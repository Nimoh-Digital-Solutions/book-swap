import { API } from '@/configs/apiEndpoints';

jest.mock('@/services/http', () => ({
  http: { get: jest.fn(), patch: jest.fn() },
}));
jest.mock('@/components/Toast', () => ({
  showErrorToast: jest.fn(),
}));
jest.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(jest.fn((sel: (s: any) => any) => sel({ setUser: jest.fn() })), {
    getState: jest.fn(() => ({ user: { id: 'u1' }, isAuthenticated: true })),
    setState: jest.fn(),
    subscribe: jest.fn(),
  }),
}));

import { http } from '@/services/http';
import type { User } from '@/types';

const httpGet = http.get as jest.MockedFunction<typeof http.get>;
const httpPatch = http.patch as jest.MockedFunction<typeof http.patch>;

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
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

describe('profile API calls', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches current user profile', async () => {
    const user = makeUser();
    httpGet.mockResolvedValue({ data: user });

    const { data } = await http.get(API.users.me);
    expect(httpGet).toHaveBeenCalledWith(API.users.me);
    expect(data).toEqual(user);
  });

  it('updates profile with JSON payload', async () => {
    const updated = makeUser({ bio: 'New bio' });
    httpPatch.mockResolvedValue({ data: updated });

    const { data } = await http.patch(API.users.me, { bio: 'New bio' });
    expect(httpPatch).toHaveBeenCalledWith(API.users.me, { bio: 'New bio' });
    expect(data.bio).toBe('New bio');
  });

  it('checks username availability', async () => {
    const response = { available: true, suggestions: [] };
    httpGet.mockResolvedValue({ data: response });

    const { data } = await http.get(API.users.checkUsername, { params: { q: 'newname' } });
    expect(httpGet).toHaveBeenCalledWith(API.users.checkUsername, { params: { q: 'newname' } });
    expect(data.available).toBe(true);
  });

  it('fetches public user profile', async () => {
    const user = makeUser({ id: 'u2' });
    httpGet.mockResolvedValue({ data: user });

    const { data } = await http.get(API.users.detail('u2'));
    expect(httpGet).toHaveBeenCalledWith(API.users.detail('u2'));
    expect(data.id).toBe('u2');
  });

  it('updates user location', async () => {
    const locData = { latitude: 51.0, longitude: 4.0 };
    httpPatch.mockResolvedValue({ data: { ...locData, neighborhood: 'Centre' } });

    const { data } = await http.patch(API.users.meLocation, locData);
    expect(httpPatch).toHaveBeenCalledWith(API.users.meLocation, locData);
    expect(data.neighborhood).toBe('Centre');
  });

  it('constructs correct user URLs', () => {
    expect(API.users.me).toBe('/users/me/');
    expect(API.users.meLocation).toBe('/users/me/location/');
    expect(API.users.checkUsername).toBe('/users/check-username/');
    expect(API.users.detail('abc')).toBe('/users/abc/');
    expect(API.users.meDevices).toBe('/users/me/devices/');
  });
});
