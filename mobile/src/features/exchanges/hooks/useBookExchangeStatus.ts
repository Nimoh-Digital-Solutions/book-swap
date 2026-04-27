import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import type { ExchangeListItem, ExchangeStatus } from '@/types';
import { useExchanges } from './useExchanges';

const TERMINAL_STATUSES: ExchangeStatus[] = ['cancelled', 'expired'];

interface BookExchangeStatus {
  exchange: ExchangeListItem | null;
  status: ExchangeStatus | null;
  isLoading: boolean;
}

/**
 * Given a bookId, finds whether the current user has a non-terminal exchange
 * involving that book (either as the requested book or the offered book).
 *
 * Returns the most relevant exchange and its status, or null if none exists.
 * "Declined" is returned (so the UI can show a status) but allows re-requesting.
 */
export function useBookExchangeStatus(bookId: string): BookExchangeStatus {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: exchanges, isLoading } = useExchanges();

  const match = useMemo(() => {
    if (!exchanges || !currentUserId) return null;

    const candidates = exchanges.filter((e) => {
      if (TERMINAL_STATUSES.includes(e.status)) return false;
      const isRequester = e.requester.id === currentUserId;
      if (isRequester && e.requested_book.id === bookId) return true;
      const isOwner = e.owner.id === currentUserId;
      if (isOwner && e.requested_book.id === bookId) return true;
      return false;
    });

    if (candidates.length === 0) return null;

    // Prefer the most recent non-terminal exchange
    return candidates.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
  }, [exchanges, currentUserId, bookId]);

  return {
    exchange: match ?? null,
    status: match?.status ?? null,
    isLoading,
  };
}
