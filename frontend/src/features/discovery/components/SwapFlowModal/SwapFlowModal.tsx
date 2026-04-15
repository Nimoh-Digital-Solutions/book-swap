/**
 * SwapFlowModal — 3-step swap request flow.
 *
 * Step 1 — SELECT_OFFER  : user picks a book from their shelf to offer.
 * Step 2 — CONFIRM_SWAP  : review the trade, add an optional note.
 * Step 3 — SUCCESS       : confirmation with link to exchanges.
 *
 * Real data: useMyShelf + useCreateExchange.
 */
import { type ReactElement,useState } from 'react';

import { LocaleLink } from '@components/common/LocaleLink/LocaleLink';
import { useMyShelf } from '@features/books';
import { useCreateExchange } from '@features/exchanges';
import { useLocaleNavigate } from '@hooks/useLocaleNavigate';
import { PATHS } from '@routes/config/paths';

import type { BrowseBook } from '../../types/discovery.types';

type Step = 'SELECT_OFFER' | 'CONFIRM_SWAP' | 'SUCCESS';

interface SwapFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestedBook: BrowseBook | null;
}

export function SwapFlowModal({
  isOpen,
  onClose,
  requestedBook,
}: SwapFlowModalProps): ReactElement | null {
  const navigate = useLocaleNavigate();
  const [step, setStep] = useState<Step>('SELECT_OFFER');
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: shelfData, isLoading: shelfLoading } = useMyShelf(isOpen);
  const shelfBooks = shelfData?.results ?? [];

  const { mutate: createExchange, isPending } = useCreateExchange();

  if (!isOpen || !requestedBook) return null;

  const selectedOfferBook = shelfBooks.find(b => b.id === selectedOfferId);

  const requestedCover = requestedBook.primary_photo ?? requestedBook.cover_url;

  const handleClose = () => {
    setStep('SELECT_OFFER');
    setSelectedOfferId(null);
    setNote('');
    setApiError(null);
    onClose();
  };

  const handleSendRequest = () => {
    if (!selectedOfferId) return;
    setApiError(null);
    createExchange(
      {
        requested_book_id: requestedBook.id,
        offered_book_id: selectedOfferId,
        message: note || undefined,
      },
      {
        onSuccess: () => setStep('SUCCESS'),
        onError: (err: Error) =>
          setApiError(err.message ?? 'Something went wrong. Please try again.'),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Swap request"
        className="relative w-full max-w-3xl bg-surface-dark rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* ────────────────────────────────────────────────── */}
        {/* STEP 1 — SELECT OFFER                             */}
        {/* ────────────────────────────────────────────────── */}
        {step === 'SELECT_OFFER' && (
          <>
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#E4B643] text-2xl" aria-hidden="true">
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
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
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
                    <div key={i} className="rounded-2xl bg-white/5 animate-pulse aspect-[3/4]" />
                  ))}
                </div>
              ) : shelfBooks.length === 0 ? (
                <div className="text-center py-12">
                  <span
                    className="material-symbols-outlined text-gray-500 text-5xl mb-4 block"
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
                    onClick={handleClose}
                    className="inline-flex items-center gap-2 bg-[#E4B643] text-[#152018] font-bold px-6 py-2.5 rounded-full text-sm hover:bg-[#d9b93e] transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">
                      add
                    </span>
                    Add a Book
                  </LocaleLink>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {shelfBooks.map(book => {
                    const cover = book.primary_photo ?? book.cover_url;
                    const isSelected = selectedOfferId === book.id;
                    return (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => setSelectedOfferId(book.id)}
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
                              className="material-symbols-outlined text-[#28382D] text-5xl"
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

                  {/* Add new book shortcut */}
                  <LocaleLink
                    to={PATHS.ADD_BOOK}
                    onClick={handleClose}
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

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-background-dark shrink-0">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-400 italic">
                  {selectedOfferId
                    ? `Selected: ${selectedOfferBook?.title ?? ''}`
                    : 'No book selected yet'}
                </span>
                <span className="text-sm font-bold text-[#E4B643]">Step 1 of 2</span>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 rounded-full border border-white/20 text-white font-bold hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setStep('CONFIRM_SWAP')}
                  disabled={!selectedOfferId}
                  className="flex-1 py-3 rounded-full bg-[#E4B643] text-[#152018] font-bold hover:bg-[#d9b93e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Offer
                </button>
              </div>
            </div>
          </>
        )}

        {/* ────────────────────────────────────────────────── */}
        {/* STEP 2 — CONFIRM SWAP                             */}
        {/* ────────────────────────────────────────────────── */}
        {step === 'CONFIRM_SWAP' && selectedOfferBook && (
          <>
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#E4B643]" aria-hidden="true">
                  menu_book
                </span>
                <span className="font-bold text-white">Confirm Swap</span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-2">Finalize Your Swap</h2>
                <p className="text-[#E4B643]">
                  Make sure the exchange looks right before sending.
                </p>
              </div>

              {/* Books exchange visual */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-10">
                {/* Receiving */}
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

                {/* Swap icon */}
                <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-[#E4B643] shrink-0 rotate-90 md:rotate-0">
                  <span className="material-symbols-outlined" aria-hidden="true">
                    swap_horiz
                  </span>
                </div>

                {/* Giving */}
                <div className="w-44 text-center">
                  <div className="bg-white rounded-3xl p-4 aspect-[3/4] flex items-center justify-center relative mb-4 shadow-xl">
                    <div className="absolute top-3 left-3 z-10 bg-surface-dark text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                      Giving
                    </div>
                    {(selectedOfferBook.primary_photo ?? selectedOfferBook.cover_url) ? (
                      <img
                        src={
                          (selectedOfferBook.primary_photo ?? selectedOfferBook.cover_url) as string
                        }
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

              {/* Optional note */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[#E4B643] text-sm" aria-hidden="true">
                    chat_bubble
                  </span>
                  <span className="font-bold text-white text-sm">
                    Personal Note (Optional)
                  </span>
                </div>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  maxLength={500}
                  placeholder="Add a friendly message to introduce yourself or suggest a meeting spot…"
                  className="w-full bg-transparent border border-white/20 rounded-2xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#E4B643] resize-none h-24"
                  aria-label="Personal note"
                />
              </div>

              {/* Summary */}
              <div className="border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Estimated Shipping / Meetup</span>
                  <span className="text-white font-medium">Local Pickup</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Swap Protection</span>
                  <span className="text-[#E4B643] font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">
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

            {/* Footer */}
            <div className="p-6 border-t border-white/10 bg-background-dark shrink-0">
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={handleSendRequest}
                  disabled={isPending}
                  className="flex-1 py-3.5 rounded-full bg-[#E4B643] text-[#152018] font-bold hover:bg-[#d9b93e] transition-colors text-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Sending…' : 'Send Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('SELECT_OFFER')}
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
        )}

        {/* ────────────────────────────────────────────────── */}
        {/* STEP 3 — SUCCESS                                  */}
        {/* ────────────────────────────────────────────────── */}
        {step === 'SUCCESS' && selectedOfferBook && (
          <div className="relative p-8 md:p-12 flex flex-col items-center text-center">
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>

            {/* Success icon */}
            <div className="w-24 h-24 rounded-full bg-[#E4B643]/20 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[#E4B643] text-5xl" aria-hidden="true">
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

            {/* Trade summary */}
            <div className="w-full max-w-md border border-white/10 rounded-2xl p-6 mb-8 bg-white/5">
              <div className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-6 text-left">
                Trade Summary
              </div>
              <div className="flex items-center justify-center gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#E4B643] mb-2">
                    {(selectedOfferBook.primary_photo ?? selectedOfferBook.cover_url) ? (
                      <img
                        src={
                          (selectedOfferBook.primary_photo ??
                            selectedOfferBook.cover_url) as string
                        }
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

                <span className="material-symbols-outlined text-[#E4B643]" aria-hidden="true">
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
                onClick={() => { handleClose(); void navigate(PATHS.EXCHANGES); }}
                className="flex-1 py-3 rounded-full bg-[#E4B643] text-[#152018] font-bold hover:bg-[#d9b93e] transition-colors"
              >
                View Exchanges
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 rounded-full border border-white/20 text-white font-bold hover:bg-white/5 transition-colors"
              >
                Keep Browsing
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
