/**
 * useExchangeMutations.ts
 *
 * TanStack Query mutation hooks for all exchange actions.
 * Each mutation invalidates the relevant queries on success.
 */
import { bookKeys } from '@features/books';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { exchangeService } from '../services/exchange.service';
import type {
  CounterProposePayload,
  CreateExchangePayload,
  DeclinePayload,
  ExchangeDetail,
} from '../types/exchange.types';
import { exchangeKeys } from './exchangeKeys';

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export function useCreateExchange() {
  const qc = useQueryClient();
  return useMutation<ExchangeDetail, Error, CreateExchangePayload>({
    mutationFn: (payload) => exchangeService.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: exchangeKeys.lists() });
      void qc.invalidateQueries({ queryKey: exchangeKeys.incoming() });
    },
  });
}

// ---------------------------------------------------------------------------
// Accept
// ---------------------------------------------------------------------------

export function useAcceptExchange() {
  const qc = useQueryClient();
  return useMutation<ExchangeDetail, Error, string>({
    mutationFn: (id) => exchangeService.accept(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: exchangeKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: exchangeKeys.incoming() });
      void qc.invalidateQueries({ queryKey: exchangeKeys.lists() });
    },
  });
}

// ---------------------------------------------------------------------------
// Decline
// ---------------------------------------------------------------------------

export function useDeclineExchange() {
  const qc = useQueryClient();
  return useMutation<
    ExchangeDetail,
    Error,
    { id: string; payload?: DeclinePayload | undefined }
  >({
    mutationFn: ({ id, payload }) => exchangeService.decline(id, payload),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: exchangeKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: exchangeKeys.incoming() });
      void qc.invalidateQueries({ queryKey: exchangeKeys.lists() });
    },
  });
}

// ---------------------------------------------------------------------------
// Counter-propose
// ---------------------------------------------------------------------------

export function useCounterExchange() {
  const qc = useQueryClient();
  return useMutation<
    ExchangeDetail,
    Error,
    { id: string; payload: CounterProposePayload }
  >({
    mutationFn: ({ id, payload }) => exchangeService.counter(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: exchangeKeys.lists() });
      void qc.invalidateQueries({ queryKey: exchangeKeys.incoming() });
    },
  });
}

// ---------------------------------------------------------------------------
// Approve counter-proposal
// ---------------------------------------------------------------------------

export function useApproveCounter() {
  const qc = useQueryClient();
  return useMutation<ExchangeDetail, Error, string>({
    mutationFn: (id) => exchangeService.approveCounter(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: exchangeKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: exchangeKeys.lists() });
      void qc.invalidateQueries({ queryKey: exchangeKeys.incoming() });
    },
  });
}

// ---------------------------------------------------------------------------
// Cancel
// ---------------------------------------------------------------------------

export function useCancelExchange() {
  const qc = useQueryClient();
  return useMutation<ExchangeDetail, Error, string>({
    mutationFn: (id) => exchangeService.cancel(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: exchangeKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: exchangeKeys.lists() });
    },
  });
}

// ---------------------------------------------------------------------------
// Accept conditions
// ---------------------------------------------------------------------------

export function useAcceptConditions() {
  const qc = useQueryClient();
  return useMutation<ExchangeDetail, Error, string>({
    mutationFn: (id) => exchangeService.acceptConditions(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: exchangeKeys.detail(id) });
    },
  });
}

// ---------------------------------------------------------------------------
// Confirm swap
// ---------------------------------------------------------------------------

export function useConfirmSwap() {
  const qc = useQueryClient();
  return useMutation<ExchangeDetail, Error, string>({
    mutationFn: (id) => exchangeService.confirmSwap(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: exchangeKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: bookKeys.lists() });
      void qc.invalidateQueries({ queryKey: bookKeys.myShelf() });
    },
  });
}

// ---------------------------------------------------------------------------
// Request return
// ---------------------------------------------------------------------------

export function useRequestReturn() {
  const qc = useQueryClient();
  return useMutation<ExchangeDetail, Error, string>({
    mutationFn: (id) => exchangeService.requestReturn(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: exchangeKeys.detail(id) });
    },
  });
}

// ---------------------------------------------------------------------------
// Confirm return
// ---------------------------------------------------------------------------

export function useConfirmReturn() {
  const qc = useQueryClient();
  return useMutation<ExchangeDetail, Error, string>({
    mutationFn: (id) => exchangeService.confirmReturn(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: exchangeKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: bookKeys.lists() });
      void qc.invalidateQueries({ queryKey: bookKeys.myShelf() });
    },
  });
}
