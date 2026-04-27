/**
 * exchange.types.ts
 *
 * Re-exports from `@shared` — see `packages/shared/src/types/exchange.ts`
 * for the canonical contracts (the BookSwap source of truth shared with the
 * mobile app).
 */

export type {
  ConditionsAcceptanceItem,
  ConditionsStatus,
  CounterProposePayload,
  CreateExchangePayload,
  DeclinePayload,
  DeclineReason,
  ExchangeBook,
  ExchangeDetail,
  ExchangeListItem,
  ExchangeParticipant,
  ExchangeStatus,
  IncomingCount,
  PaginatedExchanges,
} from '@shared/types/exchange';
