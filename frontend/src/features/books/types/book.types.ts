/**
 * book.types.ts
 *
 * Re-exports from `@shared` — see `packages/shared/src/types/book.ts`
 * for the canonical contracts (the BookSwap source of truth shared with the
 * mobile app).
 */

export type {
  Book,
  BookCondition,
  BookLanguage,
  BookListFilters,
  BookListItem,
  BookMetadata,
  BookOwner,
  BookPhoto,
  BookStatus,
  CreateBookPayload,
  CreateWishlistPayload,
  PaginatedBooks,
  PaginatedWishlist,
  ReorderPhotosPayload,
  SwapType,
  UpdateBookPayload,
  WishlistItem,
} from '@shared/types/book';
