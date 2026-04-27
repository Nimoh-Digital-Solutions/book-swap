import { Platform } from 'react-native';

type ImpactStyle = 'light' | 'medium' | 'heavy';

let Haptics: typeof import('expo-haptics') | null = null;

async function getHaptics() {
  if (Platform.OS === 'web') return null;
  if (!Haptics) {
    try {
      Haptics = await import('expo-haptics');
    } catch {
      return null;
    }
  }
  return Haptics;
}

const STYLE_MAP: Record<ImpactStyle, string> = {
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
};

export async function hapticImpact(style: ImpactStyle = 'light') {
  const h = await getHaptics();
  if (!h) return;
  const feedbackStyle =
    h.ImpactFeedbackStyle[STYLE_MAP[style] as keyof typeof h.ImpactFeedbackStyle];
  await h.impactAsync(feedbackStyle);
}

export async function hapticNotification(type: 'success' | 'warning' | 'error' = 'success') {
  const h = await getHaptics();
  if (!h) return;
  const typeMap: Record<string, string> = {
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
  };
  const notifType =
    h.NotificationFeedbackType[typeMap[type] as keyof typeof h.NotificationFeedbackType];
  await h.notificationAsync(notifType);
}

export async function hapticSelection() {
  const h = await getHaptics();
  if (!h) return;
  await h.selectionAsync();
}
