/**
 * UnsubscribePage.tsx
 *
 * One-click email unsubscribe landing page — no authentication required.
 * Reached via the unsubscribe link in notification emails.
 *
 * Route: /notifications/unsubscribe/:token
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';

import { notificationService } from '@features/notifications';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle } from 'lucide-react';

export function UnsubscribePage(): ReactElement {
  const { t } = useTranslation('notifications');
  const { token = '' } = useParams<{ token: string }>();

  const { isLoading, isSuccess, isError } = useQuery({
    queryKey: ['notifications', 'unsubscribe', token],
    queryFn: () => notificationService.unsubscribe(token),
    enabled: token.length > 0,
    retry: false,
    staleTime: Infinity,
  });

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      {isLoading && (
        <p className="text-[#8C9C92] text-sm animate-pulse">
          {t('unsubscribe.loading')}
        </p>
      )}

      {isSuccess && (
        <div className="space-y-4 max-w-sm">
          <CheckCircle
            className="w-12 h-12 text-green-400 mx-auto"
            aria-hidden="true"
          />
          <h1 className="text-xl font-bold text-white">
            {t('unsubscribe.success')}
          </h1>
          <p className="text-sm text-[#8C9C92]">
            {t('unsubscribe.successDetail')}
          </p>
          <Link
            to="/"
            className="inline-block mt-4 bg-[#E4B643] hover:bg-[#D4A633] text-[#152018] px-6 py-2.5 rounded-full font-bold text-sm transition-colors"
          >
            {t('unsubscribe.goHome')}
          </Link>
        </div>
      )}

      {isError && (
        <div className="space-y-4 max-w-sm">
          <XCircle
            className="w-12 h-12 text-red-400 mx-auto"
            aria-hidden="true"
          />
          <h1 className="text-xl font-bold text-white">
            {t('unsubscribe.error')}
          </h1>
          <Link
            to="/"
            className="inline-block mt-4 bg-[#E4B643] hover:bg-[#D4A633] text-[#152018] px-6 py-2.5 rounded-full font-bold text-sm transition-colors"
          >
            {t('unsubscribe.goHome')}
          </Link>
        </div>
      )}
    </main>
  );
}
