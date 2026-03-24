import { type ReactElement,useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@data/useAppStore';
import { ShieldOff } from 'lucide-react';

import { useBlockUser } from '../../hooks/useBlockUser';

interface BlockUserButtonProps {
  userId: string;
  displayName: string;
}

export function BlockUserButton({ userId, displayName }: BlockUserButtonProps): ReactElement {
  const { t } = useTranslation('trust-safety');
  const addNotification = useAppStore((s) => s.addNotification);
  const blockMutation = useBlockUser();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleBlock = useCallback(() => {
    blockMutation.mutate(userId, {
      onSuccess: () => {
        addNotification(t('block.success'), { variant: 'success' });
        setShowConfirm(false);
      },
      onError: () => {
        addNotification(t('block.error'), { variant: 'error' });
      },
    });
  }, [userId, blockMutation, addNotification, t]);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-1.5 text-sm text-[#8C9C92] hover:text-red-400 transition-colors"
      >
        <ShieldOff className="w-4 h-4" aria-hidden="true" />
        {t('block.button')}
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          role="dialog"
          aria-modal="true"
          aria-label={t('block.confirmTitle', { name: displayName })}
        >
          <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-6 max-w-sm mx-4 space-y-4">
            <h2 className="text-lg font-bold text-white">
              {t('block.confirmTitle', { name: displayName })}
            </h2>
            <p className="text-sm text-[#8C9C92]">
              {t('block.confirmBody')}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm text-[#8C9C92] hover:text-white transition-colors"
              >
                {t('block.cancel')}
              </button>
              <button
                type="button"
                onClick={handleBlock}
                disabled={blockMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {blockMutation.isPending ? '…' : t('block.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
