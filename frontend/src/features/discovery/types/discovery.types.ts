/**
 * discovery.types.ts
 *
 * Type contracts for the discovery/browse feature, aligned with the
 * Django BrowseBookListSerializer, BrowseFilterSerializer, and
 * NearbyCountView.
 */
import type { BookCondition, BookLanguage, BookOwner } from '@features/books';

// ---------------------------------------------------------------------------
// Response shapes (from BE)
// ---------------------------------------------------------------------------

/** Snapped owner location for map pins. */
export interface OwnerLocation {
  latitude: number;
  longitude: number;
}

/** Owner info in browse results — extends BookOwner with snapped location. */
export interface BrowseBookOwner extends BookOwner {
  location: OwnerLocation | null;
}

/** A book in browse results — extends BookListItem with distance. */
export interface BrowseBook {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  condition: BookCondition;
  language: BookLanguage;
  status: 'available';
  primary_photo: string | null;
  owner: BrowseBookOwner;
  distance: number; // km, rounded to 1 decimal
  created_at: string;
}

/** Paginated browse response. */
export interface PaginatedBrowseBooks {
  count: number;
  next: string | null;
  previous: string | null;
  results: BrowseBook[];
}

/** Radius-counts response: book count per radius bucket. */
export interface RadiusCounts {
  counts: Record<string, number>;
}

/** Nearby-count response (public). */
export interface NearbyCount {
  count: number;
  user_count: number;
  radius: number;
}

// ---------------------------------------------------------------------------
// Filter / query params
// ---------------------------------------------------------------------------

export type BrowseOrdering = 'distance' | '-created_at' | 'relevance';

export interface BrowseFilters {
  radius?: number | undefined;
  search?: string | undefined;
  genre?: string[] | undefined;
  language?: string[] | undefined;
  condition?: string[] | undefined;
  ordering?: BrowseOrdering | undefined;
  page_size?: number | undefined;
  page?: number | undefined;
}
