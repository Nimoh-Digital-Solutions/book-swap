import { MemoryRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BookCard } from '../components/BookCard/BookCard';
import type { BookListItem } from '../types/book.types';

const MOCK_BOOK: BookListItem = {
  id: 'book_001',
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  cover_url: 'https://example.com/gatsby.jpg',
  condition: 'good',
  language: 'en',
  status: 'available',
  primary_photo: null,
  owner: {
    id: 'usr_001',
    username: 'alice',
    avatar: null,
    neighborhood: 'Jordaan',
    avg_rating: '4.5',
  },
  created_at: '2025-07-10T10:00:00Z',
};

function renderCard(overrides: Partial<BookListItem> = {}) {
  return render(
    <MemoryRouter>
      <BookCard book={{ ...MOCK_BOOK, ...overrides }} />
    </MemoryRouter>,
  );
}

describe('BookCard', () => {
  it('renders book title and author', () => {
    renderCard();
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
    expect(screen.getByText(/F\. Scott Fitzgerald/)).toBeInTheDocument();
  });

  it('renders the cover image with alt text', () => {
    renderCard();
    const img = screen.getByAltText('The Great Gatsby');
    expect(img).toHaveAttribute('src', 'https://example.com/gatsby.jpg');
  });

  it('shows a placeholder icon when cover_url is empty', () => {
    renderCard({ cover_url: '' });
    expect(screen.queryByAltText('The Great Gatsby')).not.toBeInTheDocument();
  });

  it('renders the condition badge', () => {
    renderCard();
    // Badge text depends on i18n; it should at least render the badge element
    const badge = screen.getByText(/good|Good/i);
    expect(badge).toBeInTheDocument();
  });

  it('renders a link to the book detail page', () => {
    renderCard();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/books/book_001');
  });

  it('shows status overlay for non-available books', () => {
    renderCard({ status: 'in_exchange' });
    expect(screen.getByText(/in exchange/i)).toBeInTheDocument();
  });

  it('does not show status overlay for available books', () => {
    renderCard({ status: 'available' });
    expect(screen.queryByText(/in exchange/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/returned/i)).not.toBeInTheDocument();
  });

  it('displays owner neighborhood', () => {
    renderCard();
    expect(screen.getByText('Jordaan')).toBeInTheDocument();
  });
});
