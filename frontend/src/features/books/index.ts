/**
 * Books feature public API
 *
 * Import from '@features/books' in consuming code — never reach
 * into sub-directories directly from outside this feature.
 *
 * @example
 * import { useBooks, useCreateBook, bookService } from '@features/books';
 */

// Components
export { BookCard } from './components/BookCard/BookCard';
export { BookForm } from './components/BookForm/BookForm';
export { BookGenrePicker } from './components/BookGenrePicker/BookGenrePicker';
export { ConditionBadge } from './components/ConditionBadge/ConditionBadge';
export { PhotoUploader } from './components/PhotoUploader/PhotoUploader';
export { WishlistForm } from './components/WishlistForm/WishlistForm';

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
export { useRemoveWishlistItem } from './hooks/useRemoveWishlistItem';
export { useReorderPhotos } from './hooks/useReorderPhotos';
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

// Pages
export { AddBookPage } from './pages/AddBookPage';
export { BookDetailPage } from './pages/BookDetailPage';
export { EditBookPage } from './pages/EditBookPage';
export { MyShelfPage } from './pages/MyShelfPage';

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
