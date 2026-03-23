/**
 * useNotificationMutations.ts
 *
 * TanStack Query mutation hooks for notification actions.
 * Each mutation invalidates the notification list cache on success.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { notificationService } from '../services/notification.service';
import type {
  MarkReadResponse,
  NotificationPreferences,
  PatchNotificationPreferences,
} from '../types/notification.types';
import { notificationKeys } from './notificationKeys';

// ---------------------------------------------------------------------------
// Mark single notification read
// ---------------------------------------------------------------------------

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation<MarkReadResponse, Error, string>({
    mutationFn: (id) => notificationService.markRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}

// ---------------------------------------------------------------------------
// Mark all notifications read
// ---------------------------------------------------------------------------

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation<MarkReadResponse, Error, void>({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.list() });
    },
  });
}

// ---------------------------------------------------------------------------
// Update notification preferences
// ---------------------------------------------------------------------------

export function usePatchNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation<
    NotificationPreferences,
    Error,
    PatchNotificationPreferences
  >({
    mutationFn: (payload) => notificationService.patchPreferences(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationKeys.preferences() });
    },
  });
}
