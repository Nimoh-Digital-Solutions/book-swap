import { MemoryRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { BookListItem, PaginatedBooks, PaginatedWishlist, WishlistItem } from '../types/book.types';
import { MyShelfPage } from '../pages/MyShelfPage';

// ---------------------------------------------------------------------------
// Mock hooks
// ---------------------------------------------------------------------------

const mockUseMyShelf = vi.fn();
const mockUseWishlist = vi.fn();
const mockAddWishlist = { mutate: vi.fn(), isPending: false };
const mockRemoveWishlist = { mutate: vi.fn(), isPending: false };

vi.mock('../hooks/useMyShelf', () => ({
  useMyShelf: () => mockUseMyShelf(),
}));
vi.mock('../hooks/useWishlist', () => ({
  useWishlist: () => mockUseWishlist(),
}));
vi.mock('../hooks/useAddWishlistItem', () => ({
  useAddWishlistItem: () => mockAddWishlist,
}));
vi.mock('../hooks/useRemoveWishlistItem', () => ({
  useRemoveWishlistItem: () => mockRemoveWishlist,
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_BOOK: BookListItem = {
  id: 'book_001',
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  cover_url: 'https://example.com/gatsby.jpg',
  condition: 'good',
  language: 'en',
  status: 'available',
  primary_photo: null,
  owner: { id: 'usr_001', username: 'alice', avatar: null, neighborhood: 'Jordaan', avg_rating: '4.5' },
  created_at: '2025-07-10T10:00:00Z',
};

const MOCK_SHELF: PaginatedBooks = {
  count: 1,
  next: null,
  previous: null,
  results: [MOCK_BOOK],
};

const MOCK_WISHLIST_ITEM: WishlistItem = {
  id: 'wish_001',
  isbn: '9780140449136',
  title: 'Crime and Punishment',
  author: 'Fyodor Dostoevsky',
  genre: 'Fiction',
  cover_url: '',
  created_at: '2025-07-11T08:00:00Z',
};

const MOCK_WISHLIST: PaginatedWishlist = {
  count: 1,
  next: null,
  previous: null,
  results: [MOCK_WISHLIST_ITEM],
};

const EMPTY_PAGINATED: PaginatedBooks = { count: 0, next: null, previous: null, results: [] };
const EMPTY_WISHLIST: PaginatedWishlist = { count: 0, next: null, previous: null, results: [] };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPage() {
  return render(
    <MemoryRouter>
      <MyShelfPage />
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MyShelfPage', () => {
  it('shows loading state', () => {
    mockUseMyShelf.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    mockUseWishlist.mockReturnValue({ data: undefined });
    renderPage();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseMyShelf.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    mockUseWishlist.mockReturnValue({ data: undefined });
    renderPage();
    expect(screen.getByText(/unable to load/i)).toBeInTheDocument();
  });

  it('renders page title and "Add Book" link', () => {
    mockUseMyShelf.mockReturnValue({ data: MOCK_SHELF, isLoading: false, isError: false });
    mockUseWishlist.mockReturnValue({ data: MOCK_WISHLIST });
    renderPage();
    expect(screen.getByText('My Shelf')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /add book/i })).toBeInTheDocument();
  });

  it('renders listing and wishlist tabs', () => {
    mockUseMyShelf.mockReturnValue({ data: MOCK_SHELF, isLoading: false, isError: false });
    mockUseWishlist.mockReturnValue({ data: MOCK_WISHLIST });
    renderPage();
    expect(screen.getByRole('tab', { name: /my listings/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /wishlist/i })).toBeInTheDocument();
  });

  it('displays books in the listings tab', () => {
    mockUseMyShelf.mockReturnValue({ data: MOCK_SHELF, isLoading: false, isError: false });
    mockUseWishlist.mockReturnValue({ data: undefined });
    renderPage();
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
  });

  it('shows empty state when shelf has no books', () => {
    mockUseMyShelf.mockReturnValue({ data: EMPTY_PAGINATED, isLoading: false, isError: false });
    mockUseWishlist.mockReturnValue({ data: undefined });
    renderPage();
    expect(screen.getByText(/your shelf is empty/i)).toBeInTheDocument();
    expect(screen.getByText(/add your first book/i)).toBeInTheDocument();
  });

  it('switches to wishlist tab and shows items', async () => {
    const user = userEvent.setup();
    mockUseMyShelf.mockReturnValue({ data: MOCK_SHELF, isLoading: false, isError: false });
    mockUseWishlist.mockReturnValue({ data: MOCK_WISHLIST });
    renderPage();

    await user.click(screen.getByRole('tab', { name: /wishlist/i }));
    expect(screen.getByText('Crime and Punishment')).toBeInTheDocument();
    expect(screen.getByText('Fyodor Dostoevsky')).toBeInTheDocument();
  });

  it('shows empty wishlist message', async () => {
    const user = userEvent.setup();
    mockUseMyShelf.mockReturnValue({ data: MOCK_SHELF, isLoading: false, isError: false });
    mockUseWishlist.mockReturnValue({ data: EMPTY_WISHLIST });
    renderPage();

    await user.click(screen.getByRole('tab', { name: /wishlist/i }));
    expect(screen.getByText(/your wishlist is empty/i)).toBeInTheDocument();
  });
});
