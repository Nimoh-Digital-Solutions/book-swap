/**
 * BrowseBookCard — reference-styled card with blurred cover background.
 * Clicking the image or title navigates to book detail.
 * "Request Swap" triggers the SwapFlowModal via onRequestSwap callback.
 */
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { LocaleLink } from '@components/common/LocaleLink/LocaleLink';

import type { BrowseBook } from '../../types/discovery.types';

const CONDITION_LABEL: Record<string, string> = {
  new: 'NEW',
  like_new: 'LIKE NEW',
  good: 'GOOD',
  acceptable: 'ACCEPTABLE',
};

const CONDITION_BADGE_CLASS: Record<string, string> = {
  new: 'bg-white text-gray-900',
  like_new: 'bg-white text-gray-900',
  good: 'bg-[#E4B643] text-gray-900',
  acceptable: 'bg-white text-gray-900',
};

interface BrowseBookCardProps {
  book: BrowseBook;
  onRequestSwap?: (book: BrowseBook) => void;
}

export function BrowseBookCard({ book, onRequestSwap }: BrowseBookCardProps): ReactElement {
  const { t } = useTranslation();
  const coverUrl = book.primary_photo ?? book.cover_url;

  return (
    <div className="bg-surface-dark rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors flex flex-col h-full">
      {/* Cover area with blurred background */}
      <LocaleLink
        to={`/books/${book.id}`}
        className="relative aspect-[3/4] bg-[#0f1a12] p-6 flex items-center justify-center overflow-hidden"
        aria-label={t('books.card.viewDetail', { title: book.title })}
      >
        {coverUrl && (
          <div
            className="absolute inset-0 opacity-40 blur-xl scale-110"
            style={{
              backgroundImage: `url(${coverUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            aria-hidden="true"
          />
        )}

        {/* Condition badge */}
        <div className="absolute top-4 left-4 z-20">
          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${CONDITION_BADGE_CLASS[book.condition] ?? 'bg-white text-gray-900'}`}
          >
            {CONDITION_LABEL[book.condition] ?? book.condition}
          </span>
        </div>

        {/* Cover image / placeholder */}
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={book.title}
            className="relative z-10 w-full h-full object-contain shadow-2xl"
            loading="lazy"
          />
        ) : (
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[#28382D] text-6xl" aria-hidden="true">
              menu_book
            </span>
          </div>
        )}
      </LocaleLink>

      {/* Card body */}
      <div className="p-5 flex flex-col flex-1">
        <LocaleLink to={`/books/${book.id}`} className="block mb-1 group">
          <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-[#E4B643] transition-colors">
            {book.title}
          </h3>
        </LocaleLink>
        <p className="text-gray-400 text-sm mb-4">{book.author}</p>

        <div className="flex items-center gap-2 text-xs text-gray-300 mb-6 mt-auto">
          <span className="material-symbols-outlined text-[#E4B643] text-sm" aria-hidden="true">
            location_on
          </span>
          <span>{book.owner.neighborhood}</span>
          <span className="text-gray-500" aria-hidden="true">•</span>
          <span>{t('discovery.distance', { km: book.distance })}</span>
        </div>

        <button
          type="button"
          onClick={() => onRequestSwap?.(book)}
          className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-2.5 rounded-full transition-colors text-xs tracking-widest uppercase"
        >
          {t('discovery.requestSwap', 'Request Swap')}
        </button>
      </div>
    </div>
  );
}
