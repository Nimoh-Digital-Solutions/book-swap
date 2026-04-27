import { renderWithProviders } from '@test/renderWithProviders';
import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { server } from '../../test/mocks/server';
import CommunityPage from './CommunityPage';

// useUserCity does IP geolocation in production. We stub it to keep tests
// hermetic and avoid the IP/Nominatim fetches (AUD-W-602 follow-up).
vi.mock('@hooks', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@hooks');
  return {
    ...actual,
    useUserCity: () => ({ city: 'Amsterdam', lat: 52.37, lng: 4.89 }),
  };
});

function renderPage() {
  return renderWithProviders(<CommunityPage />);
}

describe('CommunityPage', () => {
  beforeEach(() => {
    server.use(
      http.get('*/api/v1/books/nearby-count/', () =>
        HttpResponse.json({ count: 128, radius: 10_000, user_count: 47 }),
      ),
      http.get('*/api/v1/books/community-stats/', () =>
        HttpResponse.json({ swaps_this_week: 6, activity_feed: [] }),
      ),
    );
  });

  it('renders the hero headline', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 1, name: /readers/i }),
    ).toBeInTheDocument();
  });

  it('renders the four stat cards', () => {
    renderPage();
    expect(screen.getByText(/books available/i)).toBeInTheDocument();
    expect(screen.getByText(/active swappers/i)).toBeInTheDocument();
    expect(screen.getByText(/swaps this week/i)).toBeInTheDocument();
    expect(screen.getByText(/your city/i)).toBeInTheDocument();
  });

  it('renders the CTA section with the unauthenticated buttons', () => {
    renderPage();
    expect(screen.getByText(/join the community/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /create free account/i }),
    ).toBeInTheDocument();
  });

  it('shows the user city in the stats once data resolves', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText('Amsterdam').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders the community FAQ section heading', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 2, name: /community faq/i }),
    ).toBeInTheDocument();
  });
});
