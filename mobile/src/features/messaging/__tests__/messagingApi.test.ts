import { API } from '@/configs/apiEndpoints';

jest.mock('@/services/http', () => ({
  http: { get: jest.fn(), post: jest.fn() },
}));
jest.mock('@/components/Toast', () => ({ showInfoToast: jest.fn() }));
jest.mock('@/lib/offlineMutationQueue', () => ({
  enqueueMutation: jest.fn(),
}));
jest.mock('@/stores/authStore', () => ({
  useAuthStore: Object.assign(jest.fn((sel: (s: any) => any) => sel({ user: { id: 'u1', username: 'me' } })), {
    getState: jest.fn(() => ({ user: { id: 'u1' }, isAuthenticated: true })),
    setState: jest.fn(),
    subscribe: jest.fn(),
  }),
}));
jest.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: jest.fn(() => ({ isOffline: false })),
}));
jest.mock('@/lib/resolveMediaUrl', () => ({
  resolveMediaUrl: jest.fn((url: string) => url),
}));

import { http } from '@/services/http';
import type { Message, User } from '@/types';

const httpGet = http.get as jest.MockedFunction<typeof http.get>;
const httpPost = http.post as jest.MockedFunction<typeof http.post>;

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    exchange: 'ex-1',
    sender: { id: 'u1', username: 'me' } as User,
    content: 'hi',
    image: null,
    read_at: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('messaging API calls', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches messages for an exchange', async () => {
    const msgs = [makeMessage()];
    httpGet.mockResolvedValue({ data: { count: 1, next: null, previous: null, results: msgs } });

    const { data } = await http.get(API.messaging.messages('ex-1'));
    expect(httpGet).toHaveBeenCalledWith(API.messaging.messages('ex-1'));
    expect(data.results).toEqual(msgs);
  });

  it('sends a text message', async () => {
    const msg = makeMessage();
    httpPost.mockResolvedValue({ data: msg });

    const { data } = await http.post(API.messaging.messages('ex-1'), { content: 'hi' });
    expect(httpPost).toHaveBeenCalledWith(API.messaging.messages('ex-1'), { content: 'hi' });
    expect(data).toEqual(msg);
  });

  it('marks messages as read', async () => {
    httpPost.mockResolvedValue({ data: { ok: true } });

    await http.post(API.messaging.markRead('ex-1'));
    expect(httpPost).toHaveBeenCalledWith(API.messaging.markRead('ex-1'));
  });

  it('fetches meetup suggestions', async () => {
    const suggestions = [{ name: 'Café', lat: 51.0, lng: 4.0 }];
    httpGet.mockResolvedValue({ data: suggestions });

    const { data } = await http.get(API.messaging.meetupSuggestions('ex-1'));
    expect(httpGet).toHaveBeenCalledWith(API.messaging.meetupSuggestions('ex-1'));
    expect(data).toEqual(suggestions);
  });

  it('constructs correct messaging URLs', () => {
    expect(API.messaging.messages('abc')).toBe('/messaging/exchanges/abc/messages/');
    expect(API.messaging.markRead('abc')).toBe('/messaging/exchanges/abc/messages/mark-read/');
    expect(API.messaging.meetupSuggestions('abc')).toBe('/messaging/exchanges/abc/meetup-suggestions/');
  });
});
