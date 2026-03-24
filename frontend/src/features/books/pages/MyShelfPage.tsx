import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useAppStore } from '@data/useAppStore';
import { useDocumentTitle } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { BookOpen, Plus } from 'lucide-react';

import { BookCard } from '../components/BookCard/BookCard';
import { WishlistForm } from '../components/WishlistForm/WishlistForm';
import { useAddWishlistItem } from '../hooks/useAddWishlistItem';
import { useMyShelf } from '../hooks/useMyShelf';
import { useRemoveWishlistItem } from '../hooks/useRemoveWishlistItem';
import { useWishlist } from '../hooks/useWishlist';
import type { CreateWishlistPayload } from '../types/book.types';

type Tab = 'listings' | 'wishlist';

export function MyShelfPage(): ReactElement {
  const { t } = useTranslation();
  const addNotification = useAppStore(s => s.addNotification);
  const [activeTab, setActiveTab] = useState<Tab>('listings');

  useDocumentTitle(routeMetadata[PATHS.MY_SHELF].title);

  const { data: shelf, isLoading, isError } = useMyShelf();
  const { data: wishlistData } = useWishlist(activeTab === 'wishlist');
  const addWishlist = useAddWishlistItem();
  const removeWishlist = useRemoveWishlistItem();

  const handleAddWishlist = (values: CreateWishlistPayload) => {
    addWishlist.mutate(values, {
      onSuccess: () => addNotification(t('books.wishlist.addSuccess', 'Added to wishlist!'), { variant: 'success' }),
      onError: () => addNotification(t('books.wishlist.addError', 'Failed to add to wishlist.'), { variant: 'error' }),
    });
  };

  const handleRemoveWishlist = (id: string) => {
    removeWishlist.mutate(id, {
      onSuccess: () => addNotification(t('books.wishlist.removeSuccess', 'Removed from wishlist.'), { variant: 'success' }),
      onError: () => addNotification(t('books.wishlist.removeError', 'Failed to remove from wishlist.'), { variant: 'error' }),
    });
  };

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
        <p className="text-red-400">{t('books.detail.error', 'Unable to load book details.')}</p>
      </div>
    );
  }

  const books = shelf?.results ?? [];
  const wishlistItems = wishlistData?.results ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" style={{ marginInline: 'auto' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('books.myShelf.title', 'My Shelf')}</h1>
          <p className="text-[#8C9C92] mt-1">{t('books.myShelf.description', 'Manage your book listings and wishlist.')}</p>
        </div>
        <Link
          to={PATHS.ADD_BOOK}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E4B643] hover:bg-[#d9b93e] text-[#152018] font-bold text-sm rounded-full transition-colors"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          {t('books.myShelf.addBook', 'Add Book')}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-[#28382D]" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'listings'}
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'listings'
              ? 'border-[#E4B643] text-[#E4B643]'
              : 'border-transparent text-[#8C9C92] hover:text-white'
          }`}
        >
          {t('books.myShelf.tabs.listings', 'My Listings')}
          {books.length > 0 && (
            <span className="ml-2 text-xs bg-[#28382D] text-[#8C9C92] px-2 py-0.5 rounded-full">
              {books.length}
            </span>
          )}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'wishlist'}
          onClick={() => setActiveTab('wishlist')}
          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'wishlist'
              ? 'border-[#E4B643] text-[#E4B643]'
              : 'border-transparent text-[#8C9C92] hover:text-white'
          }`}
        >
          {t('books.myShelf.tabs.wishlist', 'Wishlist')}
          {wishlistItems.length > 0 && (
            <span className="ml-2 text-xs bg-[#28382D] text-[#8C9C92] px-2 py-0.5 rounded-full">
              {wishlistItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab panels */}
      {activeTab === 'listings' && (
        <div role="tabpanel">
          {books.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 text-[#28382D] mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-white mb-2">
                {t('books.myShelf.emptyTitle', 'Your shelf is empty')}
              </h2>
              <p className="text-[#8C9C92] mb-6 max-w-md mx-auto">
                {t('books.myShelf.emptyDescription', 'List your first book to start swapping with readers in your community.')}
              </p>
              <Link
                to={PATHS.ADD_BOOK}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#E4B643] hover:bg-[#d9b93e] text-[#152018] font-bold rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
                {t('books.myShelf.addFirstBook', 'Add Your First Book')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {books.map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'wishlist' && (
        <div role="tabpanel" className="space-y-8">
          <WishlistForm onSubmit={handleAddWishlist} isSubmitting={addWishlist.isPending} />

          {wishlistItems.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-lg font-semibold text-white mb-2">
                {t('books.wishlist.emptyTitle', 'Your wishlist is empty')}
              </h2>
              <p className="text-[#8C9C92] max-w-md mx-auto">
                {t('books.wishlist.emptyDescription', "Add books you're looking for and we'll let you know when they become available nearby.")}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {wishlistItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-[#1A251D] rounded-xl border border-[#28382D] p-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {item.cover_url ? (
                      <img src={item.cover_url} alt="" className="w-10 h-14 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-14 rounded bg-[#152018] flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-[#28382D]" aria-hidden="true" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {item.title || item.isbn || item.genre}
                      </p>
                      {item.author && (
                        <p className="text-[#8C9C92] text-xs truncate">{item.author}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveWishlist(item.id)}
                    className="text-[#5A6A60] hover:text-red-400 text-xs font-medium transition-colors ml-4 flex-shrink-0"
                  >
                    {t('common.delete', 'Delete')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
