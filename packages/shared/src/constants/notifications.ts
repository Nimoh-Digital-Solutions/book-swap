import type { NotificationType } from '../types/notification';

export const NOTIFICATION_TYPES = [
  'new_request', 'request_accepted', 'request_declined', 'request_expired',
  'exchange_completed', 'new_message', 'rating_received',
] as const satisfies readonly NotificationType[];
