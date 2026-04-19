import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { LocaleLink } from '@components/common/LocaleLink/LocaleLink';
import { BookOpen } from 'lucide-react';

import type { BookListItem } from '../../types/book.types';
import { ConditionBadge } from '../ConditionBadge/ConditionBadge';

interface BookCardProps {
  book: BookListItem;
}

export function BookCard({ book }: BookCardProps): ReactElement {
  const { t } = useTranslation();

  const statusLabels: Record<string, string> = {
    available: t('books.card.available', 'Available'),
    in_exchange: t('books.card.in_exchange', 'In Exchange'),
    returned: t('books.card.returned', 'Returned'),
  };

  return (
    <LocaleLink
      to={`/books/${book.id}`}
      className="group block bg-[#1A251D] rounded-2xl border border-[#28382D] overflow-hidden hover:border-[#E4B643]/50 transition-colors"
    >
      {/* Cover image */}
      <div className="aspect-[3/4] bg-[#152018] relative overflow-hidden">
        {(book.primary_photo ?? book.cover_url) ? (
          <img
            src={(book.primary_photo ?? book.cover_url) as string}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-[#28382D]" aria-hidden="true" />
          </div>
        )}

        {/* Status overlay */}
        {book.status !== 'available' && (
          <div className="absolute top-2 right-2">
            <span className="bg-[#152018]/80 text-[#8C9C92] text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              {statusLabels[book.status] ?? book.status}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 group-hover:text-[#E4B643] transition-colors">
          {book.title}
        </h3>
        <p className="text-[#8C9C92] text-xs">
          {t('books.card.by', { author: book.author })}
        </p>
        <div className="flex items-center justify-between">
          <ConditionBadge condition={book.condition} />
          {book.owner && (
            <span className="text-[#5A6A60] text-xs truncate max-w-[50%]">
              {book.owner.neighborhood}
            </span>
          )}
        </div>
      </div>
    </LocaleLink>
  );
}
