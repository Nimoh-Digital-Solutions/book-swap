/**
 * book.types.ts
 *
 * Type contracts for the books feature, aligned with the Django backend
 * serializers: BookListSerializer, BookSerializer, BookCreateSerializer,
 * BookUpdateSerializer, BookPhotoSerializer, WishlistItemSerializer,
 * and ISBNLookupSerializer.
 */

// ---------------------------------------------------------------------------
// Enums / value types
// ---------------------------------------------------------------------------

export type BookCondition = 'new' | 'like_new' | 'good' | 'acceptable';

export type BookStatus = 'available' | 'in_exchange' | 'returned';

export type BookLanguage = 'en' | 'nl' | 'de' | 'fr' | 'es' | 'other';

// ---------------------------------------------------------------------------
// Nested shapes
// ---------------------------------------------------------------------------

/** Minimal owner info nested inside book responses. */
export interface BookOwner {
  id: string;
  username: string;
  avatar: string | null;
  neighborhood: string;
  avg_rating: string;
}

/** A photo attached to a book listing. */
export interface BookPhoto {
  id: string;
  image: string;
  position: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Response shapes (from BE)
// ---------------------------------------------------------------------------

/** Compact book data — returned by `GET /api/v1/books/` list. */
export interface BookListItem {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  condition: BookCondition;
  language: BookLanguage;
  status: BookStatus;
  primary_photo: string | null;
  owner: BookOwner;
  created_at: string;
}

/** Full book detail — returned by `GET /api/v1/books/:id/`. */
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
  notes: string;
  page_count: number | null;
  publish_year: number | null;
  photos: BookPhoto[];
  owner: BookOwner;
  created_at: string;
  updated_at: string;
}

/** Book metadata returned by ISBN lookup / external search. */
export interface BookMetadata {
  isbn: string;
  title: string;
  author: string;
  description: string;
  cover_url: string;
  page_count: number | null;
  publish_year: number | null;
}

/** Paginated response shape for book lists. */
export interface PaginatedBooks {
  count: number;
  next: string | null;
  previous: string | null;
  results: BookListItem[];
}

// ---------------------------------------------------------------------------
// Mutation payloads
// ---------------------------------------------------------------------------

/** Payload for `POST /api/v1/books/`. */
export interface CreateBookPayload {
  isbn?: string;
  title: string;
  author: string;
  description?: string;
  cover_url?: string;
  condition: BookCondition;
  genres?: string[];
  language: BookLanguage;
  notes?: string;
  page_count?: number | null;
  publish_year?: number | null;
}

/** Payload for `PATCH /api/v1/books/:id/`. */
export interface UpdateBookPayload {
  title?: string;
  author?: string;
  description?: string;
  cover_url?: string;
  condition?: BookCondition;
  genres?: string[];
  language?: BookLanguage;
  notes?: string;
  page_count?: number | null;
  publish_year?: number | null;
  status?: BookStatus;
}

/** Payload for `PATCH /api/v1/books/:id/photos/reorder/`. */
export interface ReorderPhotosPayload {
  photo_ids: string[];
}

// ---------------------------------------------------------------------------
// Wishlist types (US-306)
// ---------------------------------------------------------------------------

/** A wishlist item — returned by `GET /api/v1/wishlist/`. */
export interface WishlistItem {
  id: string;
  isbn: string;
  title: string;
  author: string;
  genre: string;
  cover_url: string;
  created_at: string;
}

/** Paginated wishlist response. */
export interface PaginatedWishlist {
  count: number;
  next: string | null;
  previous: string | null;
  results: WishlistItem[];
}

/** Payload for `POST /api/v1/wishlist/`. */
export interface CreateWishlistPayload {
  isbn?: string;
  title?: string;
  author?: string;
  genre?: string;
  cover_url?: string;
}

// ---------------------------------------------------------------------------
// Query filter params
// ---------------------------------------------------------------------------

export interface BookListFilters {
  owner?: string;
  status?: BookStatus;
  genre?: string;
  language?: BookLanguage;
  search?: string;
  ordering?: string;
  page_size?: number;
}
