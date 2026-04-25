/**
 * SwapFlowModal — orchestrates the 3-step swap request flow.
 *
 * Step 1 — SELECT_OFFER  : pick a book from your shelf to offer.
 * Step 2 — CONFIRM_SWAP  : review the trade, add an optional note.
 * Step 3 — SUCCESS       : confirmation with link to exchanges.
 *
 * State and side effects live in `useSwapFlow`; each step is a focused
 * presentation component. AUD-W-402.
 */
import type { ReactElement } from 'react';

import { useLocaleNavigate } from '@hooks/useLocaleNavigate';
import { PATHS } from '@routes/config/paths';

import type { BrowseBook } from '../../types/discovery.types';
import { ConfirmSwapStep } from './ConfirmSwapStep';
import { SelectOfferStep } from './SelectOfferStep';
import { SuccessStep } from './SuccessStep';
import { useSwapFlow } from './useSwapFlow';

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
  const flow = useSwapFlow({ isOpen, requestedBook });

  if (!isOpen || !requestedBook) return null;

  const handleClose = () => {
    flow.reset();
    onClose();
  };

  return (
    <div
      // RESP-021 (Sprint C): below `sm:` the modal becomes a full-screen
      // sheet (no centering padding, edge-to-edge). At `sm:` and up it
      // returns to a centred dialog with comfortable insets. The
      // additive `--pb` keeps the iOS home-indicator inset on top of
      // the baseline 1 rem padding (see RESP-006).
      className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:pt-6 sm:px-6 sm:pb-safe"
      style={{
        ['--pb' as string]: '1rem',
      }}
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Swap request"
        // Mobile: full viewport, no rounded corners, dvh-bound for the
        // iOS URL-bar collapse. Desktop: capped width / height with
        // rounded corners, identical to the legacy modal look.
        className="relative w-full h-[100dvh] sm:h-auto sm:max-w-3xl sm:max-h-[90dvh] bg-surface-dark sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {flow.step === 'SELECT_OFFER' && (
          <SelectOfferStep
            requestedBook={requestedBook}
            shelfBooks={flow.shelfBooks}
            shelfLoading={flow.shelfLoading}
            selectedOfferId={flow.selectedOfferId}
            selectedOfferTitle={flow.selectedOfferBook?.title}
            onSelectOffer={flow.setSelectedOfferId}
            onClose={handleClose}
            onContinue={() => flow.setStep('CONFIRM_SWAP')}
          />
        )}

        {flow.step === 'CONFIRM_SWAP' && flow.selectedOfferBook && (
          <ConfirmSwapStep
            requestedBook={requestedBook}
            selectedOfferBook={flow.selectedOfferBook}
            note={flow.note}
            onNoteChange={flow.setNote}
            apiError={flow.apiError}
            isPending={flow.isPending}
            onSendRequest={flow.sendRequest}
            onBack={() => flow.setStep('SELECT_OFFER')}
            onClose={handleClose}
          />
        )}

        {flow.step === 'SUCCESS' && flow.selectedOfferBook && (
          <SuccessStep
            requestedBook={requestedBook}
            selectedOfferBook={flow.selectedOfferBook}
            onClose={handleClose}
            onViewExchanges={() => {
              handleClose();
              void navigate(PATHS.EXCHANGES);
            }}
          />
        )}
      </div>
    </div>
  );
}
