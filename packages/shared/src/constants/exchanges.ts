import type { DeclineReason, ExchangeStatus } from '../types/exchange';

export const EXCHANGE_STATUSES = [
  'pending', 'accepted', 'conditions_pending', 'active', 'swap_confirmed',
  'completed', 'declined', 'cancelled', 'expired', 'return_requested', 'returned',
] as const satisfies readonly ExchangeStatus[];

export const ACTIVE_STATUSES: ExchangeStatus[] = ['accepted', 'conditions_pending', 'active', 'swap_confirmed'];
export const PENDING_STATUSES: ExchangeStatus[] = ['pending'];
export const HISTORY_STATUSES: ExchangeStatus[] = ['completed', 'declined', 'cancelled', 'expired', 'return_requested', 'returned'];

export const DECLINE_REASONS = ['not_interested', 'reserved', 'other'] as const satisfies readonly DeclineReason[];
