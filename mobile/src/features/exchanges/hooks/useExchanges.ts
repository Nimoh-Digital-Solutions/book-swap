import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { enqueueMutation } from '@/lib/offlineMutationQueue';
import { showInfoToast } from '@/components/Toast';
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

      const { data } = await http.post<ExchangeDetail>(
        API.exchanges.create,
        payload,
      );
      return data;
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

      const { data } = await http.post<ExchangeDetail>(
        API.exchanges.accept(exchangeId),
      );
      return data;
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

      const { data } = await http.post<ExchangeDetail>(
        API.exchanges.decline(exchangeId),
        payload,
      );
      return data;
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
  return useMutation({
    mutationFn: async ({
      exchangeId,
      payload,
    }: {
      exchangeId: string;
      payload: CounterProposePayload;
    }) => {
      const { data } = await http.post<ExchangeDetail>(
        API.exchanges.counter(exchangeId),
        payload,
      );
      return data;
    },
    onSuccess: (_data, { exchangeId }) => {
      qc.invalidateQueries({ queryKey: keys.detail(exchangeId) });
      qc.invalidateQueries({ queryKey: keys.lists() });
      qc.invalidateQueries({ queryKey: keys.incoming() });
    },
  });
}

export function useApproveCounter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (exchangeId: string) => {
      const { data } = await http.post<ExchangeDetail>(
        API.exchanges.approveCounter(exchangeId),
      );
      return data;
    },
    onSuccess: (_data, exchangeId) => {
      qc.invalidateQueries({ queryKey: keys.detail(exchangeId) });
      qc.invalidateQueries({ queryKey: keys.lists() });
    },
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
  return useMutation({
    mutationFn: async (exchangeId: string) => {
      const { data } = await http.post<ExchangeDetail>(
        API.exchanges.acceptConditions(exchangeId),
      );
      return data;
    },
    onSuccess: (_data, exchangeId) => {
      qc.invalidateQueries({ queryKey: keys.detail(exchangeId) });
    },
  });
}

export function useConfirmSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (exchangeId: string) => {
      const { data } = await http.post<ExchangeDetail>(
        API.exchanges.confirmSwap(exchangeId),
      );
      return data;
    },
    onSuccess: (_data, exchangeId) => {
      qc.invalidateQueries({ queryKey: keys.detail(exchangeId) });
      qc.invalidateQueries({ queryKey: keys.lists() });
      qc.invalidateQueries({ queryKey: ['myBooks'] });
    },
  });
}

export function useRequestReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (exchangeId: string) => {
      const { data } = await http.post<ExchangeDetail>(
        API.exchanges.requestReturn(exchangeId),
      );
      return data;
    },
    onSuccess: (_data, exchangeId) => {
      qc.invalidateQueries({ queryKey: keys.detail(exchangeId) });
    },
  });
}

export function useConfirmReturn() {
  const qc = useQueryClient();
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
  });
}
