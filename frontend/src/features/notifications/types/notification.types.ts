/**
 * notification.types.ts
 *
 * Type contracts for the notifications feature, aligned with the Django
 * backend serializers: NotificationSerializer and NotificationPreferencesSerializer.
 */

// ---------------------------------------------------------------------------
// Notification type enum (mirrors backend NotificationType choices)
// ---------------------------------------------------------------------------

export type NotificationType =
  | 'new_request'
  | 'request_accepted'
  | 'request_declined'
  | 'request_expired'
  | 'request_cancelled'
  | 'counter_proposed'
  | 'counter_approved'
  | 'swap_confirmed'
  | 'exchange_completed'
  | 'return_requested'
  | 'exchange_returned'
  | 'new_message'
  | 'rating_received';

// ---------------------------------------------------------------------------
// Core shapes
// ---------------------------------------------------------------------------

export interface Notification {
  id: string;
  notification_type: NotificationType;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

/** Response shape from GET /api/v1/notifications/ */
export interface NotificationListResponse {
  unread_count: number;
  results: Notification[];
}

/** Response shape from POST mark-read / mark-all-read */
export interface MarkReadResponse {
  marked: number;
}

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

export interface NotificationPreferences {
  email_new_request: boolean;
  email_request_accepted: boolean;
  email_request_declined: boolean;
  email_new_message: boolean;
  email_exchange_completed: boolean;
  email_rating_received: boolean;
}

export type PatchNotificationPreferences = Partial<NotificationPreferences>;

// ---------------------------------------------------------------------------
// WebSocket push event
// ---------------------------------------------------------------------------

/** Message emitted by the NotificationConsumer via channel layer. */
export interface NotificationPushEvent {
  type: 'notification.push';
  notification: Notification;
}
