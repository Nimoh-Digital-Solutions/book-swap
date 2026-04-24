import type { BookCondition, BookLanguage, BookOwner } from './book';

export interface OwnerLocation {
  latitude: number;
  longitude: number;
}

export interface BrowseBookOwner extends BookOwner {
  location: OwnerLocation | null;
}

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
  distance: number;
  created_at: string;
}

export interface PaginatedBrowseBooks {
  count: number;
  next: string | null;
  previous: string | null;
  results: BrowseBook[];
}

export interface RadiusCounts {
  counts: Record<string, number>;
}

export interface NearbyCount {
  count: number;
  user_count: number;
  radius: number;
}

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
  /** Fallback latitude for unauthenticated users (BE uses profile location if authed). */
  lat?: number | undefined;
  /** Fallback longitude for unauthenticated users. */
  lng?: number | undefined;
}

/** A single item in the community activity feed. */
export interface ActivityFeedItem {
  type: 'new_listing' | 'completed_swap' | 'new_rating';
  user_name: string;
  partner_name?: string | undefined;
  book_title?: string | null | undefined;
  score?: number | undefined;
  neighbourhood: string;
  timestamp: string;
}

/** Community stats response (public). */
export interface CommunityStats {
  swaps_this_week: number;
  activity_feed: ActivityFeedItem[];
}
