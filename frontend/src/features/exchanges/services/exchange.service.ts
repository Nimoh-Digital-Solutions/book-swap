/**
 * exchange.service.ts
 *
 * Thin API wrappers for exchange endpoints.
 * Consumed by TanStack Query hooks — never called directly from components.
 */
import { API } from '@configs/apiEndpoints';
import { http } from '@services';

import type {
  ConditionsStatus,
  CounterProposePayload,
  CreateExchangePayload,
  DeclinePayload,
  ExchangeDetail,
  ExchangeListItem,
  IncomingCount,
  PaginatedExchanges,
} from '../types/exchange.types';

export const exchangeService = {
  /** List the current user's exchanges (sent + received). */
  async list(): Promise<PaginatedExchanges> {
    const { data } = await http.get<PaginatedExchanges>(API.exchanges.list);
    return data;
  },

  /** Fetch a single exchange by ID. */
  async getDetail(id: string): Promise<ExchangeDetail> {
    const { data } = await http.get<ExchangeDetail>(API.exchanges.detail(id));
    return data;
  },

  /** Create a new exchange request. */
  async create(payload: CreateExchangePayload): Promise<ExchangeDetail> {
    const { data } = await http.post<ExchangeDetail>(
      API.exchanges.create,
      payload,
    );
    return data;
  },

  /** Accept an exchange request (owner action). */
  async accept(id: string): Promise<ExchangeDetail> {
    const { data } = await http.post<ExchangeDetail>(API.exchanges.accept(id));
    return data;
  },

  /** Decline an exchange request (owner action). */
  async decline(id: string, payload?: DeclinePayload): Promise<ExchangeDetail> {
    const { data } = await http.post<ExchangeDetail>(
      API.exchanges.decline(id),
      payload,
    );
    return data;
  },

  /** Counter-propose with a different book (owner action). */
  async counter(
    id: string,
    payload: CounterProposePayload,
  ): Promise<ExchangeDetail> {
    const { data } = await http.post<ExchangeDetail>(
      API.exchanges.counter(id),
      payload,
    );
    return data;
  },

  /** Cancel a pending exchange request (requester action). */
  async cancel(id: string): Promise<ExchangeDetail> {
    const { data } = await http.post<ExchangeDetail>(API.exchanges.cancel(id));
    return data;
  },

  /** Accept exchange conditions. */
  async acceptConditions(id: string): Promise<ExchangeDetail> {
    const { data } = await http.post<ExchangeDetail>(
      API.exchanges.acceptConditions(id),
    );
    return data;
  },

  /** Get conditions acceptance status. */
  async getConditions(id: string): Promise<ConditionsStatus> {
    const { data } = await http.get<ConditionsStatus>(
      API.exchanges.conditions(id),
    );
    return data;
  },

  /** Confirm swap happened. */
  async confirmSwap(id: string): Promise<ExchangeDetail> {
    const { data } = await http.post<ExchangeDetail>(
      API.exchanges.confirmSwap(id),
    );
    return data;
  },

  /** Request book return. */
  async requestReturn(id: string): Promise<ExchangeDetail> {
    const { data } = await http.post<ExchangeDetail>(
      API.exchanges.requestReturn(id),
    );
    return data;
  },

  /** Confirm book return. */
  async confirmReturn(id: string): Promise<ExchangeDetail> {
    const { data } = await http.post<ExchangeDetail>(
      API.exchanges.confirmReturn(id),
    );
    return data;
  },

  /** List incoming requests (owner perspective). */
  async incoming(): Promise<ExchangeListItem[]> {
    const { data } = await http.get<PaginatedExchanges>(
      API.exchanges.incoming,
    );
    return data.results;
  },

  /** Get count of pending incoming requests (for nav badge). */
  async incomingCount(): Promise<IncomingCount> {
    const { data } = await http.get<IncomingCount>(
      API.exchanges.incomingCount,
    );
    return data;
  },
};
