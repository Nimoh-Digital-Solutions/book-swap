/**
 * Notifications feature public API
 *
 * Import from '@features/notifications' in consuming code — never reach
 * into sub-directories directly from outside this feature.
 */

// Components
export type { NotificationBellProps } from './components/NotificationBell/NotificationBell';
export { NotificationBell } from './components/NotificationBell/NotificationBell';
export type { NotificationPanelProps } from './components/NotificationPanel/NotificationPanel';
export { NotificationPanel } from './components/NotificationPanel/NotificationPanel';
export { NotificationPreferencesSection } from './components/NotificationPreferencesSection/NotificationPreferencesSection';

// Pages
export { UnsubscribePage } from './pages/UnsubscribePage';

// Hooks
export { notificationKeys } from './hooks/notificationKeys';
export { useMarkAllNotificationsRead, useMarkNotificationRead, usePatchNotificationPreferences } from './hooks/useNotificationMutations';
export { useNotificationPreferences } from './hooks/useNotificationPreferences';
export { useNotifications } from './hooks/useNotifications';
export type { UseNotificationWebSocketOptions, UseNotificationWebSocketReturn } from './hooks/useNotificationWebSocket';
export { useNotificationWebSocket } from './hooks/useNotificationWebSocket';

// Service
export { notificationService } from './services/notification.service';

// Types
export type {
  MarkReadResponse,
  Notification,
  NotificationListResponse,
  NotificationPreferences,
  NotificationPushEvent,
  NotificationType,
  PatchNotificationPreferences,
} from './types/notification.types';
