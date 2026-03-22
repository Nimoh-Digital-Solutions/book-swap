import { type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import type { BrowseBook } from '../../types/discovery.types';

interface BookPopupProps {
  books: BrowseBook[];
}

export function BookPopup({ books }: BookPopupProps): ReactElement {
  const { t } = useTranslation();

  return (
    <div className="space-y-3 min-w-[200px] max-w-[260px]">
      {books.map(book => (
        <div key={book.id} className="flex gap-3">
          {/* Cover thumbnail */}
          <div className="w-12 h-16 shrink-0 rounded overflow-hidden bg-[#28382D]">
            {book.primary_photo ?? book.cover_url ? (
              <img
                src={book.primary_photo ?? book.cover_url}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#5A6A60] text-xs">
                📚
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#152018] truncate">{book.title}</p>
            <p className="text-xs text-gray-500 truncate">
              {t('discovery.bookPopup.by', 'by')} {book.author}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {book.condition.replace('_', ' ')}
            </p>
            <p className="text-xs text-gray-400">
              {book.distance < 1
                ? t('discovery.bookPopup.lessThan1km', '< 1 km')
                : `~${book.distance} km`}
            </p>
            <Link
              to={`/books/${book.id}`}
              className="text-xs font-medium text-[#E4B643] hover:underline"
            >
              {t('discovery.bookPopup.viewBook', 'View Book →')}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
