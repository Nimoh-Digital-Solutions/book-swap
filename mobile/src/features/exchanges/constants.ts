import type { ExchangeStatus } from '@/types';

export const ACTIVE_STATUSES: ExchangeStatus[] = [
  'accepted',
  'conditions_pending',
  'active',
  'swap_confirmed',
];

export const PENDING_STATUSES: ExchangeStatus[] = ['pending'];

export const HISTORY_STATUSES: ExchangeStatus[] = [
  'completed',
  'declined',
  'cancelled',
  'expired',
  'return_requested',
  'returned',
];

export const TIMELINE_STATUSES: ExchangeStatus[] = [
  'pending',
  'accepted',
  'conditions_pending',
  'active',
  'swap_confirmed',
  'completed',
];

export const CHAT_ELIGIBLE_STATUSES: ExchangeStatus[] = [
  'active',
  'swap_confirmed',
  'completed',
  'return_requested',
  'returned',
];

export const CHAT_READ_ONLY_STATUSES: ExchangeStatus[] = [
  'completed',
  'return_requested',
  'returned',
];

export const STATUS_LABELS: Record<ExchangeStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  conditions_pending: 'Conditions Pending',
  active: 'Active',
  swap_confirmed: 'Swap Confirmed',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
  expired: 'Expired',
  return_requested: 'Return Requested',
  returned: 'Returned',
};
