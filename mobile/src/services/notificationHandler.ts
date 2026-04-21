import * as Notifications from 'expo-notifications';
import { navigationRef } from '@/navigation/navigationRef';
import { showInfoToast } from '@/components/Toast';
import { addBreadcrumb } from '@/lib/sentry';

let handlersInitialised = false;

const SAFE_BREADCRUMB_KEYS = new Set(['type', 'exchange_id', 'exchangeId', 'book_id', 'bookId']);

function sanitiseForBreadcrumb(data: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const key of Object.keys(data)) {
    if (SAFE_BREADCRUMB_KEYS.has(key)) {
      safe[key] = data[key];
    }
  }
  return safe;
}

function navigateFromPayload(data: Record<string, unknown>) {
  const type = String(data.type ?? '');
  const exchangeId =
    (data.exchange_id as string | undefined) ?? (data.exchangeId as string | undefined);
  const bookId = (data.book_id as string | undefined) ?? (data.bookId as string | undefined);

  if (!navigationRef.isReady()) return;

  if (
    (type === 'new_request' ||
      type === 'request_accepted' ||
      type === 'request_declined' ||
      type === 'counter_proposed' ||
      type === 'counter_approved' ||
      type === 'exchange_completed' ||
      type === 'exchange_updated' ||
      type === 'exchange' ||
      type === 'swap_request') &&
    exchangeId
  ) {
    navigationRef.navigate('Main', {
      screen: 'MessagesTab',
      params: {
        screen: 'ExchangeDetail',
        params: { exchangeId },
      },
    } as never);
    return;
  }

  if ((type === 'new_message' || type === 'chat_message' || type === 'message') && exchangeId) {
    navigationRef.navigate('Main', {
      screen: 'MessagesTab',
      params: {
        screen: 'Chat',
        params: { exchangeId },
      },
    } as never);
    return;
  }

  if ((type === 'book_available' || type === 'book' || type === 'wishlist_match') && bookId) {
    navigationRef.navigate('Main', {
      screen: 'HomeTab',
      params: {
        screen: 'BookDetail',
        params: { bookId },
      },
    } as never);
  }
}

/**
 * Registers Expo notification behaviour, foreground handling, tap / cold-start routing.
 * Call once after `NavigationContainer` is mounted (e.g. from `App`).
 */
export function initNotificationHandlers() {
  if (handlersInitialised) return;
  handlersInitialised = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    }),
  });

  Notifications.addNotificationReceivedListener((notification) => {
    const data = (notification.request.content.data ?? {}) as Record<string, unknown>;
    addBreadcrumb('notification', 'foreground', sanitiseForBreadcrumb(data));
    const title = notification.request.content.title;
    if (title) {
      showInfoToast(String(title), notification.request.content.body ?? undefined);
    }
  });

  Notifications.addNotificationResponseReceivedListener((response) => {
    const data = (response.notification.request.content.data ?? {}) as Record<string, unknown>;
    addBreadcrumb('notification', 'response', sanitiseForBreadcrumb(data));
    navigateFromPayload(data);
  });

  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (!response) return;
    const data = (response.notification.request.content.data ?? {}) as Record<string, unknown>;
    navigateFromPayload(data);
  });
}
