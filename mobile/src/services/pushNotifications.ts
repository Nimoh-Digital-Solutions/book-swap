import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';

/** Foreground / tap behaviour is registered in `initNotificationHandlers` (`@/services/notificationHandler`). */

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as
    | string
    | undefined;
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  return tokenData.data;
}

export async function sendPushTokenToBackend(token: string): Promise<void> {
  await http.post(API.users.meDevices, {
    push_token: token,
    platform: Platform.OS,
    device_name: Device.deviceName ?? 'Unknown',
  });
}
