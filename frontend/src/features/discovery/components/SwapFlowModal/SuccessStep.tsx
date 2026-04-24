import type { ReactElement } from 'react';

import type { BrowseBook } from '../../types/discovery.types';

interface OfferBook {
  title: string;
  cover_url: string | null;
  primary_photo: string | null;
}

interface SuccessStepProps {
  requestedBook: BrowseBook;
  selectedOfferBook: OfferBook;
  onClose: () => void;
  onViewExchanges: () => void;
}

/**
 * Step 3 of the swap flow — confirmation screen with trade summary.
 */
export function SuccessStep({
  requestedBook,
  selectedOfferBook,
  onClose,
  onViewExchanges,
}: SuccessStepProps): ReactElement {
  const requestedCover = requestedBook.primary_photo ?? requestedBook.cover_url;
  const offerCover =
    selectedOfferBook.primary_photo ?? selectedOfferBook.cover_url;

  return (
    <div className="relative p-8 md:p-12 flex flex-col items-center text-center">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        aria-label="Close"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>

      <div className="w-24 h-24 rounded-full bg-[#E4B643]/20 flex items-center justify-center mb-6">
        <span
          className="material-symbols-outlined text-[#E4B643] text-5xl"
          aria-hidden="true"
        >
          check_circle
        </span>
      </div>

      <h2 className="text-3xl font-bold text-white mb-2">Request Sent!</h2>
      <p className="text-gray-400 mb-8">
        We've notified{' '}
        <span className="text-[#E4B643] font-medium">
          {requestedBook.owner.username}
        </span>
        . They have 48 hours to respond.
      </p>

      <div className="w-full max-w-md border border-white/10 rounded-2xl p-6 mb-8 bg-white/5">
        <div className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-6 text-left">
          Trade Summary
        </div>
        <div className="flex items-center justify-center gap-6">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#E4B643] mb-2">
              {offerCover ? (
                <img
                  src={offerCover}
                  alt={selectedOfferBook.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#1A251D] flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[#28382D] text-2xl"
                    aria-hidden="true"
                  >
                    menu_book
                  </span>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400 line-clamp-1 max-w-[80px] text-center">
              {selectedOfferBook.title}
            </span>
          </div>

          <span
            className="material-symbols-outlined text-[#E4B643]"
            aria-hidden="true"
          >
            swap_horiz
          </span>

          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 mb-2">
              {requestedCover ? (
                <img
                  src={requestedCover}
                  alt={requestedBook.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#1A251D] flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[#28382D] text-2xl"
                    aria-hidden="true"
                  >
                    menu_book
                  </span>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400 line-clamp-1 max-w-[80px] text-center">
              {requestedBook.title}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 w-full max-w-md">
        <button
          type="button"
          onClick={onViewExchanges}
          className="flex-1 py-3 rounded-full bg-[#E4B643] text-[#152018] font-bold hover:bg-[#d9b93e] transition-colors"
        >
          View Exchanges
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 rounded-full border border-white/20 text-white font-bold hover:bg-white/5 transition-colors"
        >
          Keep Browsing
        </button>
      </div>
    </div>
  );
}
