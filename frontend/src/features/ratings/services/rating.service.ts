/**
 * rating.service.ts
 *
 * Thin API wrappers for rating endpoints.
 * Consumed by TanStack Query hooks — never called directly from components.
 */
import { API } from '@configs/apiEndpoints';
import { http } from '@services';

import type {
  ExchangeRatingStatus,
  PaginatedRatings,
  Rating,
  SubmitRatingPayload,
} from '../types/rating.types';

export const ratingService = {
  /** Get rating status for a specific exchange. */
  async getExchangeStatus(exchangeId: string): Promise<ExchangeRatingStatus> {
    const { data } = await http.get<ExchangeRatingStatus>(
      API.ratings.exchangeStatus(exchangeId),
    );
    return data;
  },

  /** Submit a rating for an exchange. */
  async submitRating(
    exchangeId: string,
    payload: SubmitRatingPayload,
  ): Promise<Rating> {
    const { data } = await http.post<Rating>(
      API.ratings.exchangeSubmit(exchangeId),
      payload,
    );
    return data;
  },

  /** List public ratings for a user. */
  async listUserRatings(userId: string): Promise<PaginatedRatings> {
    const { data } = await http.get<PaginatedRatings>(
      API.ratings.userRatings(userId),
    );
    return data;
  },
};
