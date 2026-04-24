import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import {
  acceptExchange as acceptExchangeApi,
  completeExchange as completeExchangeApi,
  confirmSwap as confirmSwapApi,
  createExchange as createExchangeApi,
  declineExchange as declineExchangeApi,
  requestReturn as requestReturnApi,
} from '@/features/exchanges/exchangeApi';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { enqueueMutation } from '@/lib/offlineMutationQueue';
import { showInfoToast, showErrorToast } from '@/components/Toast';
import type {
  ExchangeListItem,
  ExchangeDetail,
  CreateExchangePayload,
  CounterProposePayload,
  DeclinePayload,
  PaginatedResponse,
} from '@/types';

const keys = {
  all: ['exchanges'] as const,
  lists: () => [...keys.all, 'list'] as const,
  detail: (id: string) => [...keys.all, 'detail', id] as const,
  incoming: () => [...keys.all, 'incoming'] as const,
  incomingCount: () => [...keys.all, 'incoming', 'count'] as const,
};

// ── Queries ──────────────────────────────────────────────────────────────────

export function useExchanges() {
  return useQuery({
    queryKey: keys.lists(),
    queryFn: async () => {
      const { data } = await http.get<PaginatedResponse<ExchangeListItem>>(
        API.exchanges.list,
      );
      return data.results;
    },
  });
}

export function useExchangeDetail(exchangeId: string) {
  return useQuery({
    queryKey: keys.detail(exchangeId),
    queryFn: async () => {
      const { data } = await http.get<ExchangeDetail>(
        API.exchanges.detail(exchangeId),
      );
      return data;
    },
    enabled: !!exchangeId,
  });
}

export function useIncomingRequests() {
  return useQuery({
    queryKey: keys.incoming(),
    queryFn: async () => {
      const { data } = await http.get<PaginatedResponse<ExchangeListItem>>(
        API.exchanges.incoming,
      );
      return data.results;
    },
  });
}

export function useIncomingCount() {
  return useQuery({
    queryKey: keys.incomingCount(),
    queryFn: async () => {
      const { data } = await http.get<{ count: number }>(
        API.exchanges.incomingCount,
      );
      return data.count;
    },
    refetchInterval: 30_000,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function useCreateExchange() {
  const qc = useQueryClient();
  const { isOffline } = useNetworkStatus();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (payload: CreateExchangePayload) => {
      if (isOffline) {
        enqueueMutation({
          endpoint: API.exchanges.create,
          method: 'post',
          data: payload,
          invalidateKeys: ['exchanges'],
        });
        showInfoToast(t('offline.queuedForSync'));
        return { id: `offline-${Date.now()}` } as ExchangeDetail;
      }

      return createExchangeApi(payload);
    },
    onSuccess: (_data, _vars, _ctx) => {
      if (!isOffline) {
        qc.invalidateQueries({ queryKey: keys.lists() });
        qc.invalidateQueries({ queryKey: keys.incoming() });
      }
    },
  });
}

export function useAcceptExchange() {
  const qc = useQueryClient();
  const { isOffline } = useNetworkStatus();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (exchangeId: string) => {
      if (isOffline) {
        enqueueMutation({
          endpoint: API.exchanges.accept(exchangeId),
          method: 'post',
          invalidateKeys: ['exchanges'],
        });
        showInfoToast(t('offline.queuedForSync'));
        return { id: exchangeId } as ExchangeDetail;
      }

      return acceptExchangeApi(exchangeId);
    },
    onSuccess: (_data, exchangeId) => {
      if (!isOffline) {
        qc.invalidateQueries({ queryKey: keys.detail(exchangeId) });
        qc.invalidateQueries({ queryKey: keys.incoming() });
        qc.invalidateQueries({ queryKey: keys.lists() });
      }
    },
  });
}

export function useDeclineExchange() {
  const qc = useQueryClient();
  const { isOffline } = useNetworkStatus();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async ({
      exchangeId,
      payload,
    }: {
      exchangeId: string;
      payload?: DeclinePayload;
    }) => {
      if (isOffline) {
        enqueueMutation({
          endpoint: API.exchanges.decline(exchangeId),
          method: 'post',
          data: payload,
          invalidateKeys: ['exchanges'],
        });
        showInfoToast(t('offline.queuedForSync'));
        return { id: exchangeId } as ExchangeDetail;
      }

      return declineExchangeApi(exchangeId, payload);
    },
    onSuccess: (_data, { exchangeId }) => {
      if (!isOffline) {
        qc.invalidateQueries({ queryKey: keys.detail(exchangeId) });
        qc.invalidateQueries({ queryKey: keys.incoming() });
        qc.invalidateQueries({ queryKey: keys.lists() });
      }
    },
  });
}

export function useCounterExchange() {
  const qc = useQueryClient();
  const { isOffline } = useNetworkStatus();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async ({
      exchangeId,
      payload,
    }: {
      exchangeId: string;
      payload: CounterProposePayload;
    }) => {
      if (isOffline) {
        // AUD-M-102: queue counter-offer when the user is offline.
        // Backend will validate when the queue drains; on a 4xx the
        // queue-runner drops the entry and invalidates exchanges so the
        // user sees the latest server state.
        enqueueMutation({
          endpoint: API.exchanges.counter(exchangeId),
          method: 'post',
          data: payload,
          invalidateKeys: ['exchanges'],
        });
        showInfoToast(t('offline.queuedForSync'));
        return { id: exchangeId } as ExchangeDetail;
      }

      const { data } = await http.post<ExchangeDetail>(
        API.exchanges.counter(exchangeId),
        payload,
      );
      return data;
    },
    onSuccess: (_data, { exchangeId }) => {
      if (!isOffline) {
        qc.invalidateQueries({ queryKey: keys.detail(exchangeId) });
        qc.invalidateQueries({ queryKey: keys.lists() });
        qc.invalidateQueries({ queryKey: keys.incoming() });
      }
    },
    onError: () => showErrorToast(t('common.error', 'Something went wrong')),
  });
}

export function useApproveCounter() {
  const qc = useQueryClient();
  const { isOffline } = useNetworkStatus();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async (exchangeId: string) => {
      if (isOffline) {
        // AUD-M-102: approving a counter-offer is idempotent server-side
        // (state machine guard rejects duplicates), so it is safe to queue.
        enqueueMutation({
          endpoint: API.exchanges.approveCounter(exchangeId),
          method: 'post',
          invalidateKeys: ['exchanges'],
        });
        showInfoToast(t('offline.queuedForSync'));
        return { id: exchangeId } as ExchangeDetail;
      }

      const { data } = await http.post<ExchangeDetail>(
        API.exchanges.approveCounter(exchangeId),
      );
      return data;
    },
    onSuccess: (_data, exchangeId) => {
      if (!isOffline) {
        qc.invalidateQueries({ queryKey: keys.detail(exchangeId) });
        qc.invalidateQueries({ queryKey: keys.lists() });
      }
    },
    onError: () => showErrorToast(t('common.error', 'Something went wrong')),
  });
}

export function useCancelExchange() {
  const qc = useQueryClient();
  const { isOffline } = useNetworkStatus();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (exchangeId: string) => {
      if (isOffline) {
        enqueueMutation({
          endpoint: API.exchanges.cancel(exchangeId),
          method: 'post',
          invalidateKeys: ['exchanges'],
        });
        showInfoToast(t('offline.queuedForSync'));
        return { id: exchangeId } as ExchangeDetail;
      }

      const { data } = await http.post<ExchangeDetail>(
        API.exchanges.cancel(exchangeId),
      );
      return data;
    },
    onSuccess: (_data, exchangeId) => {
      if (!isOffline) {
        qc.invalidateQueries({ queryKey: keys.detail(exchangeId) });
        qc.invalidateQueries({ queryKey: keys.lists() });
      }
    },
  });
}

export function useAcceptConditions() {
  const qc = useQueryClient();
  const { isOffline } = useNetworkStatus();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async (exchangeId: string) => {
      if (isOffline) {
        // AUD-M-102: accepting conditions is a one-shot transition; queue it.
        enqueueMutation({
          endpoint: API.exchanges.acceptConditions(exchangeId),
          method: 'post',
          invalidateKeys: ['exchanges'],
        });
        showInfoToast(t('offline.queuedForSync'));
        return { id: exchangeId } as ExchangeDetail;
      }

      const { data } = await http.post<ExchangeDetail>(
        API.exchanges.acceptConditions(exchangeId),
      );
      return data;
    },
    onSuccess: (_data, exchangeId) => {
      if (!isOffline) {
        qc.invalidateQueries({ queryKey: keys.detail(exchangeId) });
      }
    },
    onError: () => showErrorToast(t('common.error', 'Something went wrong')),
  });
}

export function useConfirmSwap() {
  const qc = useQueryClient();
  const { isOffline } = useNetworkStatus();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async (exchangeId: string) => {
      if (isOffline) {
        // AUD-M-102: confirm-swap is also idempotent server-side; queue it
        // so users can mark a meetup complete while standing in a lobby
        // with no signal and have it sync moments later.
        enqueueMutation({
          endpoint: API.exchanges.confirmSwap(exchangeId),
          method: 'post',
          invalidateKeys: ['exchanges', 'myBooks'],
        });
        showInfoToast(t('offline.queuedForSync'));
        return { id: exchangeId } as ExchangeDetail;
      }

      return confirmSwapApi(exchangeId);
    },
    onSuccess: (_data, exchangeId) => {
      if (!isOffline) {
        qc.invalidateQueries({ queryKey: keys.detail(exchangeId) });
        qc.invalidateQueries({ queryKey: keys.lists() });
        qc.invalidateQueries({ queryKey: ['myBooks'] });
      }
    },
    onError: () => showErrorToast(t('common.error', 'Something went wrong')),
  });
}

export function useCompleteExchange() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (exchangeId: string) => completeExchangeApi(exchangeId),
    onSuccess: (_data, exchangeId) => {
      qc.invalidateQueries({ queryKey: keys.detail(exchangeId) });
      qc.invalidateQueries({ queryKey: keys.lists() });
      qc.invalidateQueries({ queryKey: ['myBooks'] });
    },
    onError: () => showErrorToast(t('common.error', 'Something went wrong')),
  });
}

export function useRequestReturn() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (exchangeId: string) => requestReturnApi(exchangeId),
    onSuccess: (_data, exchangeId) => {
      qc.invalidateQueries({ queryKey: keys.detail(exchangeId) });
    },
    onError: () => showErrorToast(t('common.error', 'Something went wrong')),
  });
}

export function useConfirmReturn() {
  const qc = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: async (exchangeId: string) => {
      const { data } = await http.post<ExchangeDetail>(
        API.exchanges.confirmReturn(exchangeId),
      );
      return data;
    },
    onSuccess: (_data, exchangeId) => {
      qc.invalidateQueries({ queryKey: keys.detail(exchangeId) });
      qc.invalidateQueries({ queryKey: keys.lists() });
      qc.invalidateQueries({ queryKey: ['myBooks'] });
    },
    onError: () => showErrorToast(t('common.error', 'Something went wrong')),
  });
}
