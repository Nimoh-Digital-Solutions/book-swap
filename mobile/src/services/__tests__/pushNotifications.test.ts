import * as Notifications from 'expo-notifications';
import { http } from '@/services/http';
import { registerForPushNotifications, sendPushTokenToBackend } from '@/services/pushNotifications';

let mockIsDevice = true;

jest.mock('expo-device', () => ({
  __esModule: true,
  get isDevice() {
    return mockIsDevice;
  },
  deviceName: 'Test Phone',
}));

jest.mock('@/services/http', () => ({ http: { post: jest.fn(async () => ({ data: {} })) } }));

describe('pushNotifications', () => {
  beforeEach(() => {
    mockIsDevice = true;
    jest.clearAllMocks();
    jest.mocked(Notifications.getPermissionsAsync).mockResolvedValue({ status: 'granted' });
    jest.mocked(Notifications.requestPermissionsAsync).mockResolvedValue({ status: 'granted' });
    jest.mocked(Notifications.getExpoPushTokenAsync).mockResolvedValue({ data: 'expo-push-token' });
    jest.mocked(Notifications.setNotificationChannelAsync).mockResolvedValue();
  });

  it('registerForPushNotifications returns token when permissions granted', async () => {
    const token = await registerForPushNotifications();
    expect(token).toBe('expo-push-token');
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled();
  });

  it('registerForPushNotifications returns null on non-device', async () => {
    mockIsDevice = false;
    const token = await registerForPushNotifications();
    expect(token).toBeNull();
  });

  it('sendPushTokenToBackend sends correct payload', async () => {
    await sendPushTokenToBackend('my-token');

    expect(http.post).toHaveBeenCalledWith('/api/v1/users/me/devices/', {
      push_token: 'my-token',
      platform: expect.any(String),
      device_name: 'Test Phone',
    });
  });
});
