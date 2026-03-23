/**
 * Exchanges feature public API
 *
 * Import from '@features/exchanges' in consuming code — never reach
 * into sub-directories directly from outside this feature.
 *
 * @example
 * import { useExchanges, useCreateExchange, exchangeService } from '@features/exchanges';
 */

// Hooks
export { exchangeKeys } from './hooks/exchangeKeys';
export { useExchange } from './hooks/useExchange';
export { useExchanges } from './hooks/useExchanges';
export {
  useAcceptConditions,
  useAcceptExchange,
  useCancelExchange,
  useConfirmReturn,
  useConfirmSwap,
  useCounterExchange,
  useCreateExchange,
  useDeclineExchange,
  useRequestReturn,
} from './hooks/useExchangeMutations';
export { useIncomingRequestCount } from './hooks/useIncomingRequestCount';
export { useIncomingRequests } from './hooks/useIncomingRequests';

// Schemas
export type {
  CounterProposeFormValues,
  CreateExchangeFormValues,
  DeclineExchangeFormValues,
} from './schemas/exchange.schemas';
export {
  counterProposeSchema,
  createExchangeSchema,
  declineExchangeSchema,
} from './schemas/exchange.schemas';

// Services
export { exchangeService } from './services/exchange.service';

// Types
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
} from './types/exchange.types';
