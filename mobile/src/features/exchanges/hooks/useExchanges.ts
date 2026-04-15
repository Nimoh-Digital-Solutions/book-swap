import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import type { ExchangeRequest, PaginatedResponse } from '@/types';

export function useExchanges() {
  return useQuery({
    queryKey: ['exchanges'],
    queryFn: async () => {
      const { data } = await http.get<PaginatedResponse<ExchangeRequest>>(
        API.exchanges.list,
      );
      return data.results;
    },
  });
}

export function useExchangeDetail(exchangeId: string) {
  return useQuery({
    queryKey: ['exchange', exchangeId],
    queryFn: async () => {
      const { data } = await http.get<ExchangeRequest>(
        API.exchanges.detail(exchangeId),
      );
      return data;
    },
    enabled: !!exchangeId,
  });
}

export function useIncomingRequests() {
  return useQuery({
    queryKey: ['exchanges', 'incoming'],
    queryFn: async () => {
      const { data } = await http.get<PaginatedResponse<ExchangeRequest>>(
        API.exchanges.incoming,
      );
      return data.results;
    },
  });
}

export function useIncomingCount() {
  return useQuery({
    queryKey: ['exchanges', 'incoming', 'count'],
    queryFn: async () => {
      const { data } = await http.get<{ count: number }>(
        API.exchanges.incomingCount,
      );
      return data.count;
    },
    refetchInterval: 30_000,
  });
}

export function useRequestSwap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      requested_book: string;
      offered_book?: string;
      message?: string;
    }) => {
      const { data } = await http.post<ExchangeRequest>(
        API.exchanges.create,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
    },
  });
}

export function useAcceptExchange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (exchangeId: string) => {
      const { data } = await http.post(API.exchanges.accept(exchangeId));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
    },
  });
}

export function useDeclineExchange() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      exchangeId,
      reason,
    }: {
      exchangeId: string;
      reason?: string;
    }) => {
      const { data } = await http.post(API.exchanges.decline(exchangeId), {
        reason,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchanges'] });
    },
  });
}
