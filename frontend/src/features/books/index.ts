/**
 * Books feature public API
 *
 * Import from '@features/books' in consuming code — never reach
 * into sub-directories directly from outside this feature.
 *
 * @example
 * import { useBooks, useCreateBook, bookService } from '@features/books';
 */

// Hooks
export { bookKeys, wishlistKeys } from './hooks/bookKeys';
export { useAddWishlistItem } from './hooks/useAddWishlistItem';
export { useBook } from './hooks/useBook';
export { useBooks } from './hooks/useBooks';
export { useCreateBook } from './hooks/useCreateBook';
export { useDeleteBook } from './hooks/useDeleteBook';
export { useDeleteBookPhoto } from './hooks/useDeleteBookPhoto';
export { useExternalBookSearch } from './hooks/useExternalBookSearch';
export { useISBNLookup } from './hooks/useISBNLookup';
export { useMyShelf } from './hooks/useMyShelf';
export { useReorderPhotos } from './hooks/useReorderPhotos';
export { useRemoveWishlistItem } from './hooks/useRemoveWishlistItem';
export { useUpdateBook } from './hooks/useUpdateBook';
export { useUploadBookPhoto } from './hooks/useUploadBookPhoto';
export { useWishlist } from './hooks/useWishlist';

// Schemas
export type {
  CreateBookFormValues,
  UpdateBookFormValues,
  WishlistItemFormValues,
} from './schemas/book.schemas';
export {
  createBookSchema,
  updateBookSchema,
  wishlistItemSchema,
} from './schemas/book.schemas';

// Services
export { bookService } from './services/book.service';
export { isbnService } from './services/isbn.service';
export { wishlistService } from './services/wishlist.service';

// Types
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
  UpdateBookPayload,
  WishlistItem,
} from './types/book.types';
