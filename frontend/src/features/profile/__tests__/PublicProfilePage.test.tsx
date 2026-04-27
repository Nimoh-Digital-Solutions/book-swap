import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '../../../test/mocks/server';
import { PublicProfilePage } from '../pages/PublicProfilePage';
import type { UserPublicProfile } from '../types/profile.types';

const MOCK_PUBLIC_PROFILE: UserPublicProfile = {
  id: 'user-uuid-123',
  username: 'bookworm',
  first_name: 'Bookworm',
  bio: 'Loves mysteries and thrillers.',
  avatar: null,
  location: { latitude: 52.37, longitude: 4.89 },
  neighborhood: 'Jordaan',
  preferred_genres: ['Mystery/Thriller', 'Sci-Fi'],
  preferred_language: 'en',
  avg_rating: '4.5',
  swap_count: 10,
  rating_count: 5,
  member_since: '2025-06-01T10:00:00Z',
};

function createWrapper(userId: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/profile/${userId}`]}>
          <Routes>
            <Route path="/profile/:id" element={children} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('PublicProfilePage', () => {
  it('displays profile data when loaded', async () => {
    server.use(
      http.get('*/api/v1/users/:id/', () =>
        HttpResponse.json(MOCK_PUBLIC_PROFILE),
      ),
    );

    render(<PublicProfilePage />, {
      wrapper: createWrapper('user-uuid-123'),
    });

    expect(await screen.findByText('Bookworm')).toBeInTheDocument();
    expect(screen.getByText('@bookworm')).toBeInTheDocument();
    expect(screen.getByText('Loves mysteries and thrillers.')).toBeInTheDocument();
    expect(screen.getByText('Jordaan')).toBeInTheDocument();
    expect(screen.getByText('Mystery/Thriller')).toBeInTheDocument();
    expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
  });

  it('shows rating when rating_count >= 3', async () => {
    server.use(
      http.get('*/api/v1/users/:id/', () =>
        HttpResponse.json(MOCK_PUBLIC_PROFILE),
      ),
    );

    render(<PublicProfilePage />, {
      wrapper: createWrapper('user-uuid-123'),
    });

    expect(await screen.findByText('4.5')).toBeInTheDocument();
    expect(screen.getByText(/Rating \(5\)/)).toBeInTheDocument();
  });

  it('shows NewMemberBadge when rating_count < 3', async () => {
    server.use(
      http.get('*/api/v1/users/:id/', () =>
        HttpResponse.json({
          ...MOCK_PUBLIC_PROFILE,
          rating_count: 1,
          avg_rating: null,
          swap_count: 0,
        }),
      ),
    );

    render(<PublicProfilePage />, {
      wrapper: createWrapper('user-uuid-123'),
    });

    expect(await screen.findByText(/new member/i)).toBeInTheDocument();
  });

  it('shows deactivated user message on 404', async () => {
    server.use(
      http.get('*/api/v1/users/:id/', () =>
        HttpResponse.json(
          { detail: 'Not found.' },
          { status: 404 },
        ),
      ),
    );

    render(<PublicProfilePage />, {
      wrapper: createWrapper('deleted-user-id'),
    });

    expect(await screen.findByText(/no longer active/i)).toBeInTheDocument();
  });

  it('displays swap count', async () => {
    server.use(
      http.get('*/api/v1/users/:id/', () =>
        HttpResponse.json(MOCK_PUBLIC_PROFILE),
      ),
    );

    render(<PublicProfilePage />, {
      wrapper: createWrapper('user-uuid-123'),
    });

    expect(await screen.findByText('10')).toBeInTheDocument();
    expect(screen.getByText(/swaps/i)).toBeInTheDocument();
  });
});
