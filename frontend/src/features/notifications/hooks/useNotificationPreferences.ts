/**
 * useNotificationPreferences.ts
 *
 * TanStack Query hook for fetching email notification preferences.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { notificationService } from '../services/notification.service';
import type { NotificationPreferences } from '../types/notification.types';
import { notificationKeys } from './notificationKeys';

export function useNotificationPreferences(): UseQueryResult<NotificationPreferences> {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => notificationService.getPreferences(),
  });
}
