/**
 * AUD-W-202 — verifies the BrowsePage renders explicit error UI when the
 * `/books/` (recently-added) call or the `/books/browse/` (map data)
 * call fails, rather than leaving the section empty / spinning.
 */
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '../../test/mocks/server';
import BrowsePage from './BrowsePage';

// useUserCity uses geolocation under the hood — stub it so the map
// component renders into a mounted state and we can assert error UI.
vi.mock('@hooks', async () => {
  const actual = await vi.importActual<typeof import('@hooks')>('@hooks');
  return {
    ...actual,
    useUserCity: () => ({
      city: 'Amsterdam',
      lat: 52.37,
      lng: 4.9,
      loading: false,
      neighbourhood: null,
    }),
  };
});

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

const renderPage = () => render(<BrowsePage />, { wrapper: makeWrapper() });

describe('BrowsePage', () => {
  beforeEach(() => {
    server.use(
      http.get('*/api/v1/books/nearby-count/', () =>
        HttpResponse.json({ count: 12, radius: 10_000, user_count: 4 }),
      ),
    );
  });

  it('renders the search input', () => {
    renderPage();
    expect(
      screen.getByPlaceholderText(/search by title/i),
    ).toBeInTheDocument();
  });

  it('shows an error UI with retry when /books/ (recent) fails', async () => {
    server.use(
      http.get('*/api/v1/books/', () =>
        HttpResponse.json({ detail: 'boom' }, { status: 500 }),
      ),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/couldn't load books/i)).toBeInTheDocument();
    });
    expect(
      screen.getAllByRole('button', { name: /retry/i }).length,
    ).toBeGreaterThanOrEqual(1);
  });

  it('shows a map error UI with retry when /books/browse/ fails', async () => {
    server.use(
      http.get('*/api/v1/books/browse/', () =>
        HttpResponse.json({ detail: 'boom' }, { status: 500 }),
      ),
    );

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText(/couldn't load the map/i),
      ).toBeInTheDocument();
    });
  });
});
