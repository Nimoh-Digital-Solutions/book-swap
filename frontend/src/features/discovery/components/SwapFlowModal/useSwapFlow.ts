import { useState } from 'react';

import { useMyShelf } from '@features/books';
import { useCreateExchange } from '@features/exchanges';

import type { BrowseBook } from '../../types/discovery.types';

export type SwapFlowStep = 'SELECT_OFFER' | 'CONFIRM_SWAP' | 'SUCCESS';

interface UseSwapFlowOptions {
  isOpen: boolean;
  requestedBook: BrowseBook | null;
}

/**
 * State machine + side effects for the swap-request flow used by
 * SwapFlowModal. Keeps step transitions, shelf data, optimistic note
 * and API submission in one place. AUD-W-402.
 */
export function useSwapFlow({ isOpen, requestedBook }: UseSwapFlowOptions) {
  const [step, setStep] = useState<SwapFlowStep>('SELECT_OFFER');
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: shelfData, isLoading: shelfLoading } = useMyShelf(isOpen);
  const shelfBooks = shelfData?.results ?? [];
  const selectedOfferBook = shelfBooks.find((b) => b.id === selectedOfferId);

  const { mutate: createExchange, isPending } = useCreateExchange();

  const reset = () => {
    setStep('SELECT_OFFER');
    setSelectedOfferId(null);
    setNote('');
    setApiError(null);
  };

  const sendRequest = () => {
    if (!requestedBook || !selectedOfferId) return;
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

  return {
    step,
    setStep,
    selectedOfferId,
    setSelectedOfferId,
    selectedOfferBook,
    note,
    setNote,
    apiError,
    shelfBooks,
    shelfLoading,
    isPending,
    sendRequest,
    reset,
  };
}
