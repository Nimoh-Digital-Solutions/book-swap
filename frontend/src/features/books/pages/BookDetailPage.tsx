import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { BrandedLoader, SEOHead } from '@components';
import { EmptyPlaceholder } from '@components/common';
import { LocaleLink } from '@components/common/LocaleLink/LocaleLink';
import { useAppStore } from '@data/useAppStore';
import { useAuthStore } from '@features/auth/stores/authStore';
import type { BrowseBook } from '@features/discovery';
import { SwapFlowModal } from '@features/discovery';
import { useIsBlocked } from '@features/trust-safety';
import { useLocaleNavigate } from '@hooks/useLocaleNavigate';
import { PATHS, routeMetadata } from '@routes/config/paths';
import {
  ArrowLeft,
  ArrowLeftRight,
  BookOpen,
  Calendar,
  Clock,
  Edit2,
  Hash,
  Layers,
  ShieldCheck,
  Star,
  User,
} from 'lucide-react';

import { useAddWishlistItem } from '../hooks/useAddWishlistItem';
import { useBook } from '../hooks/useBook';

/** Returns a short human-readable relative time: "3d ago", "2w ago", etc. */
function relativeDate(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (days === 0) return 'Today';
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function BookDetailPage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useLocaleNavigate();
  const { id } = useParams<{ id: string }>();
  const currentUserId = useAuthStore(s => s.user?.id);
  const addNotification = useAppStore(s => s.addNotification);
  const { data: book, isLoading, isError } = useBook(id!);
  const addWishlist = useAddWishlistItem();
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const isOwnerBlocked = useIsBlocked(book?.owner?.id ?? '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <BrandedLoader size="lg" label={t('books.detail.loading', 'Loading book…')} fillParent={false} />
      </div>
    );
  }

  if (isError || !book) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#8C9C92] hover:text-white transition-colors mb-12 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
          <span className="text-sm font-bold uppercase tracking-widest">
            {t('books.detail.backToCatalogue', 'Back to Catalogue')}
          </span>
        </button>
        <EmptyPlaceholder
          icon={BookOpen}
          title={t('books.detail.notFound', 'Book not found')}
          description={t(
            'books.detail.notFoundHint',
            'This book may have been removed or is no longer available.',
          )}
          action={{ label: t('books.detail.browseCatalogue', 'Browse Catalogue'), href: PATHS.CATALOGUE }}
        />
      </div>
    );
  }

  const isOwner = book.owner?.id === currentUserId;
  const coverSrc = book.photos?.[0]?.image ?? book.cover_url ?? null;
  const genre = book.genres?.[0] ?? 'Book';
  const archivalId = book.id.slice(-6).toUpperCase();
  const ownerRating = parseFloat(book.owner?.avg_rating ?? '0');

  // Adapt Book → BrowseBook shape for SwapFlowModal
  const browseBook: BrowseBook = {
    id: book.id,
    title: book.title,
    author: book.author,
    cover_url: book.cover_url,
    condition: book.condition,
    language: book.language,
    status: 'available',
    primary_photo: book.photos?.[0]?.image ?? null,
    owner: { ...book.owner, location: null },
    distance: 0,
    created_at: book.created_at,
  };

  const handleAddToWishlist = () => {
    addWishlist.mutate(
      {
        title: book.title,
        author: book.author,
        ...(book.isbn ? { isbn: book.isbn } : {}),
        ...(book.cover_url ? { cover_url: book.cover_url } : {}),
      },
      {
        onSuccess: () =>
          addNotification(t('books.wishlist.addSuccess', 'Added to wishlist!'), { variant: 'success' }),
        onError: () =>
          addNotification(t('books.wishlist.addError', 'Failed to add to wishlist.'), { variant: 'error' }),
      },
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <SEOHead
        title={book?.title ?? routeMetadata[PATHS.BOOK_DETAIL].title}
        description={
          book
            ? `${book.title} by ${book.author} — ${book.condition} condition. Available for swapping on BookSwap.`
            : routeMetadata[PATHS.BOOK_DETAIL].description
        }
        path={book ? `/books/${book.id}` : PATHS.BOOK_DETAIL}
        image={book.photos?.[0]?.image ?? book.cover_url}
        jsonLd={
          book
            ? {
                '@type': 'Book',
                name: book.title,
                author: { '@type': 'Person', name: book.author },
                ...(book.isbn ? { isbn: book.isbn } : {}),
                ...(book.language ? { inLanguage: book.language } : {}),
                ...(book.genres?.[0] ? { genre: book.genres[0] } : {}),
                image: book.photos?.[0]?.image ?? book.cover_url,
                offers: {
                  '@type': 'Offer',
                  availability: 'https://schema.org/InStock',
                  price: '0',
                  priceCurrency: 'EUR',
                  description: `Available for swap — ${book.condition} condition`,
                },
              }
            : undefined
        }
      />
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[#8C9C92] hover:text-white transition-colors mb-12 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
        <span className="text-sm font-bold uppercase tracking-widest">
          {isOwner
            ? t('books.detail.backToShelf', 'Back to My Shelf')
            : t('books.detail.backToCatalogue', 'Back to Catalogue')}
        </span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* ── Left column: cover + quick stats ── */}
        <div className="lg:col-span-5">
          <div className="relative group">
            {/* Ambient glow */}
            <div
              className="absolute -inset-4 bg-[#E4B643]/10 blur-3xl rounded-[2rem] opacity-50 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            />

            {/* Cover */}
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] border border-[#28382D]">
              {coverSrc ? (
                <img
                  src={coverSrc}
                  alt={book.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#1A251D]">
                  <BookOpen className="w-20 h-20 text-[#28382D]" aria-hidden="true" />
                </div>
              )}

              {/* Condition badge */}
              <div className="absolute top-6 left-6">
                <span className="bg-[#E4B643] text-[#152018] text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter">
                  {t(`books.condition.${book.condition}`, book.condition.replace('_', ' '))}
                </span>
              </div>

              {/* Spine detail */}
              <div className="absolute inset-y-0 left-0 w-1.5 bg-black/20 border-r border-white/5" aria-hidden="true" />
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="bg-[#1A251D] border border-[#28382D] rounded-2xl p-4 text-center">
              <Clock className="w-5 h-5 text-[#E4B643] mx-auto mb-2" aria-hidden="true" />
              <span className="block text-[10px] uppercase tracking-widest font-bold text-[#8C9C92] mb-1">
                {t('books.detail.added', 'Added')}
              </span>
              <span className="text-white text-sm font-bold">{relativeDate(book.created_at)}</span>
            </div>
            <div className="bg-[#1A251D] border border-[#28382D] rounded-2xl p-4 text-center">
              <Layers className="w-5 h-5 text-[#E4B643] mx-auto mb-2" aria-hidden="true" />
              <span className="block text-[10px] uppercase tracking-widest font-bold text-[#8C9C92] mb-1">
                {t('books.detail.condition', 'Condition')}
              </span>
              <span className="text-white text-sm font-bold">
                {t(`books.condition.${book.condition}`, book.condition.replace('_', ' '))}
              </span>
            </div>
            <div className="bg-[#1A251D] border border-[#28382D] rounded-2xl p-4 text-center">
              <ArrowLeftRight className="w-5 h-5 text-[#E4B643] mx-auto mb-2" aria-hidden="true" />
              <span className="block text-[10px] uppercase tracking-widest font-bold text-[#8C9C92] mb-1">
                {t('books.detail.status', 'Status')}
              </span>
              <span className="text-white text-sm font-bold capitalize">
                {t(`books.status.${book.status}`, book.status)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Right column: details ── */}
        <div className="lg:col-span-7">
          {/* Genre + archival ID */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#E4B643] text-xs font-bold uppercase tracking-[0.2em]">{genre}</span>
            <div className="w-1 h-1 bg-[#28382D] rounded-full" aria-hidden="true" />
            <span className="text-[#8C9C92] text-xs font-bold uppercase tracking-[0.2em]">
              {t('books.detail.archivalId', 'Archival ID')}: #{archivalId}
            </span>
          </div>

          {/* Title + author */}
          <h1 className="text-[clamp(1.75rem,7vw,3.75rem)] md:text-6xl font-extrabold text-white mb-4 tracking-tight leading-tight md:leading-none text-balance break-anywhere">
            {book.title}
          </h1>
          <p className="text-2xl text-[#E4B643] font-medium italic font-serif mb-8">
            {t('books.card.by', { author: book.author, defaultValue: 'by {{author}}' })}
          </p>

          <div className="h-px bg-gradient-to-r from-[#28382D] to-transparent mb-8" aria-hidden="true" />

          {/* Synopsis */}
          {book.description && (
            <div className="mb-12">
              <h2 className="text-white font-bold uppercase tracking-widest text-xs mb-4">
                {t('books.detail.synopsis', 'Synopsis')}
              </h2>
              <p className="text-lg leading-relaxed text-[#8C9C92]">{book.description}</p>
            </div>
          )}

          {/* Swap notes */}
          {book.notes && (
            <div className="mb-12">
              <h2 className="text-white font-bold uppercase tracking-widest text-xs mb-4">
                {t('books.detail.notes', 'Swap Notes')}
              </h2>
              <p className="text-sm leading-relaxed text-[#8C9C92] bg-[#1A251D] border border-[#28382D] rounded-2xl p-5">
                {book.notes}
              </p>
            </div>
          )}

          {/* Metadata grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Archival details */}
            <div className="bg-[#1A251D] border border-[#28382D] rounded-2xl p-6">
              <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#E4B643]" aria-hidden="true" />
                {t('books.detail.archivalDetails', 'Archival Details')}
              </h3>
              <div className="space-y-4">
                {book.isbn && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#8C9C92] flex items-center gap-2">
                      <Hash className="w-3 h-3" aria-hidden="true" />
                      {t('books.detail.isbn', 'ISBN-13')}
                    </span>
                    <span className="text-sm font-bold text-white font-mono">{book.isbn}</span>
                  </div>
                )}
                {book.page_count && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#8C9C92] flex items-center gap-2">
                      <BookOpen className="w-3 h-3" aria-hidden="true" />
                      {t('books.detail.pageCount', 'Page Count')}
                    </span>
                    <span className="text-sm font-bold text-white">{book.page_count} pages</span>
                  </div>
                )}
                {book.publish_year && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#8C9C92] flex items-center gap-2">
                      <Calendar className="w-3 h-3" aria-hidden="true" />
                      {t('books.detail.published', 'Published')}
                    </span>
                    <span className="text-sm font-bold text-white">{book.publish_year}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#8C9C92]">
                    {t('books.detail.language', 'Language')}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {t(`books.addBook.languages.${book.language}`, book.language)}
                  </span>
                </div>
              </div>
            </div>

            {/* Curator / owner card */}
            {book.owner && (
              <div className="bg-[#1A251D] border border-[#28382D] rounded-2xl p-6">
                <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#E4B643]" aria-hidden="true" />
                  {t('books.detail.verifiedCurator', 'Verified Curator')}
                </h3>
                <LocaleLink
                  to={isOwner ? PATHS.PROFILE : `/profile/${book.owner.id}`}
                  className="flex items-center gap-4 mb-6 hover:opacity-80 transition-opacity"
                >
                  {book.owner.avatar ? (
                    <img
                      src={book.owner.avatar}
                      alt={book.owner.username}
                      className="w-12 h-12 rounded-full border-2 border-[#E4B643] object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#152018] border-2 border-[#28382D] flex items-center justify-center">
                      <User className="w-6 h-6 text-[#5A6A60]" aria-hidden="true" />
                    </div>
                  )}
                  <div>
                    <p className="text-white font-bold">{book.owner.username}</p>
                    <p className="text-xs text-[#8C9C92]">{book.owner.neighborhood}</p>
                  </div>
                </LocaleLink>
                {ownerRating > 0 && (
                  <div className="flex items-center gap-1 pt-4 border-t border-[#28382D]">
                    <Star className="w-3 h-3 text-[#E4B643] fill-current" aria-hidden="true" />
                    <span className="text-sm font-bold text-white">
                      {ownerRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {isOwner ? (
            <div className="flex gap-4">
              <LocaleLink
                to={`/books/${book.id}/edit`}
                className="flex-1 flex items-center justify-center gap-3 border border-[#28382D] text-white py-5 rounded-2xl font-bold hover:bg-[#28382D] transition-colors"
              >
                <Edit2 className="w-5 h-5" aria-hidden="true" />
                {t('books.detail.editListing', 'Edit Listing')}
              </LocaleLink>
            </div>
          ) : isOwnerBlocked ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
              <p className="text-sm text-red-400">
                {t('books.detail.blockedOwner', 'You have blocked this user. Swap actions are unavailable.')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => setSwapModalOpen(true)}
                className="flex-1 bg-[#E4B643] hover:bg-[#d9b93e] text-[#152018] py-5 rounded-2xl font-black uppercase tracking-widest transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <ArrowLeftRight className="w-5 h-5" aria-hidden="true" />
                {t('books.detail.requestSwap', 'Request Swap')}
              </button>
              <button
                type="button"
                onClick={handleAddToWishlist}
                disabled={addWishlist.isPending}
                className="px-8 py-5 rounded-2xl border border-[#28382D] text-white font-bold hover:bg-[#28382D] transition-colors disabled:opacity-60"
              >
                {addWishlist.isPending
                  ? t('common.saving', 'Saving…')
                  : t('books.detail.saveToWishlist', 'Save to Wishlist')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Swap flow modal */}
      <SwapFlowModal
        isOpen={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        requestedBook={swapModalOpen ? browseBook : null}
      />
    </div>
  );
}
