/**
 * useNotifications.ts
 *
 * TanStack Query hook for fetching the notification list + unread count.
 */
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { notificationService } from '../services/notification.service';
import type { NotificationListResponse } from '../types/notification.types';
import { notificationKeys } from './notificationKeys';

export function useNotifications(): UseQueryResult<NotificationListResponse> {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: () => notificationService.list(),
    staleTime: 30_000,
  });
}
