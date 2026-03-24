import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuthStore } from '@features/auth/stores/authStore';
import { RequestSwapButton } from '@features/exchanges/components/RequestSwapButton/RequestSwapButton';
import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { ArrowLeft, BookOpen, Edit2, MapPin, User } from 'lucide-react';

import { ConditionBadge } from '../components/ConditionBadge/ConditionBadge';
import { useBook } from '../hooks/useBook';

export function BookDetailPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const currentUserId = useAuthStore(s => s.user?.id);
  const { data: book, isLoading, isError } = useBook(id!);

  useDocumentTitle(book?.title ?? routeMetadata[PATHS.BOOK_DETAIL].title);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-[#8C9C92]">{t('common.loading', 'Loading…')}</div>
      </div>
    );
  }

  if (isError || !book) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">{t('books.detail.notFound', 'Book not found.')}</p>
      </div>
    );
  }

  const isOwner = book.owner?.id === currentUserId;
  const photos = book.photos ?? [];
  const bookId = book.id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-[#8C9C92] hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {isOwner
          ? t('books.detail.backToShelf', 'Back to My Shelf')
          : t('books.detail.backToCatalogue', 'Back to Catalogue')}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Photo gallery */}
        <div className="space-y-3">
          {/* Main photo */}
          <div className="aspect-[3/4] bg-[#1A251D] rounded-2xl border border-[#28382D] overflow-hidden">
            {photos.length > 0 ? (
              <img
                src={photos[0]!.image}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-[#28382D]" aria-hidden="true" />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {photos.slice(1).map((photo, idx) => (
                <div key={photo.id} className="aspect-square rounded-lg overflow-hidden border border-[#28382D]">
                  <img
                    src={photo.image}
                    alt={`${idx + 2}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">{book.title}</h1>
            <p className="text-[#8C9C92] text-lg">
              {t('books.card.by', { author: book.author })}
            </p>
          </div>

          {/* Action button */}
          {isOwner ? (
            <Link
              to={`/books/${book.id}/edit`}
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#28382D] rounded-xl text-sm font-medium text-[#E4B643] hover:bg-[#28382D]/50 transition-colors"
            >
              <Edit2 className="w-4 h-4" aria-hidden="true" />
              {t('books.detail.editListing', 'Edit Listing')}
            </Link>
          ) : (
            <RequestSwapButton
              bookId={bookId}
              bookOwnerId={book.owner?.id ?? ''}
              currentUserId={currentUserId}
            />
          )}

          {/* Meta details */}
          <div className="bg-[#1A251D] rounded-2xl border border-[#28382D] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#8C9C92] text-sm">{t('books.detail.condition', 'Condition')}</span>
              <ConditionBadge condition={book.condition} />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#8C9C92] text-sm">{t('books.detail.language', 'Language')}</span>
              <span className="text-white text-sm">
                {t(`books.addBook.languages.${book.language}`, book.language)}
              </span>
            </div>

            {book.genres && book.genres.length > 0 && (
              <div>
                <span className="text-[#8C9C92] text-sm block mb-2">{t('books.detail.genres', 'Genres')}</span>
                <div className="flex flex-wrap gap-2">
                  {book.genres.map(genre => (
                    <span key={genre} className="bg-[#152018] text-[#8C9C92] text-xs px-2.5 py-1 rounded-full border border-[#28382D]">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {book.isbn && (
              <div className="flex items-center justify-between">
                <span className="text-[#8C9C92] text-sm">{t('books.detail.isbn', 'ISBN')}</span>
                <span className="text-white text-sm font-mono">{book.isbn}</span>
              </div>
            )}

            {book.page_count && (
              <div className="flex items-center justify-between">
                <span className="text-[#8C9C92] text-sm">{t('books.detail.pageCount', 'Pages')}</span>
                <span className="text-white text-sm">{book.page_count}</span>
              </div>
            )}

            {book.publish_year && (
              <div className="flex items-center justify-between">
                <span className="text-[#8C9C92] text-sm">{t('books.detail.published', 'Published')}</span>
                <span className="text-white text-sm">{book.publish_year}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {book.description && (
            <div>
              <h2 className="text-sm font-medium text-[#8C9C92] mb-2">{t('books.detail.description', 'Description')}</h2>
              <p className="text-white text-sm leading-relaxed">{book.description}</p>
            </div>
          )}

          {/* Swap notes */}
          {book.notes && (
            <div>
              <h2 className="text-sm font-medium text-[#8C9C92] mb-2">{t('books.detail.notes', 'Swap Notes')}</h2>
              <p className="text-white text-sm leading-relaxed bg-[#1A251D] rounded-xl border border-[#28382D] p-4">{book.notes}</p>
            </div>
          )}

          {/* Owner card */}
          {book.owner && !isOwner && (
            <Link
              to={`/profile/${book.owner.id}`}
              className="flex items-center gap-3 bg-[#1A251D] rounded-xl border border-[#28382D] p-4 hover:border-[#E4B643]/50 transition-colors"
            >
              {book.owner.avatar ? (
                <img src={book.owner.avatar} alt={book.owner.username} className="w-10 h-10 rounded-xl object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#152018] border border-[#28382D] flex items-center justify-center">
                  <User className="w-5 h-5 text-[#5A6A60]" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white text-sm font-medium">{book.owner.username}</p>
                <p className="text-[#8C9C92] text-xs flex items-center gap-1">
                  <MapPin className="w-3 h-3" aria-hidden="true" />
                  {book.owner.neighborhood}
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
