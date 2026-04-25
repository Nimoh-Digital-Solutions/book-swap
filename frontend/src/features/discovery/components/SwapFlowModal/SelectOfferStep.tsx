import type { ReactElement } from 'react';

import { LocaleLink } from '@components/common/LocaleLink/LocaleLink';
import { PATHS } from '@routes/config/paths';

import type { BrowseBook } from '../../types/discovery.types';

interface ShelfBook {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  primary_photo: string | null;
}

interface SelectOfferStepProps {
  requestedBook: BrowseBook;
  shelfBooks: ShelfBook[];
  shelfLoading: boolean;
  selectedOfferId: string | null;
  selectedOfferTitle: string | undefined;
  onSelectOffer: (id: string) => void;
  onClose: () => void;
  onContinue: () => void;
}

/**
 * Step 1 of the swap flow — pick a book from the user's shelf to offer.
 */
export function SelectOfferStep({
  requestedBook,
  shelfBooks,
  shelfLoading,
  selectedOfferId,
  selectedOfferTitle,
  onSelectOffer,
  onClose,
  onContinue,
}: SelectOfferStepProps): ReactElement {
  return (
    <>
      <div className="p-6 border-b border-white/10 flex items-start justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-[#E4B643] text-2xl"
            aria-hidden="true"
          >
            menu_book
          </span>
          <div>
            <div className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-1">
              Swap Proposal
            </div>
            <h2 className="text-xl font-bold text-white">
              Requesting{' '}
              <span className="text-[#E4B643] italic">{requestedBook.title}</span>
            </h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        <h3 className="text-lg font-medium text-white mb-1">
          Select a book from your library
        </h3>
        <p className="text-sm text-gray-400 mb-6">
          Choose an item to offer in exchange for this request.
        </p>

        {shelfLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white/5 animate-pulse aspect-[3/4]"
              />
            ))}
          </div>
        ) : shelfBooks.length === 0 ? (
          <div className="text-center py-12">
            <span
              className="material-symbols-outlined text-gray-500 text-4xl sm:text-5xl mb-4 block"
              aria-hidden="true"
            >
              library_books
            </span>
            <p className="text-gray-300 font-medium mb-2">Your shelf is empty</p>
            <p className="text-gray-400 text-sm mb-6">
              Add a book to your shelf before requesting a swap.
            </p>
            <LocaleLink
              to={PATHS.ADD_BOOK}
              onClick={onClose}
              className="inline-flex items-center gap-2 bg-[#E4B643] text-[#152018] font-bold px-6 py-2.5 rounded-full text-sm hover:bg-[#d9b93e] transition-colors"
            >
              <span
                className="material-symbols-outlined text-sm"
                aria-hidden="true"
              >
                add
              </span>
              Add a Book
            </LocaleLink>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {shelfBooks.map((book) => {
              const cover = book.primary_photo ?? book.cover_url;
              const isSelected = selectedOfferId === book.id;
              return (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => onSelectOffer(book.id)}
                  className={`text-left group relative rounded-2xl overflow-hidden transition-all ${
                    isSelected
                      ? 'ring-2 ring-[#E4B643] bg-white/10'
                      : 'hover:bg-white/5'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={book.title}
                >
                  <div className="aspect-[3/4] p-4 flex items-center justify-center relative bg-[#0f1a12]">
                    {cover ? (
                      <img
                        src={cover}
                        alt={book.title}
                        className="w-full h-full object-cover rounded-md shadow-lg relative z-0"
                        loading="lazy"
                      />
                    ) : (
                      <span
                        className="material-symbols-outlined text-[#28382D] text-4xl sm:text-5xl"
                        aria-hidden="true"
                      >
                        menu_book
                      </span>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-20 w-6 h-6 bg-[#E4B643] rounded-full flex items-center justify-center text-[#152018]">
                        <span
                          className="material-symbols-outlined text-sm font-bold"
                          aria-hidden="true"
                        >
                          check
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-white text-sm line-clamp-1">
                      {book.title}
                    </h4>
                    <p className="text-xs text-[#E4B643] uppercase tracking-wider mt-1 line-clamp-1">
                      {book.author}
                    </p>
                  </div>
                </button>
              );
            })}

            <LocaleLink
              to={PATHS.ADD_BOOK}
              onClick={onClose}
              className="rounded-2xl border-2 border-dashed border-white/20 hover:border-[#E4B643]/50 hover:bg-white/5 transition-all flex flex-col items-center justify-center aspect-[3/4] p-4 group"
              aria-label="Add a new book"
            >
              <div className="w-10 h-10 rounded-full bg-[#E4B643]/20 text-[#E4B643] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined" aria-hidden="true">
                  add
                </span>
              </div>
              <span className="text-xs font-bold tracking-widest uppercase text-[#E4B643]">
                Add New
              </span>
            </LocaleLink>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-white/10 bg-background-dark shrink-0">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-400 italic">
            {selectedOfferId
              ? `Selected: ${selectedOfferTitle ?? ''}`
              : 'No book selected yet'}
          </span>
          <span className="text-sm font-bold text-[#E4B643]">Step 1 of 2</span>
        </div>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-full border border-white/20 text-white font-bold hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={!selectedOfferId}
            className="flex-1 py-3 rounded-full bg-[#E4B643] text-[#152018] font-bold hover:bg-[#d9b93e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Offer
          </button>
        </div>
      </div>
    </>
  );
}
