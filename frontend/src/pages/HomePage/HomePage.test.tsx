import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { server } from '../../test/mocks/server';

import HomePage from './HomePage';

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }
  return Wrapper;
}

const renderPage = () =>
  render(<HomePage />, { wrapper: makeWrapper() });

describe('HomePage', () => {
  beforeEach(() => {
    // HomePage calls nearby-count + community-stats when useUserCity returns coordinates;
    // default MSW responses omit fields the page reads (user_count, swaps_this_week).
    server.use(
      http.get('*/api/v1/books/nearby-count/', () =>
        HttpResponse.json({
          count: 42,
          radius: 10_000,
          user_count: 12,
        }),
      ),
      http.get('*/api/v1/books/community-stats/', () =>
        HttpResponse.json({
          swaps_this_week: 3,
          activity_feed: [],
        }),
      ),
    );
  });

  it('renders the hero headline', () => {
    renderPage();
    expect(screen.getByText(/find your next/i)).toBeInTheDocument();
    expect(screen.getByText(/great adventure/i)).toBeInTheDocument();
  });

  it('renders the search bar with placeholder', () => {
    renderPage();
    expect(
      screen.getByPlaceholderText(/search by title/i),
    ).toBeInTheDocument();
  });

  it('renders popular tags', () => {
    renderPage();
    expect(screen.getAllByText('Sci-Fi').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Dutch Literature')).toBeInTheDocument();
  });

  it('renders book cards', async () => {
    renderPage();
    // MSW list handler returns TEST_BOOK_LIST_ITEM ("The Great Gatsby"); cards load after useBooks resolves
    await waitFor(() => {
      expect(screen.getAllByText('The Great Gatsby').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders "How It Works" section with steps', () => {
    renderPage();
    expect(screen.getByText('List Your Books')).toBeInTheDocument();
    expect(screen.getByText('Find & Request')).toBeInTheDocument();
    expect(screen.getByText('Swap Locally')).toBeInTheDocument();
  });

  it('renders CTA section with Create Free Account link', () => {
    renderPage();
    expect(screen.getByText(/create free account/i)).toBeInTheDocument();
  });
});
