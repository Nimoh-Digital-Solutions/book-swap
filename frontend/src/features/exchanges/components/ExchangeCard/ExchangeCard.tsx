import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { LocaleLink } from '@components/common/LocaleLink/LocaleLink';
import { ArrowRightLeft, BookOpen } from 'lucide-react';

import type { ExchangeListItem } from '../../types/exchange.types';
import { ExchangeStatusBadge } from '../ExchangeStatusBadge/ExchangeStatusBadge';

interface ExchangeCardProps {
  exchange: ExchangeListItem;
}

function BookThumb({ src, alt }: { src: string | null; alt: string }): ReactElement {
  return src ? (
    <img src={src} alt={alt} className="w-12 h-16 rounded object-cover flex-shrink-0" loading="lazy" />
  ) : (
    <div className="w-12 h-16 rounded bg-[#152018] flex items-center justify-center flex-shrink-0">
      <BookOpen className="w-5 h-5 text-[#28382D]" aria-hidden="true" />
    </div>
  );
}

export function ExchangeCard({ exchange }: ExchangeCardProps): ReactElement {
  const { t } = useTranslation('exchanges');

  const requestedPhoto = exchange.requested_book.primary_photo ?? exchange.requested_book.cover_url;
  const offeredPhoto = exchange.offered_book.primary_photo ?? exchange.offered_book.cover_url;

  return (
    <LocaleLink
      to={`/exchanges/${exchange.id}`}
      className="block bg-[#1A251D] rounded-xl border border-[#28382D] p-4 hover:border-[#E4B643]/40 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <ExchangeStatusBadge status={exchange.status} />
        <time className="text-xs text-[#8C9C92]" dateTime={exchange.created_at}>
          {new Date(exchange.created_at).toLocaleDateString()}
        </time>
      </div>

      <div className="flex items-center gap-3">
        <BookThumb src={requestedPhoto} alt={exchange.requested_book.title} />
        <ArrowRightLeft className="w-4 h-4 text-[#8C9C92] flex-shrink-0" aria-hidden="true" />
        <BookThumb src={offeredPhoto} alt={exchange.offered_book.title} />
        <div className="min-w-0 ml-2">
          <p className="text-sm text-white truncate">{exchange.requested_book.title}</p>
          <p className="text-xs text-[#8C9C92] truncate">
            {t('card.with', 'with')} {exchange.requester.username === exchange.owner.username
              ? exchange.requester.username
              : `${exchange.requester.username} & ${exchange.owner.username}`}
          </p>
        </div>
      </div>
    </LocaleLink>
  );
}
