import { Route, Routes } from 'react-router-dom';

import { renderWithProviders } from '@test/renderWithProviders';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EditBookPage } from '../pages/EditBookPage';
import type { Book } from '../types/book.types';

// ---------------------------------------------------------------------------
// Hook mocks — EditBookPage stitches a lot of mutations together; keeping
// them stubbed lets us focus on the page composition (AUD-W-602).
// ---------------------------------------------------------------------------

const mockUseBook = vi.fn();
const mockUpdateBook = { mutate: vi.fn(), isPending: false };
const mockDeleteBook = { mutate: vi.fn(), isPending: false };
const mockUploadPhoto = { mutate: vi.fn(), isPending: false };
const mockDeletePhoto = { mutate: vi.fn(), isPending: false };

vi.mock('../hooks/useBook', () => ({
  useBook: (...args: unknown[]) => mockUseBook(...args),
}));
vi.mock('../hooks/useUpdateBook', () => ({
  useUpdateBook: () => mockUpdateBook,
}));
vi.mock('../hooks/useDeleteBook', () => ({
  useDeleteBook: () => mockDeleteBook,
}));
vi.mock('../hooks/useUploadBookPhoto', () => ({
  useUploadBookPhoto: () => mockUploadPhoto,
}));
vi.mock('../hooks/useDeleteBookPhoto', () => ({
  useDeleteBookPhoto: () => mockDeletePhoto,
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
  swap_type: 'temporary',
  notes: '',
  page_count: 180,
  publish_year: 1925,
  photos: [],
  owner: {
    id: 'usr_owner',
    username: 'bookworm',
    avatar: null,
    neighborhood: 'De Pijp',
    avg_rating: '4.2',
  },
  created_at: '2025-07-10T10:00:00Z',
  updated_at: '2025-07-10T10:00:00Z',
};

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/:lng/books/:id/edit" element={<EditBookPage />} />
    </Routes>,
    { routerProps: { initialEntries: ['/en/books/book_001/edit'] } },
  );
}

beforeEach(() => {
  mockUpdateBook.mutate.mockReset();
  mockDeleteBook.mutate.mockReset();
  mockUseBook.mockReturnValue({
    data: MOCK_BOOK,
    isLoading: false,
    isError: false,
  });
});

describe('EditBookPage', () => {
  it('shows the loading state while the book is fetching', () => {
    mockUseBook.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });
    renderPage();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows the not-found state when the book fails to load', () => {
    mockUseBook.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    renderPage();
    expect(screen.getByText(/book not found/i)).toBeInTheDocument();
  });

  it('renders the edit form with the loaded book values', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 1, name: /edit book/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('The Great Gatsby'),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('F. Scott Fitzgerald'),
    ).toBeInTheDocument();
  });

  it('renders the photos section header', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 2, name: /photos/i }),
    ).toBeInTheDocument();
  });

  it('reveals the destructive confirm flow only after clicking Delete Book', async () => {
    const user = userEvent.setup();
    renderPage();

    const deleteButtons = screen.getAllByRole('button', {
      name: /delete book/i,
    });
    expect(deleteButtons.length).toBeGreaterThan(0);
    const lastDelete = deleteButtons[deleteButtons.length - 1];
    if (!lastDelete) throw new Error('expected at least one delete button');

    await user.click(lastDelete);

    expect(
      screen.getByRole('button', { name: /confirm/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /cancel/i }),
    ).toBeInTheDocument();
  });

  it('calls deleteBook.mutate when the destructive flow is confirmed', async () => {
    const user = userEvent.setup();
    renderPage();

    const deleteButtons = screen.getAllByRole('button', {
      name: /delete book/i,
    });
    const lastDelete = deleteButtons[deleteButtons.length - 1];
    if (!lastDelete) throw new Error('expected at least one delete button');
    await user.click(lastDelete);
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    expect(mockDeleteBook.mutate).toHaveBeenCalledTimes(1);
    expect(mockDeleteBook.mutate.mock.calls[0]?.[0]).toBe('book_001');
  });
});
