import { API } from '@/configs/apiEndpoints';

jest.mock('@/services/http', () => ({
  http: { get: jest.fn(), post: jest.fn() },
}));

import { http } from '@/services/http';
import type { ExchangeRatingStatus, Rating, PaginatedRatings } from '@/types';

const httpGet = http.get as jest.MockedFunction<typeof http.get>;
const httpPost = http.post as jest.MockedFunction<typeof http.post>;

describe('rating API calls', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fetches exchange rating status', async () => {
    const status: ExchangeRatingStatus = {
      user_has_rated: false,
      partner_has_rated: true,
      user_rating: null,
      partner_rating: null,
    };
    httpGet.mockResolvedValue({ data: status });

    const { data } = await http.get(API.ratings.exchangeStatus('ex-1'));
    expect(httpGet).toHaveBeenCalledWith(API.ratings.exchangeStatus('ex-1'));
    expect(data).toEqual(status);
  });

  it('submits a rating for an exchange', async () => {
    const rating: Rating = {
      id: 'r-1',
      exchange: 'ex-1',
      reviewer: 'u1',
      reviewed_user: 'u2',
      score: 5,
      comment: 'Great swap!',
      created_at: '2026-01-01T00:00:00Z',
    };
    httpPost.mockResolvedValue({ data: rating });

    const payload = { score: 5, comment: 'Great swap!' };
    const { data } = await http.post(API.ratings.exchangeSubmit('ex-1'), payload);
    expect(httpPost).toHaveBeenCalledWith(API.ratings.exchangeSubmit('ex-1'), payload);
    expect(data).toEqual(rating);
  });

  it('fetches user ratings (paginated)', async () => {
    const page: PaginatedRatings = {
      count: 1,
      next: null,
      previous: null,
      results: [{
        id: 'r-1',
        exchange: 'ex-1',
        reviewer: 'u2',
        reviewed_user: 'u1',
        score: 4,
        comment: 'Good',
        created_at: '2026-01-01T00:00:00Z',
      }],
    };
    httpGet.mockResolvedValue({ data: page });

    const { data } = await http.get(API.ratings.userRatings('u1'));
    expect(httpGet).toHaveBeenCalledWith(API.ratings.userRatings('u1'));
    expect(data.results).toHaveLength(1);
  });

  it('constructs correct rating URLs', () => {
    expect(API.ratings.exchangeStatus('abc')).toBe('/ratings/exchanges/abc/');
    expect(API.ratings.exchangeSubmit('abc')).toBe('/ratings/exchanges/abc/');
    expect(API.ratings.userRatings('u1')).toBe('/ratings/users/u1/');
  });
});
