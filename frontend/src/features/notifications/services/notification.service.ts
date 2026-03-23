/**
 * notification.service.ts
 *
 * Thin API wrappers for the notifications endpoints.
 * Consumed by TanStack Query hooks — never called directly from components.
 */
import { API } from '@configs/apiEndpoints';
import { http } from '@services';

import type {
  MarkReadResponse,
  NotificationListResponse,
  NotificationPreferences,
  PatchNotificationPreferences,
} from '../types/notification.types';

export const notificationService = {
  /** Fetch the last 50 in-app notifications + unread count. */
  async list(): Promise<NotificationListResponse> {
    const { data } = await http.get<NotificationListResponse>(
      API.notifications.list,
    );
    return data;
  },

  /** Mark a single notification as read. */
  async markRead(id: string): Promise<MarkReadResponse> {
    const { data } = await http.post<MarkReadResponse>(
      API.notifications.markRead(id),
    );
    return data;
  },

  /** Mark all unread notifications as read. */
  async markAllRead(): Promise<MarkReadResponse> {
    const { data } = await http.post<MarkReadResponse>(
      API.notifications.markAllRead,
    );
    return data;
  },

  /** Fetch email notification preferences. */
  async getPreferences(): Promise<NotificationPreferences> {
    const { data } = await http.get<NotificationPreferences>(
      API.notifications.preferences,
    );
    return data;
  },

  /** Partially update email notification preferences. */
  async patchPreferences(
    payload: PatchNotificationPreferences,
  ): Promise<NotificationPreferences> {
    const { data } = await http.patch<NotificationPreferences>(
      API.notifications.preferences,
      payload,
    );
    return data;
  },

  /** One-click unsubscribe via token (no auth required). */
  async unsubscribe(
    token: string,
  ): Promise<{ detail: string }> {
    const { data } = await http.get<{ detail: string }>(
      API.notifications.unsubscribe(token),
    );
    return data;
  },
};
