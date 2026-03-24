import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../../auth/stores/authStore';
import { BookDetailPage } from '../pages/BookDetailPage';
import type { Book } from '../types/book.types';

// ---------------------------------------------------------------------------
// Mock hooks
// ---------------------------------------------------------------------------

const mockUseBook = vi.fn();

vi.mock('../hooks/useBook', () => ({
  useBook: (...args: unknown[]) => mockUseBook(...args),
}));

vi.mock('@features/exchanges/components/RequestSwapButton/RequestSwapButton', () => ({
  RequestSwapButton: ({ bookId }: { bookId: string }) => (
    <button data-testid="request-swap-btn" data-book-id={bookId}>Request Swap</button>
  ),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_BOOK: Book = {
  id: 'book_001',
  isbn: '9780743273565',
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  description: 'A novel about the American Dream.',
  cover_url: 'https://example.com/gatsby.jpg',
  condition: 'good',
  genres: ['Fiction'],
  language: 'en',
  status: 'available',
  notes: 'No highlights or marks.',
  page_count: 180,
  publish_year: 1925,
  photos: [
    { id: 'p1', image: 'https://example.com/photo1.jpg', position: 0, created_at: '2025-07-10T10:00:00Z' },
  ],
  owner: { id: 'usr_other', username: 'bookworm', avatar: null, neighborhood: 'De Pijp', avg_rating: '4.2' },
  created_at: '2025-07-10T10:00:00Z',
  updated_at: '2025-07-10T10:00:00Z',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPage(bookId = 'book_001') {
  return render(
    <MemoryRouter initialEntries={[`/books/${bookId}`]}>
      <Routes>
        <Route path="/books/:id" element={<BookDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BookDetailPage', () => {
  it('shows loading state', () => {
    mockUseBook.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderPage();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error / not found state', () => {
    mockUseBook.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderPage();
    expect(screen.getByText(/book not found/i)).toBeInTheDocument();
  });

  it('renders the book title and author', () => {
    mockUseBook.mockReturnValue({ data: MOCK_BOOK, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
    expect(screen.getByText(/F\. Scott Fitzgerald/)).toBeInTheDocument();
  });

  it('renders the condition badge', () => {
    mockUseBook.mockReturnValue({ data: MOCK_BOOK, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText(/good|Good/i)).toBeInTheDocument();
  });

  it('renders book description', () => {
    mockUseBook.mockReturnValue({ data: MOCK_BOOK, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText('A novel about the American Dream.')).toBeInTheDocument();
  });

  it('renders swap notes', () => {
    mockUseBook.mockReturnValue({ data: MOCK_BOOK, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText('No highlights or marks.')).toBeInTheDocument();
  });

  it('renders genres', () => {
    mockUseBook.mockReturnValue({ data: MOCK_BOOK, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText('Fiction')).toBeInTheDocument();
  });

  it('renders ISBN', () => {
    mockUseBook.mockReturnValue({ data: MOCK_BOOK, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText('9780743273565')).toBeInTheDocument();
  });

  it('renders page count and publish year', () => {
    mockUseBook.mockReturnValue({ data: MOCK_BOOK, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText('180')).toBeInTheDocument();
    expect(screen.getByText('1925')).toBeInTheDocument();
  });

  it('renders the owner card when viewer is not the owner', () => {
    useAuthStore.setState({ user: { id: 'usr_viewer', email: 'v@e.com', first_name: 'V', last_name: 'V' } });
    mockUseBook.mockReturnValue({ data: MOCK_BOOK, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText('bookworm')).toBeInTheDocument();
    expect(screen.getByText('De Pijp')).toBeInTheDocument();
  });

  it('shows "Request Swap" button for non-owners', () => {
    useAuthStore.setState({ user: { id: 'usr_viewer', email: 'v@e.com', first_name: 'V', last_name: 'V' } });
    mockUseBook.mockReturnValue({ data: MOCK_BOOK, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByRole('button', { name: /request swap/i })).toBeInTheDocument();
  });

  it('shows "Edit Listing" link for the owner', () => {
    useAuthStore.setState({ user: { id: 'usr_other', email: 'o@e.com', first_name: 'O', last_name: 'O' } });
    mockUseBook.mockReturnValue({ data: MOCK_BOOK, isLoading: false, isError: false });
    renderPage();
    expect(screen.getByText(/edit listing/i)).toBeInTheDocument();
  });

  it('renders the main photo', () => {
    mockUseBook.mockReturnValue({ data: MOCK_BOOK, isLoading: false, isError: false });
    renderPage();
    const img = screen.getByAltText('The Great Gatsby');
    expect(img).toHaveAttribute('src', 'https://example.com/photo1.jpg');
  });
});
