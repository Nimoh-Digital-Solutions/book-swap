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

export interface Notification {
  id: string;
  notification_type: NotificationType;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationListResponse {
  unread_count: number;
  results: Notification[];
}

export interface MarkReadResponse {
  marked: number;
}

export interface NotificationPreferences {
  email_new_request: boolean;
  email_request_accepted: boolean;
  email_request_declined: boolean;
  email_new_message: boolean;
  email_exchange_completed: boolean;
  email_rating_received: boolean;
}

export type PatchNotificationPreferences = Partial<NotificationPreferences>;

export interface NotificationPushEvent {
  type: 'notification.push';
  notification: Notification;
}
