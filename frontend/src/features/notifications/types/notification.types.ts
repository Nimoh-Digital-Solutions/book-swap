/**
 * notification.types.ts
 *
 * Re-exports from `@shared` — see `packages/shared/src/types/notification.ts`
 * for the canonical contracts (the BookSwap source of truth shared with the
 * mobile app).
 *
 * Web-local additions (if any) live below the re-export block.
 */

export type {
  MarkReadResponse,
  Notification,
  NotificationListResponse,
  NotificationPreferences,
  NotificationPushEvent,
  NotificationType,
  PatchNotificationPreferences,
} from '@shared/types/notification';
