import { z } from 'zod';

export const notificationTypeSchema = z.enum([
  'new_request', 'request_accepted', 'request_declined', 'request_expired',
  'exchange_completed', 'new_message', 'rating_received',
]);

export const notificationSchema = z.object({
  id: z.string(),
  notification_type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  link: z.string(),
  is_read: z.boolean(),
  created_at: z.string(),
});

export const notificationListResponseSchema = z.object({
  unread_count: z.number(),
  results: z.array(notificationSchema),
});

export const notificationPreferencesSchema = z.object({
  email_new_request: z.boolean(),
  email_request_accepted: z.boolean(),
  email_request_declined: z.boolean(),
  email_new_message: z.boolean(),
  email_exchange_completed: z.boolean(),
  email_rating_received: z.boolean(),
});

export type NotificationParsed = z.infer<typeof notificationSchema>;
export type NotificationListResponseParsed = z.infer<typeof notificationListResponseSchema>;
export type NotificationPreferencesParsed = z.infer<typeof notificationPreferencesSchema>;
