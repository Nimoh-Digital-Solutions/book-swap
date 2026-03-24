import { type ReactElement,useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@data/useAppStore';

import { useUnblockUser } from '../../hooks/useUnblockUser';

interface UnblockButtonProps {
  userId: string;
}

export function UnblockButton({ userId }: UnblockButtonProps): ReactElement {
  const { t } = useTranslation('trust-safety');
  const addNotification = useAppStore((s) => s.addNotification);
  const unblockMutation = useUnblockUser();

  const handleUnblock = useCallback(() => {
    unblockMutation.mutate(userId, {
      onSuccess: () => {
        addNotification(t('unblock.success'), { variant: 'success' });
      },
      onError: () => {
        addNotification(t('unblock.error'), { variant: 'error' });
      },
    });
  }, [userId, unblockMutation, addNotification, t]);

  return (
    <button
      type="button"
      onClick={handleUnblock}
      disabled={unblockMutation.isPending}
      className="px-3 py-1.5 text-sm bg-[#28382D] text-white rounded-lg hover:bg-[#354A3D] transition-colors disabled:opacity-50"
    >
      {unblockMutation.isPending ? '…' : t('unblock.button')}
    </button>
  );
}
