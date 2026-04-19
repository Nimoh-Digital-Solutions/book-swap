export type BookCondition = 'new' | 'like_new' | 'good' | 'acceptable';

export type BookStatus = 'available' | 'in_exchange' | 'returned';

export type BookLanguage = 'en' | 'nl' | 'de' | 'fr' | 'es' | 'other';

export type SwapType = 'temporary' | 'permanent';

export interface BookOwner {
  id: string;
  username: string;
  avatar: string | null;
  neighborhood: string;
  avg_rating: string;
}

export interface BookPhoto {
  id: string;
  image: string;
  position: number;
  created_at: string;
}

export interface BookListItem {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  condition: BookCondition;
  language: BookLanguage;
  status: BookStatus;
  swap_type: SwapType;
  primary_photo: string | null;
  owner: BookOwner;
  created_at: string;
}

export interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  description: string;
  cover_url: string;
  condition: BookCondition;
  genres: string[];
  language: BookLanguage;
  status: BookStatus;
  swap_type: SwapType;
  notes: string;
  page_count: number | null;
  publish_year: number | null;
  photos: BookPhoto[];
  owner: BookOwner;
  created_at: string;
  updated_at: string;
}

export interface BookMetadata {
  isbn: string;
  title: string;
  author: string;
  description: string;
  cover_url: string;
  page_count: number | null;
  publish_year: number | null;
}

export interface PaginatedBooks {
  count: number;
  next: string | null;
  previous: string | null;
  results: BookListItem[];
}

export interface CreateBookPayload {
  isbn?: string;
  title: string;
  author: string;
  description?: string;
  cover_url?: string;
  condition: BookCondition;
  genres?: string[];
  language: BookLanguage;
  swap_type: SwapType;
  notes?: string;
  page_count?: number | null;
  publish_year?: number | null;
}

export interface UpdateBookPayload {
  title?: string;
  author?: string;
  description?: string;
  cover_url?: string;
  condition?: BookCondition;
  genres?: string[];
  language?: BookLanguage;
  swap_type?: SwapType;
  notes?: string;
  page_count?: number | null;
  publish_year?: number | null;
  status?: BookStatus;
}

export interface WishlistItem {
  id: string;
  isbn: string;
  title: string;
  author: string;
  genre: string;
  cover_url: string;
  created_at: string;
}

export interface PaginatedWishlist {
  count: number;
  next: string | null;
  previous: string | null;
  results: WishlistItem[];
}

export interface BookListFilters {
  owner?: string;
  status?: BookStatus;
  genre?: string;
  language?: BookLanguage;
  search?: string;
}
