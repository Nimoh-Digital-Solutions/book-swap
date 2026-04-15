import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyPlaceholder } from '@components/common';
import { LocaleLink } from '@components/common/LocaleLink/LocaleLink';
import { useAppStore } from '@data/useAppStore';
import { useDocumentTitle } from '@hooks';
import { useLocaleNavigate } from '@hooks/useLocaleNavigate';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { ArrowLeft, BookOpen, Inbox } from 'lucide-react';

import { ExchangeStatusBadge } from '../components/ExchangeStatusBadge/ExchangeStatusBadge';
import { useAcceptExchange, useDeclineExchange } from '../hooks/useExchangeMutations';
import { useIncomingRequests } from '../hooks/useIncomingRequests';
import type { ExchangeListItem } from '../types/exchange.types';

function IncomingCard({ exchange }: { exchange: ExchangeListItem }): ReactElement {
  const { t } = useTranslation('exchanges');
  const navigate = useLocaleNavigate();
  const addNotification = useAppStore(s => s.addNotification);
  const acceptMutation = useAcceptExchange();
  const declineMutation = useDeclineExchange();

  const requestedPhoto = exchange.requested_book.primary_photo ?? exchange.requested_book.cover_url;
  const offeredPhoto = exchange.offered_book.primary_photo ?? exchange.offered_book.cover_url;

  const handleAccept = () => {
    acceptMutation.mutate(exchange.id, {
      onSuccess: () => {
        addNotification(t('incoming.acceptSuccess', 'Request accepted!'), { variant: 'success' });
        void navigate(`/exchanges/${exchange.id}`);
      },
      onError: () => addNotification(t('incoming.acceptError', 'Failed to accept request.'), { variant: 'error' }),
    });
  };

  const handleDecline = () => {
    declineMutation.mutate({ id: exchange.id }, {
      onSuccess: () => addNotification(t('incoming.declineSuccess', 'Request declined.'), { variant: 'success' }),
      onError: () => addNotification(t('incoming.declineError', 'Failed to decline request.'), { variant: 'error' }),
    });
  };

  const busy = acceptMutation.isPending || declineMutation.isPending;

  return (
    <div className="bg-[#1A251D] rounded-xl border border-[#28382D] p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#28382D] flex items-center justify-center text-xs text-white font-bold">
            {exchange.requester.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{exchange.requester.username}</p>
            <p className="text-xs text-[#8C9C92]">
              {exchange.requester.swap_count} {t('incoming.swaps', 'swaps')}
            </p>
          </div>
        </div>
        <ExchangeStatusBadge status={exchange.status} />
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 text-center">
          <p className="text-xs text-[#8C9C92] mb-1">{t('incoming.theyWant', 'They want')}</p>
          {requestedPhoto ? (
            <img src={requestedPhoto} alt={exchange.requested_book.title} className="w-14 h-20 rounded object-cover mx-auto" />
          ) : (
            <div className="w-14 h-20 rounded bg-[#152018] flex items-center justify-center mx-auto">
              <BookOpen className="w-5 h-5 text-[#28382D]" aria-hidden="true" />
            </div>
          )}
          <p className="text-xs text-white mt-1 truncate">{exchange.requested_book.title}</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-xs text-[#8C9C92] mb-1">{t('incoming.theyOffer', 'They offer')}</p>
          {offeredPhoto ? (
            <img src={offeredPhoto} alt={exchange.offered_book.title} className="w-14 h-20 rounded object-cover mx-auto" />
          ) : (
            <div className="w-14 h-20 rounded bg-[#152018] flex items-center justify-center mx-auto">
              <BookOpen className="w-5 h-5 text-[#28382D]" aria-hidden="true" />
            </div>
          )}
          <p className="text-xs text-white mt-1 truncate">{exchange.offered_book.title}</p>
        </div>
      </div>

      {exchange.message && (
        <p className="text-sm text-[#8C9C92] italic mb-4">&ldquo;{exchange.message}&rdquo;</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAccept}
          disabled={busy}
          className="flex-1 px-4 py-2 bg-[#E4B643] hover:bg-[#d9b93e] text-[#152018] font-bold text-sm rounded-full transition-colors disabled:opacity-50"
        >
          {t('incoming.accept', 'Accept')}
        </button>
        <button
          type="button"
          onClick={handleDecline}
          disabled={busy}
          className="flex-1 px-4 py-2 bg-[#28382D] hover:bg-[#344a3a] text-white font-medium text-sm rounded-full transition-colors disabled:opacity-50"
        >
          {t('incoming.decline', 'Decline')}
        </button>
        <LocaleLink
          to={`/exchanges/${exchange.id}`}
          className="px-4 py-2 border border-[#28382D] hover:border-[#8C9C92] text-[#8C9C92] text-sm rounded-full transition-colors text-center"
        >
          {t('incoming.view', 'View')}
        </LocaleLink>
      </div>
    </div>
  );
}

export default function IncomingRequestsPage(): ReactElement {
  const { t } = useTranslation('exchanges');
  const navigate = useLocaleNavigate();

  useDocumentTitle(routeMetadata[PATHS.INCOMING_REQUESTS].title);

  const { data: requests, isLoading, isError } = useIncomingRequests();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-[#8C9C92]">{t('common.loading', 'Loading…')}</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">{t('error.load', 'Unable to load requests.')}</p>
      </div>
    );
  }

  const items = requests ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" style={{ marginInline: 'auto' }}>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-[#8C9C92] hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {t('incoming.back', 'Back to Exchanges')}
      </button>

      <h1 className="text-3xl font-bold text-white mb-8">{t('incoming.title', 'Incoming Requests')}</h1>

      {items.length === 0 ? (
        <EmptyPlaceholder
          icon={Inbox}
          title={t('incoming.empty', 'No incoming requests')}
          description={t(
            'incoming.emptyHint',
            'When someone requests one of your books, it will appear here.',
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(exchange => (
            <IncomingCard key={exchange.id} exchange={exchange} />
          ))}
        </div>
      )}
    </div>
  );
}
