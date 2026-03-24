/**
 * Exchanges feature public API
 *
 * Import from '@features/exchanges' in consuming code — never reach
 * into sub-directories directly from outside this feature.
 *
 * @example
 * import { useExchanges, useCreateExchange, exchangeService } from '@features/exchanges';
 */

// Components
export { ExchangeCard } from './components/ExchangeCard/ExchangeCard';
export { ExchangeStatusBadge } from './components/ExchangeStatusBadge/ExchangeStatusBadge';
export { RequestSwapButton } from './components/RequestSwapButton/RequestSwapButton';

// Hooks
export { exchangeKeys } from './hooks/exchangeKeys';
export { useExchange } from './hooks/useExchange';
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
export { useExchanges } from './hooks/useExchanges';
export { useIncomingRequestCount } from './hooks/useIncomingRequestCount';
export { useIncomingRequests } from './hooks/useIncomingRequests';

// Pages (default exports for lazy loading)
export { default as ExchangeDetailPage } from './pages/ExchangeDetailPage';
export { default as ExchangesPage } from './pages/ExchangesPage';
export { default as IncomingRequestsPage } from './pages/IncomingRequestsPage';

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
