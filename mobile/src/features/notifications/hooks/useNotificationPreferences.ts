import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import { showErrorToast } from '@/components/Toast';
import type { NotificationPreferences, PatchNotificationPreferences } from '@/types';

const prefKeys = {
  all: ['notificationPreferences'] as const,
};

export function useNotificationPreferences() {
  return useQuery<NotificationPreferences>({
    queryKey: prefKeys.all,
    queryFn: async () => {
      const { data } = await http.get<NotificationPreferences>(
        API.notifications.preferences,
      );
      return data;
    },
  });
}

export function usePatchNotificationPreferences() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation<NotificationPreferences, Error, PatchNotificationPreferences>({
    mutationFn: async (payload) => {
      const { data } = await http.patch<NotificationPreferences>(
        API.notifications.preferences,
        payload,
      );
      return data;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: prefKeys.all });
      const previous = queryClient.getQueryData<NotificationPreferences>(prefKeys.all);

      if (previous) {
        queryClient.setQueryData<NotificationPreferences>(prefKeys.all, {
          ...previous,
          ...payload,
        });
      }

      return { previous };
    },
    onError: (_err, _payload, context) => {
      if ((context as { previous?: NotificationPreferences })?.previous) {
        queryClient.setQueryData(
          prefKeys.all,
          (context as { previous: NotificationPreferences }).previous,
        );
      }
      showErrorToast(t('notifications.pref.updateError'));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: prefKeys.all });
    },
  });
}
