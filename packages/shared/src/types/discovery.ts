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
  radius?: number;
  search?: string;
  genre?: string[];
  language?: string[];
  condition?: string[];
  ordering?: BrowseOrdering;
  page_size?: number;
  page?: number;
}
