import { API } from '@/configs/apiEndpoints';

jest.mock('@/services/http', () => ({
  http: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));
jest.mock('@/components/Toast', () => ({
  showErrorToast: jest.fn(),
  showInfoToast: jest.fn(),
}));
jest.mock('@/services/websocket', () => ({
  wsManager: { on: jest.fn(() => jest.fn()) },
}));

import { http } from '@/services/http';
import type { Notification } from '@/types';

const httpGet = http.get as jest.MockedFunction<typeof http.get>;
const httpPost = http.post as jest.MockedFunction<typeof http.post>;
const httpPatch = http.patch as jest.MockedFunction<typeof http.patch>;

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'n-1',
    type: 'exchange_requested',
    title: 'New request',
    message: 'Someone wants your book',
    data: {},
    read_at: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('notification API calls', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches notifications list', async () => {
    const notifs = [makeNotification()];
    httpGet.mockResolvedValue({ data: { unread_count: 1, results: notifs } });

    const { data } = await http.get(API.notifications.list);
    expect(httpGet).toHaveBeenCalledWith(API.notifications.list);
    expect(data.results).toEqual(notifs);
    expect(data.unread_count).toBe(1);
  });

  it('marks a single notification as read', async () => {
    httpPost.mockResolvedValue({ data: {} });

    await http.post(API.notifications.markRead('n-1'));
    expect(httpPost).toHaveBeenCalledWith(API.notifications.markRead('n-1'));
  });

  it('marks all notifications as read', async () => {
    httpPost.mockResolvedValue({ data: {} });

    await http.post(API.notifications.markAllRead);
    expect(httpPost).toHaveBeenCalledWith(API.notifications.markAllRead);
  });

  it('fetches notification preferences', async () => {
    const prefs = { exchange_requested: true, message_received: true };
    httpGet.mockResolvedValue({ data: prefs });

    const { data } = await http.get(API.notifications.preferences);
    expect(httpGet).toHaveBeenCalledWith(API.notifications.preferences);
    expect(data).toEqual(prefs);
  });

  it('patches notification preferences', async () => {
    const updated = { exchange_requested: false };
    httpPatch.mockResolvedValue({ data: updated });

    const { data } = await http.patch(API.notifications.preferences, updated);
    expect(httpPatch).toHaveBeenCalledWith(API.notifications.preferences, updated);
    expect(data).toEqual(updated);
  });

  it('constructs correct notification URLs', () => {
    expect(API.notifications.list).toBe('/notifications/');
    expect(API.notifications.markRead('xyz')).toBe('/notifications/xyz/read/');
    expect(API.notifications.markAllRead).toBe('/notifications/mark-all-read/');
    expect(API.notifications.preferences).toBe('/notifications/preferences/');
  });
});
