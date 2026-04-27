import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { BrandedLoader, SEOHead } from '@components';
import { useAppStore } from '@data/useAppStore';
import { useAuthStore } from '@features/auth/stores/authStore';
import type { BookListItem } from '@features/books';
import { useBooks } from '@features/books';
import { ChatPanel } from '@features/messaging/components/ChatPanel/ChatPanel';
import { RatingPrompt } from '@features/ratings';
import { useLocaleNavigate } from '@hooks/useLocaleNavigate';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { AlertCircle, ArrowLeft, ArrowRightLeft, BookOpen, Check, Clock, RefreshCw, X } from 'lucide-react';

import { ExchangeStatusBadge } from '../components/ExchangeStatusBadge/ExchangeStatusBadge';
import { useExchange } from '../hooks/useExchange';
import {
  useAcceptConditions,
  useAcceptExchange,
  useApproveCounter,
  useCancelExchange,
  useConfirmReturn,
  useConfirmSwap,
  useCounterExchange,
  useDeclineExchange,
  useRequestReturn,
} from '../hooks/useExchangeMutations';
import type { ExchangeDetail } from '../types/exchange.types';

function BookPanel({ title, author, photo, coverUrl }: {
  title: string;
  author: string;
  photo: string | null;
  coverUrl: string;
}): ReactElement {
  const src = photo ?? coverUrl;
  return (
    <div className="flex-1 text-center">
      {src ? (
        <img src={src} alt={title} className="w-20 h-28 rounded-lg object-cover mx-auto mb-2" />
      ) : (
        <div className="w-20 h-28 rounded-lg bg-[#152018] flex items-center justify-center mx-auto mb-2">
          <BookOpen className="w-8 h-8 text-[#28382D]" aria-hidden="true" />
        </div>
      )}
      <p className="text-sm font-medium text-white truncate">{title}</p>
      <p className="text-xs text-[#8C9C92] truncate">{author}</p>
    </div>
  );
}

function TimelineStep({ label, done, active }: { label: string; done: boolean; active: boolean }): ReactElement {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
        done ? 'bg-[#E4B643] text-[#152018]' : active ? 'bg-[#28382D] border-2 border-[#E4B643] text-[#E4B643]' : 'bg-[#28382D] text-[#8C9C92]'
      }`}>
        {done ? <Check className="w-3 h-3" /> : null}
      </div>
      <span className={`text-xs ${done ? 'text-white' : active ? 'text-[#E4B643]' : 'text-[#8C9C92]'}`}>{label}</span>
    </div>
  );
}

const TIMELINE_STATUSES = ['pending', 'accepted', 'conditions_pending', 'active', 'swap_confirmed', 'completed'] as const;
const STATUS_INDEX: Record<string, number> = Object.fromEntries(TIMELINE_STATUSES.map((s, i) => [s, i]));

function Timeline({ status }: { status: string }): ReactElement {
  const { t } = useTranslation('exchanges');
  const currentIdx = STATUS_INDEX[status] ?? -1;

  const steps = [
    t('timeline.requested', 'Requested'),
    t('timeline.accepted', 'Accepted'),
    t('timeline.conditions', 'Conditions'),
    t('timeline.active', 'Active'),
    t('timeline.swapConfirmed', 'Swap Confirmed'),
    t('timeline.completed', 'Completed'),
  ];

  return (
    <div className="flex flex-col gap-2 mb-6">
      {steps.map((label, i) => (
        <TimelineStep key={label} label={label} done={i < currentIdx} active={i === currentIdx} />
      ))}
    </div>
  );
}

function DetailActions({ exchange }: { exchange: ExchangeDetail }): ReactElement {
  const { t } = useTranslation('exchanges');
  const addNotification = useAppStore(s => s.addNotification);
  const currentUserId = useAuthStore(s => s.user?.id);

  const acceptMutation = useAcceptExchange();
  const declineMutation = useDeclineExchange();
  const counterMutation = useCounterExchange();
  const approveCounterMutation = useApproveCounter();
  const cancelMutation = useCancelExchange();
  const acceptConditionsMutation = useAcceptConditions();
  const confirmSwapMutation = useConfirmSwap();
  const requestReturnMutation = useRequestReturn();
  const confirmReturnMutation = useConfirmReturn();
  const [showCounterPicker, setShowCounterPicker] = useState(false);
  const [selectedCounterBookId, setSelectedCounterBookId] = useState('');

  const isOwner = currentUserId === exchange.owner.id;
  const isRequester = currentUserId === exchange.requester.id;
  const otherUser = isOwner ? exchange.requester : exchange.owner;
  const { data: counterShelf, isLoading: counterShelfLoading } = useBooks(
    { owner: otherUser.id, status: 'available', page_size: 50 },
    showCounterPicker && exchange.status === 'pending' && (isOwner || isRequester),
  );
  const busy = acceptMutation.isPending || declineMutation.isPending || cancelMutation.isPending
    || counterMutation.isPending || approveCounterMutation.isPending
    || acceptConditionsMutation.isPending || confirmSwapMutation.isPending
    || requestReturnMutation.isPending || confirmReturnMutation.isPending;

  const mutate = (mutation: { mutate: (id: string, opts: object) => void }, successMsg: string) => {
    mutation.mutate(exchange.id, {
      onSuccess: () => addNotification(successMsg, { variant: 'success' }),
      onError: () => addNotification(t('error.action', 'Action failed. Please try again.'), { variant: 'error' }),
    });
  };

  const btnPrimary = 'px-5 py-2.5 bg-[#E4B643] hover:bg-[#d9b93e] text-[#152018] font-bold text-sm rounded-full transition-colors disabled:opacity-50';
  const btnSecondary = 'px-5 py-2.5 bg-[#28382D] hover:bg-[#344a3a] text-white font-medium text-sm rounded-full transition-colors disabled:opacity-50';
  const btnDanger = 'px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium text-sm rounded-full transition-colors disabled:opacity-50';
  const btnOutline = 'px-5 py-2.5 border border-[#E4B643] hover:bg-[#E4B643]/10 text-[#E4B643] font-medium text-sm rounded-full transition-colors disabled:opacity-50';

  const counterBooks = (counterShelf?.results ?? []).filter((book: BookListItem) => (
    book.status === 'available' && book.id !== exchange.offered_book.id
  ));
  const submitCounter = () => {
    if (!selectedCounterBookId) return;
    counterMutation.mutate(
      { id: exchange.id, payload: { offered_book_id: selectedCounterBookId } },
      {
        onSuccess: () => {
          setShowCounterPicker(false);
          setSelectedCounterBookId('');
          addNotification(t('counter.sent', 'Counter offer sent.'), { variant: 'success' });
        },
        onError: () => addNotification(t('error.action', 'Action failed. Please try again.'), { variant: 'error' }),
      },
    );
  };

  const renderCounterPicker = () => (
    <div className="space-y-3 rounded-lg border border-[#28382D] bg-[#152018] p-4">
      <p className="text-sm font-medium text-white">
        {t('counter.selectBook', { name: otherUser.username, defaultValue: `Choose a book from ${otherUser.username}'s shelf` })}
      </p>
      {counterShelfLoading ? (
        <p className="text-sm text-[#8C9C92]">{t('common.loading', 'Loading...')}</p>
      ) : counterBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {counterBooks.map((book: BookListItem) => {
            const selected = selectedCounterBookId === book.id;
            return (
              <button
                key={book.id}
                type="button"
                onClick={() => setSelectedCounterBookId(book.id)}
                className={`text-left rounded-lg border p-3 transition-colors ${
                  selected
                    ? 'border-[#E4B643] bg-[#E4B643]/10'
                    : 'border-[#28382D] bg-[#1A251D] hover:border-[#8C9C92]'
                }`}
              >
                <span className="block text-sm font-medium text-white truncate">{book.title}</span>
                <span className="block text-xs text-[#8C9C92] truncate">{book.author}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-[#8C9C92]">
          {t('counter.noBooks', 'No available books to counter with.')}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!selectedCounterBookId || busy}
          className={btnPrimary}
          onClick={submitCounter}
        >
          {t('counter.send', 'Send Counter Offer')}
        </button>
        <button
          type="button"
          disabled={busy}
          className={btnSecondary}
          onClick={() => {
            setShowCounterPicker(false);
            setSelectedCounterBookId('');
          }}
        >
          {t('common.cancel', 'Cancel')}
        </button>
      </div>
    </div>
  );

  // Pending — participants can counter in-place until each side reaches the cap.
  if (exchange.status === 'pending') {
    const hasBeenCountered = !!exchange.last_counter_by;
    const counterApproved = !!exchange.counter_approved_at;
    const iMadeLastCounter = exchange.last_counter_by === currentUserId;
    const pendingApproval = hasBeenCountered && !counterApproved;
    const maxCounterOffers = exchange.max_counter_offers;
    const myCounterCount = isRequester ? exchange.requester_counter_count : exchange.owner_counter_count;
    const counterLimitReached = exchange.counter_offers_remaining_by_me <= 0;
    const canAccept = !pendingApproval;
    const canOwnerCounter = (!hasBeenCountered || !iMadeLastCounter) && !pendingApproval && !counterLimitReached;
    const canRequesterCounter = hasBeenCountered && !iMadeLastCounter && !pendingApproval && !counterLimitReached;
    const limitMessage = t('counter.limitReached', {
      count: myCounterCount,
      max: maxCounterOffers,
      defaultValue: `Counter offer limit reached (${myCounterCount}/${maxCounterOffers}).`,
    });

    if (isOwner) {
      return (
        <div className="space-y-3">
          {pendingApproval && !iMadeLastCounter && (
            <button type="button" disabled={busy} className={btnPrimary}
              onClick={() => mutate(approveCounterMutation, t('counter.approved', 'Counter offer accepted!'))}>
              {t('counter.approve', 'Accept Counter')}
            </button>
          )}
          {pendingApproval && iMadeLastCounter && (
            <p className="text-sm text-[#8C9C92] flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {t('counter.waitingApprovalByName', {
                name: otherUser.username,
                defaultValue: `Waiting for ${otherUser.username} to approve your counter offer.`,
              })}
            </p>
          )}
          {canAccept ? (
            <div className="flex flex-wrap gap-3">
              <button type="button" disabled={busy} className={btnPrimary}
                onClick={() => mutate(acceptMutation, t('action.accepted', 'Exchange accepted!'))}>
                {t('incoming.accept', 'Accept')}
              </button>
              <button type="button" disabled={busy} className={btnDanger}
                onClick={() => declineMutation.mutate({ id: exchange.id }, {
                  onSuccess: () => addNotification(t('action.declined', 'Exchange declined.'), { variant: 'success' }),
                  onError: () => addNotification(t('error.action', 'Action failed.'), { variant: 'error' }),
                })}>
                {t('incoming.decline', 'Decline')}
              </button>
            </div>
          ) : (
            <button type="button" disabled={busy} className={btnDanger}
              onClick={() => declineMutation.mutate({ id: exchange.id }, {
                onSuccess: () => addNotification(t('action.declined', 'Exchange declined.'), { variant: 'success' }),
                onError: () => addNotification(t('error.action', 'Action failed.'), { variant: 'error' }),
              })}>
              {t('incoming.decline', 'Decline')}
            </button>
          )}
          {canOwnerCounter && (
            <button type="button" disabled={busy} className={btnOutline}
              onClick={() => setShowCounterPicker(value => !value)}>
              <RefreshCw className="inline-block w-4 h-4 mr-1" />
              {t('counter.offer', 'Counter Offer')}
            </button>
          )}
          {counterLimitReached && !pendingApproval && (
            <p className="text-sm text-[#8C9C92] flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {limitMessage}
            </p>
          )}
          {showCounterPicker && canOwnerCounter ? renderCounterPicker() : null}
        </div>
      );
    }
    if (isRequester) {
      return (
        <div className="space-y-3">
          {pendingApproval && !iMadeLastCounter && (
            <button type="button" disabled={busy} className={btnPrimary}
              onClick={() => mutate(approveCounterMutation, t('counter.approved', 'Counter offer accepted!'))}>
              {t('counter.approve', 'Accept Counter')}
            </button>
          )}
          {pendingApproval && iMadeLastCounter && (
            <p className="text-sm text-[#8C9C92] flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {t('counter.waitingApprovalByName', {
                name: otherUser.username,
                defaultValue: `Waiting for ${otherUser.username} to approve your counter offer.`,
              })}
            </p>
          )}
          {canRequesterCounter && (
            <button type="button" disabled={busy} className={btnOutline}
              onClick={() => setShowCounterPicker(value => !value)}>
              <RefreshCw className="inline-block w-4 h-4 mr-1" />
              {t('counter.offer', 'Counter Offer')}
            </button>
          )}
          {counterLimitReached && !pendingApproval && (
            <p className="text-sm text-[#8C9C92] flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {limitMessage}
            </p>
          )}
          {showCounterPicker && canRequesterCounter ? renderCounterPicker() : null}
          <button type="button" disabled={busy} className={btnDanger}
            onClick={() => mutate(cancelMutation, t('action.cancelled', 'Request cancelled.'))}>
            {t('request.cancel', 'Cancel Request')}
          </button>
          {!hasBeenCountered && (
            <p className="text-sm text-[#8C9C92] flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {t('request.waitingOwner', 'Waiting for the owner to respond.')}
            </p>
          )}
        </div>
      );
    }
  }

  // Accepted / conditions_pending — show conditions acceptance
  if (exchange.status === 'accepted' || exchange.status === 'conditions_pending') {
    const partnerName = isOwner ? exchange.requester.username : exchange.owner.username;
    return (
      <div className="space-y-3">
        {!exchange.conditions_accepted_by_me ? (
          <button type="button" disabled={busy} className={btnPrimary}
            onClick={() => mutate(acceptConditionsMutation, t('conditions.accepted', 'Conditions accepted!'))}>
            {t('conditions.confirm', 'Accept Exchange Conditions')}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <Check className="w-4 h-4" /> {t('conditions.youAccepted', 'You accepted the conditions')}
          </div>
        )}
        <p className="text-xs text-[#8C9C92]">
          {exchange.conditions_accepted_count < 2 ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t('conditions.waiting', { partner: partnerName, defaultValue: `Waiting for ${partnerName} to accept` })}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-green-400">
              <Check className="w-3 h-3" />
              {t('conditions.bothAccepted', 'Both parties accepted the conditions!')}
            </span>
          )}
        </p>
      </div>
    );
  }

  // Active — confirm swap
  if (exchange.status === 'active') {
    const myConfirmed = isOwner ? exchange.owner_confirmed_at : exchange.requester_confirmed_at;
    const partnerName = isOwner ? exchange.requester.username : exchange.owner.username;
    const partnerConfirmed = isOwner ? exchange.requester_confirmed_at : exchange.owner_confirmed_at;
    return (
      <div className="space-y-3">
        {!myConfirmed ? (
          <button type="button" disabled={busy} className={btnPrimary}
            onClick={() => mutate(confirmSwapMutation, t('swap.confirmed', 'Swap confirmed!'))}>
            {t('swap.confirm', 'Confirm Swap')}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <Check className="w-4 h-4" /> {t('swap.youConfirmed', 'You confirmed the swap')}
          </div>
        )}
        <p className="text-xs text-[#8C9C92]">
          {partnerConfirmed ? (
            <span className="inline-flex items-center gap-1 text-green-400">
              <Check className="w-3 h-3" />
              {t('swap.partnerConfirmed', { partner: partnerName, defaultValue: `${partnerName} confirmed` })}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {t('swap.waiting', { partner: partnerName, defaultValue: `Waiting for ${partnerName}` })}
            </span>
          )}
        </p>
      </div>
    );
  }

  // Swap confirmed — request return
  if (exchange.status === 'swap_confirmed') {
    return (
      <button type="button" disabled={busy} className={btnSecondary}
        onClick={() => mutate(requestReturnMutation, t('return.requested', 'Return requested.'))}>
        {t('return.request', 'Request Return')}
      </button>
    );
  }

  // Return requested — confirm return
  if (exchange.status === 'return_requested') {
    const myConfirmed = isOwner ? exchange.return_confirmed_owner : exchange.return_confirmed_requester;
    const partnerName = isOwner ? exchange.requester.username : exchange.owner.username;
    return (
      <div className="space-y-3">
        {!myConfirmed ? (
          <button type="button" disabled={busy} className={btnPrimary}
            onClick={() => mutate(confirmReturnMutation, t('return.confirmed', 'Return confirmed!'))}>
            {t('return.confirm', 'Confirm Return')}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <Check className="w-4 h-4" /> {t('return.youConfirmed', 'You confirmed the return')}
          </div>
        )}
        <p className="text-xs text-[#8C9C92]">
          <Clock className="w-3 h-3 inline mr-1" />
          {t('return.waiting', { partner: partnerName, defaultValue: `Waiting for ${partnerName}` })}
        </p>
      </div>
    );
  }

  // Terminal statuses
  if (exchange.status === 'declined') {
    return <p className="text-sm text-red-400 flex items-center gap-1"><X className="w-4 h-4" /> {t('status.declined', 'Declined')}</p>;
  }
  if (exchange.status === 'cancelled') {
    return <p className="text-sm text-[#8C9C92]">{t('status.cancelled', 'Cancelled')}</p>;
  }
  if (exchange.status === 'expired') {
    return <p className="text-sm text-[#8C9C92]">{t('status.expired', 'Expired')}</p>;
  }
  if (exchange.status === 'returned') {
    return <p className="text-sm text-teal-400 flex items-center gap-1"><Check className="w-4 h-4" /> {t('status.returned', 'Returned')}</p>;
  }

  return <></>;
}

const CHAT_ELIGIBLE_STATUSES = new Set([
  'active', 'swap_confirmed', 'completed', 'return_requested', 'returned',
]);
const CHAT_READ_ONLY_STATUSES = new Set([
  'completed', 'return_requested', 'returned',
]);

function isChatEligible(status: string): boolean {
  return CHAT_ELIGIBLE_STATUSES.has(status);
}

function isChatReadOnly(status: string): boolean {
  return CHAT_READ_ONLY_STATUSES.has(status);
}

export default function ExchangeDetailPage(): ReactElement {
  const { t } = useTranslation('exchanges');
  const navigate = useLocaleNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: exchange, isLoading, isError } = useExchange(id!);
  const currentUserId = useAuthStore(s => s.user?.id);

  if (isLoading) {
    return (
      <div className="min-h-[50vh]">
        <BrandedLoader size="md" label={t('common.loading', 'Loading…')} />
      </div>
    );
  }

  if (isError || !exchange) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">{t('error.notFound', 'Exchange not found.')}</p>
      </div>
    );
  }

  const isOwner = currentUserId === exchange.owner.id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <SEOHead
        title={routeMetadata[PATHS.EXCHANGE_DETAIL].title}
        description={routeMetadata[PATHS.EXCHANGE_DETAIL].description}
        path={PATHS.EXCHANGE_DETAIL}
        noIndex
      />
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-[#8C9C92] hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        {t('detail.back', 'Back')}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left — Timeline.
          *
          * RESP-019 (Sprint C): on mobile the most action-relevant block is
          * the actions card (Accept/Decline/Counter or Mark Completed), not
          * the status timeline. We push the timeline to `order-2` below `md:`
          * so the right column (which contains the title, books, and
          * actions) appears first. Desktop is unchanged via `md:order-1`. */}
        <div className="md:col-span-1 order-2 md:order-1">
          <h2 className="text-sm font-medium text-[#8C9C92] uppercase tracking-wider mb-4">
            {t('detail.progress', 'Progress')}
          </h2>
          <Timeline status={exchange.status} />
        </div>

        {/* Right — Detail */}
        <div className="md:col-span-2 space-y-6 order-1 md:order-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">{t('detail.title', 'Exchange Details')}</h1>
            <ExchangeStatusBadge status={exchange.status} />
          </div>

          {/* Books */}
          <div className="bg-[#1A251D] rounded-xl border border-[#28382D] p-6">
            <div className="flex items-center gap-4">
              <BookPanel
                title={exchange.requested_book.title}
                author={exchange.requested_book.author}
                photo={exchange.requested_book.primary_photo}
                coverUrl={exchange.requested_book.cover_url}
              />
              <ArrowRightLeft className="w-6 h-6 text-[#8C9C92] flex-shrink-0" aria-hidden="true" />
              <BookPanel
                title={exchange.offered_book.title}
                author={exchange.offered_book.author}
                photo={exchange.offered_book.primary_photo}
                coverUrl={exchange.offered_book.cover_url}
              />
            </div>
          </div>

          {/* Participants */}
          <div className="flex gap-4">
            <div className="flex-1 bg-[#1A251D] rounded-xl border border-[#28382D] p-4">
              <p className="text-xs text-[#8C9C92] mb-1">{t('detail.requester', 'Requester')}</p>
              <p className="text-sm font-medium text-white">{exchange.requester.username}</p>
              <p className="text-xs text-[#8C9C92]">{exchange.requester.swap_count} {t('incoming.swaps', 'swaps')}</p>
            </div>
            <div className="flex-1 bg-[#1A251D] rounded-xl border border-[#28382D] p-4">
              <p className="text-xs text-[#8C9C92] mb-1">{t('detail.owner', 'Owner')}</p>
              <p className="text-sm font-medium text-white">{exchange.owner.username}</p>
              <p className="text-xs text-[#8C9C92]">{exchange.owner.swap_count} {t('incoming.swaps', 'swaps')}</p>
            </div>
          </div>

          {/* Message */}
          {exchange.message && (
            <div className="bg-[#1A251D] rounded-xl border border-[#28382D] p-4">
              <p className="text-xs text-[#8C9C92] mb-1">{t('detail.message', 'Message')}</p>
              <p className="text-sm text-white">{exchange.message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="bg-[#1A251D] rounded-xl border border-[#28382D] p-6">
            <DetailActions exchange={exchange} />
          </div>

          {/* Rating */}
          {(exchange.status === 'completed' || exchange.status === 'returned') && (
            <RatingPrompt exchangeId={exchange.id} />
          )}

          {/* Chat */}
          {isChatEligible(exchange.status) && currentUserId && (
            <ChatPanel
              exchangeId={exchange.id}
              currentUserId={currentUserId}
              partnerName={isOwner ? exchange.requester.username : exchange.owner.username}
              partnerAvatar={isOwner ? exchange.requester.avatar : exchange.owner.avatar}
              isReadOnly={isChatReadOnly(exchange.status)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
