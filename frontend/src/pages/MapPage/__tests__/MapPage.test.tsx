/**
 * MapPage tests (AUD-W-602)
 *
 * Verifies the page-level branching of the Google-Maps based discovery view:
 *   - missing API key fallback
 *   - missing user-location fallback
 *   - happy-path render of header / SidePanel / map markers
 *
 * The Google Maps SDK and the SidePanel are mocked so tests stay fast and
 * deterministic — we are exercising the orchestrator's logic, not the map
 * library itself.
 */
import { Route, Routes } from 'react-router-dom';

import type { BrowseBook } from '@features/discovery/types/discovery.types';
import { renderWithProviders } from '@test/renderWithProviders';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUseMapBooks = vi.fn();
const mockUseRadiusCounts = vi.fn();
const mockUseUserCity = vi.fn();

vi.mock('@features/discovery', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@features/discovery');
  return {
    ...actual,
    useMapBooks: (...args: unknown[]) => mockUseMapBooks(...args),
    useRadiusCounts: (...args: unknown[]) => mockUseRadiusCounts(...args),
  };
});

vi.mock('@hooks', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@hooks');
  return {
    ...actual,
    useUserCity: () => mockUseUserCity(),
  };
});

// Mock the Google Maps SDK so jsdom never tries to load real map tiles.
vi.mock('@vis.gl/react-google-maps', () => ({
  APIProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-api-provider">{children}</div>
  ),
  Map: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="google-map">{children}</div>
  ),
  Marker: () => <div data-testid="map-marker" />,
  Circle: () => <div data-testid="map-circle" />,
  useApiIsLoaded: () => true,
  // MarkerClusterProvider calls useMap to grab the active map instance.
  useMap: () => null,
}));

// MarkerClusterer attaches to a real google.maps.Map; with useMap returning null
// the provider just renders its children, so we don't need to stub the lib.
vi.mock('@googlemaps/markerclusterer', () => ({
  MarkerClusterer: class {
    addMarkers() {}
    removeMarker() {}
    clearMarkers() {}
    setMap() {}
  },
}));

// Mock BookMarker to keep marker rendering trivial.
vi.mock('../BookMarker', () => ({
  BookMarker: ({ locationKey }: { locationKey: string }) => (
    <div data-testid={`book-marker-${locationKey}`} />
  ),
}));

// Mock SidePanel — it has its own dedicated tests; here we only need to verify
// MapPage passes the right data.
vi.mock('../SidePanel', () => ({
  SidePanel: (props: {
    books: BrowseBook[];
    isLoading: boolean;
    isOpen: boolean;
  }) => (
    <aside data-testid="side-panel" data-loading={String(props.isLoading)} data-open={String(props.isOpen)}>
      <span data-testid="side-panel-count">{props.books.length}</span>
    </aside>
  ),
}));

// Mock the Google Maps API key constant used by MapPage so we can flip it
// per-test.
const mockMapConstants = vi.hoisted(() => ({
  apiKey: 'test-google-maps-key',
}));

vi.mock('../map.constants', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('../map.constants');
  return {
    ...actual,
    get GOOGLE_MAPS_API_KEY() {
      return mockMapConstants.apiKey;
    },
  };
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_BOOK: BrowseBook = {
  id: 'book_001',
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  cover_url: 'https://example.com/gatsby.jpg',
  condition: 'good',
  language: 'en',
  status: 'available',
  primary_photo: null,
  owner: {
    id: 'usr_other',
    username: 'bookworm',
    avatar: null,
    neighborhood: 'Jordaan',
    avg_rating: '4.5',
    location: { latitude: 52.37, longitude: 4.9 },
  },
  distance: 1.2,
  created_at: '2025-08-01T12:00:00Z',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function renderMapPage() {
  // Lazy import so each test re-evaluates the mocked module bindings.
  const { default: MapPage } = await import('../MapPage');
  return renderWithProviders(
    <Routes>
      <Route path="/:lng/map" element={<MapPage />} />
    </Routes>,
    { routerProps: { initialEntries: ['/en/map'] } },
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MapPage', () => {
  beforeEach(() => {
    mockMapConstants.apiKey = 'test-google-maps-key';
    mockUseMapBooks.mockReturnValue({ data: { results: [MOCK_BOOK] }, isLoading: false });
    mockUseRadiusCounts.mockReturnValue({ data: { counts: { '5000': 5 } } });
    mockUseUserCity.mockReturnValue({
      city: 'Amsterdam',
      lat: 52.37,
      lng: 4.9,
      isLoading: false,
    });
  });

  it('renders the API-key fallback when no Google Maps key is configured', async () => {
    mockMapConstants.apiKey = '';
    await renderMapPage();
    expect(screen.getByText(/map unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to browse/i })).toBeInTheDocument();
  });

  it('renders the location-needed fallback when the user has no location', async () => {
    mockUseUserCity.mockReturnValue({
      city: null,
      lat: null,
      lng: null,
      isLoading: false,
    });
    await renderMapPage();
    expect(screen.getByText(/location needed/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to settings/i })).toBeInTheDocument();
  });

  it('renders the city name and book count in the top bar', async () => {
    await renderMapPage();
    expect(screen.getByText('Amsterdam')).toBeInTheDocument();
    expect(screen.getByText(/1\s+books/i)).toBeInTheDocument();
  });

  it('renders the map and a book marker for the available book', async () => {
    await renderMapPage();
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
    expect(screen.getByTestId('book-marker-52.37,4.9')).toBeInTheDocument();
  });

  it('passes the book list and loading state to SidePanel', async () => {
    mockUseMapBooks.mockReturnValue({ data: { results: [MOCK_BOOK] }, isLoading: true });
    await renderMapPage();
    const panel = screen.getByTestId('side-panel');
    expect(panel).toHaveAttribute('data-loading', 'true');
    expect(panel).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('side-panel-count')).toHaveTextContent('1');
  });

  it('groups multiple books at the same location under a single marker', async () => {
    const second: BrowseBook = { ...MOCK_BOOK, id: 'book_002', title: '1984' };
    const third: BrowseBook = {
      ...MOCK_BOOK,
      id: 'book_003',
      title: 'Dune',
      owner: {
        ...MOCK_BOOK.owner,
        id: 'usr_other_2',
        location: { latitude: 52.40, longitude: 4.95 },
      },
    };
    mockUseMapBooks.mockReturnValue({
      data: { results: [MOCK_BOOK, second, third] },
      isLoading: false,
    });

    await renderMapPage();

    expect(screen.getByTestId('book-marker-52.37,4.9')).toBeInTheDocument();
    expect(screen.getByTestId('book-marker-52.4,4.95')).toBeInTheDocument();
  });
});
