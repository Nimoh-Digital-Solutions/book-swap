import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import type {
  ExchangeDetail,
  CreateExchangePayload,
  DeclinePayload,
} from '@/types';

export async function createExchange(
  payload: CreateExchangePayload,
): Promise<ExchangeDetail> {
  const { data } = await http.post<ExchangeDetail>(
    API.exchanges.create,
    payload,
  );
  return data;
}

export async function acceptExchange(
  exchangeId: string,
): Promise<ExchangeDetail> {
  const { data } = await http.post<ExchangeDetail>(
    API.exchanges.accept(exchangeId),
  );
  return data;
}

export async function declineExchange(
  exchangeId: string,
  payload?: DeclinePayload,
): Promise<ExchangeDetail> {
  const { data } = await http.post<ExchangeDetail>(
    API.exchanges.decline(exchangeId),
    payload,
  );
  return data;
}

export async function confirmSwap(
  exchangeId: string,
): Promise<ExchangeDetail> {
  const { data } = await http.post<ExchangeDetail>(
    API.exchanges.confirmSwap(exchangeId),
  );
  return data;
}

export async function completeExchange(
  exchangeId: string,
): Promise<ExchangeDetail> {
  const { data } = await http.post<ExchangeDetail>(
    API.exchanges.complete(exchangeId),
  );
  return data;
}

export async function requestReturn(
  exchangeId: string,
): Promise<ExchangeDetail> {
  const { data } = await http.post<ExchangeDetail>(
    API.exchanges.requestReturn(exchangeId),
  );
  return data;
}
