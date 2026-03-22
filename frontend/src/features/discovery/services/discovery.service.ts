/**
 * discovery.service.ts
 *
 * Thin API wrappers for browse/discovery endpoints.
 * Consumed by TanStack Query hooks — never called directly from components.
 */
import { API } from '@configs/apiEndpoints';
import { http } from '@services';

import type {
  BrowseFilters,
  NearbyCount,
  PaginatedBrowseBooks,
  RadiusCounts,
} from '../types/discovery.types';

export const discoveryService = {
  /** Browse nearby books with filters. Accepts optional page URL for pagination. */
  async browse(
    filters: BrowseFilters,
    pageUrl?: string,
  ): Promise<PaginatedBrowseBooks> {
    if (pageUrl) {
      const { data } = await http.get<PaginatedBrowseBooks>(pageUrl);
      return data;
    }

    const params = new URLSearchParams();
    if (filters.radius) params.set('radius', String(filters.radius));
    if (filters.search) params.set('search', filters.search);
    if (filters.genre?.length)
      params.set('genre', filters.genre.join(','));
    if (filters.language?.length)
      params.set('language', filters.language.join(','));
    if (filters.condition?.length)
      params.set('condition', filters.condition.join(','));
    if (filters.ordering) params.set('ordering', filters.ordering);

    const qs = params.toString();
    const url = qs
      ? `${API.browse.list}?${qs}`
      : API.browse.list;
    const { data } = await http.get<PaginatedBrowseBooks>(url);
    return data;
  },

  /** Fetch book counts per radius bucket. */
  async radiusCounts(): Promise<RadiusCounts> {
    const { data } = await http.get<RadiusCounts>(API.browse.radiusCounts);
    return data;
  },

  /** Fetch nearby book count (public / AllowAny). */
  async nearbyCount(
    lat: number,
    lng: number,
    radius = 5000,
  ): Promise<NearbyCount> {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius: String(radius),
    });
    const { data } = await http.get<NearbyCount>(
      `${API.browse.nearbyCount}?${params}`,
    );
    return data;
  },
};
