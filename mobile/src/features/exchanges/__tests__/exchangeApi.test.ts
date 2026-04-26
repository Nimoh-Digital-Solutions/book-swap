import { API } from '@/configs/apiEndpoints';
import type { CreateExchangePayload, ExchangeDetail } from '@/types';

jest.mock('@/services/http', () => ({
  http: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import { http } from '@/services/http';
import {
  acceptExchange,
  confirmSwap,
  createExchange,
  declineExchange,
  requestReturn,
} from '@/features/exchanges/exchangeApi';

const httpPost = http.post as jest.MockedFunction<typeof http.post>;

function makeExchange(overrides: Partial<ExchangeDetail> = {}): ExchangeDetail {
  return {
    id: 'ex-1',
    status: 'pending',
    swap_type: 'temporary',
    message: '',
    requester: {
      id: 'u1',
      username: 'a',
      avatar: null,
      avg_rating: null,
      swap_count: 0,
    },
    owner: {
      id: 'u2',
      username: 'b',
      avatar: null,
      avg_rating: null,
      swap_count: 0,
    },
    requested_book: {
      id: 'b1',
      title: 'T1',
      author: 'A1',
      cover_url: '',
      condition: 'good',
      primary_photo: null,
      primary_thumbnail: null,
    },
    offered_book: {
      id: 'b2',
      title: 'T2',
      author: 'A2',
      cover_url: '',
      condition: 'good',
      primary_photo: null,
      primary_thumbnail: null,
    },
    created_at: '2020-01-01T00:00:00Z',
    updated_at: '2020-01-01T00:00:00Z',
    unread_count: 0,
    last_message_at: null,
    last_message_preview: '',
    decline_reason: null,
    counter_to: null,
    original_offered_book: null,
    last_counter_by: null,
    counter_approved_at: null,
    requester_counter_count: 0,
    owner_counter_count: 0,
    max_counter_offers: 2,
    counter_offers_remaining_by_me: 2,
    requester_confirmed_at: null,
    owner_confirmed_at: null,
    return_requested_at: null,
    return_confirmed_requester: null,
    return_confirmed_owner: null,
    expired_at: null,
    conditions_accepted_by_me: false,
    conditions_accepted_count: 0,
    conditions_version: '1',
    ...overrides,
  };
}

describe('exchangeApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createExchange posts to create endpoint', async () => {
    const payload: CreateExchangePayload = {
      requested_book_id: 'b-req',
      offered_book_id: 'b-off',
    };
    const detail = makeExchange();
    httpPost.mockResolvedValue({ data: detail });

    const out = await createExchange(payload);
    expect(httpPost).toHaveBeenCalledWith(API.exchanges.create, payload);
    expect(out).toEqual(detail);
  });

  it('acceptExchange posts to accept URL', async () => {
    const detail = makeExchange({ status: 'accepted' });
    httpPost.mockResolvedValue({ data: detail });

    const out = await acceptExchange('ex-1');
    expect(httpPost).toHaveBeenCalledWith(API.exchanges.accept('ex-1'));
    expect(out).toEqual(detail);
  });

  it('declineExchange posts optional payload', async () => {
    const detail = makeExchange({ status: 'declined' });
    httpPost.mockResolvedValue({ data: detail });

    const out = await declineExchange('ex-1', { reason: 'other' });
    expect(httpPost).toHaveBeenCalledWith(API.exchanges.decline('ex-1'), {
      reason: 'other',
    });
    expect(out).toEqual(detail);
  });

  it('confirmSwap posts to confirm-swap URL', async () => {
    const detail = makeExchange();
    httpPost.mockResolvedValue({ data: detail });

    const out = await confirmSwap('ex-1');
    expect(httpPost).toHaveBeenCalledWith(API.exchanges.confirmSwap('ex-1'));
    expect(out).toEqual(detail);
  });

  it('requestReturn posts to request-return URL', async () => {
    const detail = makeExchange();
    httpPost.mockResolvedValue({ data: detail });

    const out = await requestReturn('ex-1');
    expect(httpPost).toHaveBeenCalledWith(API.exchanges.requestReturn('ex-1'));
    expect(out).toEqual(detail);
  });

  it('propagates HTTP errors from post', async () => {
    const err = Object.assign(new Error('Bad'), { response: { status: 400 } });
    httpPost.mockRejectedValue(err);

    await expect(acceptExchange('ex-1')).rejects.toBe(err);
  });
});
