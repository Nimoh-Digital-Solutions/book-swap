import type { ExchangeStatus } from '@/types';
import {
  ACTIVE_STATUSES as SHARED_ACTIVE,
  PENDING_STATUSES as SHARED_PENDING,
  HISTORY_STATUSES as SHARED_HISTORY,
} from '@shared/constants/exchanges';

export const ACTIVE_STATUSES: ExchangeStatus[] = [...SHARED_ACTIVE];
export const PENDING_STATUSES: ExchangeStatus[] = [...SHARED_PENDING];
export const HISTORY_STATUSES: ExchangeStatus[] = [...SHARED_HISTORY];

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
