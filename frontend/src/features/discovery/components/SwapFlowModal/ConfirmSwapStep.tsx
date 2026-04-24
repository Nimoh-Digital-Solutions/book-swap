import type { ReactElement } from 'react';

import type { BrowseBook } from '../../types/discovery.types';

interface OfferBook {
  title: string;
  cover_url: string | null;
  primary_photo: string | null;
}

interface ConfirmSwapStepProps {
  requestedBook: BrowseBook;
  selectedOfferBook: OfferBook;
  note: string;
  onNoteChange: (v: string) => void;
  apiError: string | null;
  isPending: boolean;
  onSendRequest: () => void;
  onBack: () => void;
  onClose: () => void;
}

/**
 * Step 2 of the swap flow — review the trade and add an optional note.
 */
export function ConfirmSwapStep({
  requestedBook,
  selectedOfferBook,
  note,
  onNoteChange,
  apiError,
  isPending,
  onSendRequest,
  onBack,
  onClose,
}: ConfirmSwapStepProps): ReactElement {
  const requestedCover = requestedBook.primary_photo ?? requestedBook.cover_url;
  const offerCover =
    selectedOfferBook.primary_photo ?? selectedOfferBook.cover_url;

  return (
    <>
      <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#E4B643]" aria-hidden="true">
            menu_book
          </span>
          <span className="font-bold text-white">Confirm Swap</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-2">Finalize Your Swap</h2>
          <p className="text-[#E4B643]">
            Make sure the exchange looks right before sending.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-10">
          <div className="w-44 text-center">
            <div className="bg-teal-900/50 rounded-3xl p-4 aspect-[3/4] flex items-center justify-center relative mb-4 shadow-xl">
              <div className="absolute top-3 left-3 z-10 bg-[#E4B643] text-[#152018] text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                Receiving
              </div>
              {requestedCover ? (
                <img
                  src={requestedCover}
                  alt={requestedBook.title}
                  className="w-full h-full object-cover rounded shadow-lg"
                />
              ) : (
                <span
                  className="material-symbols-outlined text-[#28382D] text-5xl"
                  aria-hidden="true"
                >
                  menu_book
                </span>
              )}
            </div>
            <h3 className="font-bold text-white text-base line-clamp-1">
              {requestedBook.title}
            </h3>
            <p className="text-[#E4B643] text-sm">Your Request</p>
          </div>

          <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-[#E4B643] shrink-0 rotate-90 md:rotate-0">
            <span className="material-symbols-outlined" aria-hidden="true">
              swap_horiz
            </span>
          </div>

          <div className="w-44 text-center">
            <div className="bg-white rounded-3xl p-4 aspect-[3/4] flex items-center justify-center relative mb-4 shadow-xl">
              <div className="absolute top-3 left-3 z-10 bg-surface-dark text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                Giving
              </div>
              {offerCover ? (
                <img
                  src={offerCover}
                  alt={selectedOfferBook.title}
                  className="w-full h-full object-cover rounded shadow-lg"
                />
              ) : (
                <span
                  className="material-symbols-outlined text-gray-300 text-5xl"
                  aria-hidden="true"
                >
                  menu_book
                </span>
              )}
            </div>
            <h3 className="font-bold text-white text-base line-clamp-1">
              {selectedOfferBook.title}
            </h3>
            <p className="text-gray-400 text-sm">Your Offer</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="material-symbols-outlined text-[#E4B643] text-sm"
              aria-hidden="true"
            >
              chat_bubble
            </span>
            <span className="font-bold text-white text-sm">
              Personal Note (Optional)
            </span>
          </div>
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            maxLength={500}
            placeholder="Add a friendly message to introduce yourself or suggest a meeting spot…"
            className="w-full bg-transparent border border-white/20 rounded-2xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#E4B643] resize-none h-24"
            aria-label="Personal note"
          />
        </div>

        <div className="border border-white/10 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Estimated Shipping / Meetup</span>
            <span className="text-white font-medium">Local Pickup</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Swap Protection</span>
            <span className="text-[#E4B643] font-medium flex items-center gap-1">
              <span
                className="material-symbols-outlined text-sm"
                aria-hidden="true"
              >
                verified
              </span>
              Active
            </span>
          </div>
        </div>

        {apiError && (
          <p className="mt-4 text-red-400 text-sm text-center">{apiError}</p>
        )}
      </div>

      <div className="p-6 border-t border-white/10 bg-background-dark shrink-0">
        <div className="flex gap-4 mb-4">
          <button
            type="button"
            onClick={onSendRequest}
            disabled={isPending}
            className="flex-1 py-3.5 rounded-full bg-[#E4B643] text-[#152018] font-bold hover:bg-[#d9b93e] transition-colors text-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? 'Sending…' : 'Send Request'}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={isPending}
            className="flex-1 py-3.5 rounded-full bg-black/20 text-white font-bold hover:bg-black/40 transition-colors text-lg disabled:opacity-60"
          >
            Back
          </button>
        </div>
        <p className="text-center text-xs text-gray-500">
          By sending this request, you agree to the BookSwap Community Guidelines. The
          recipient will have 48 hours to respond.
        </p>
      </div>
    </>
  );
}
