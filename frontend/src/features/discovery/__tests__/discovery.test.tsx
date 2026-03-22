/**
 * Discovery feature integration tests — Epic 4 Phase 6.
 *
 * Tests cover: BrowseBookCard, RadiusSelector, SearchBar, FilterPanel,
 * FilterChips, BrowseEmptyState, SetLocationPrompt, ViewToggle, and
 * BrowsePage integration with MSW.
 */
import { renderWithProviders } from '@test/renderWithProviders';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BrowseBookCard } from '../components/BrowseBookCard/BrowseBookCard';
import { BrowseEmptyState } from '../components/BrowseEmptyState/BrowseEmptyState';
import { FilterChips } from '../components/FilterChips/FilterChips';
import { FilterPanel } from '../components/FilterPanel/FilterPanel';
import { RadiusSelector } from '../components/RadiusSelector/RadiusSelector';
import { SearchBar } from '../components/SearchBar/SearchBar';
import { SetLocationPrompt } from '../components/SetLocationPrompt/SetLocationPrompt';
import { ViewToggle } from '../components/ViewToggle/ViewToggle';
import type { BrowseBook } from '../types/discovery.types';

// ---------------------------------------------------------------------------
// IntersectionObserver mock (jsdom doesn't provide it)
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
});

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const makeBrowseBook = (overrides: Partial<BrowseBook> = {}): BrowseBook => ({
  id: 'book_001',
  title: 'The Alchemist',
  author: 'Paulo Coelho',
  cover_url: 'https://example.com/alchemist.jpg',
  condition: 'good',
  language: 'en',
  status: 'available',
  primary_photo: null,
  owner: {
    id: 'usr_002',
    username: 'otheruser',
    avatar: null,
    neighborhood: 'De Pijp',
    avg_rating: '4.5',
    location: { latitude: 52.35, longitude: 4.89 },
  },
  distance: 2.3,
  created_at: '2025-08-01T12:00:00Z',
  ...overrides,
});

// ═══════════════════════════════════════════════════════════════════════════
// BrowseBookCard
// ═══════════════════════════════════════════════════════════════════════════

describe('BrowseBookCard', () => {
  it('renders book title and author', () => {
    const book = makeBrowseBook();
    renderWithProviders(<BrowseBookCard book={book} />);
    expect(screen.getByText('The Alchemist')).toBeInTheDocument();
    expect(screen.getByText(/Paulo Coelho/)).toBeInTheDocument();
  });

  it('renders distance badge', () => {
    const book = makeBrowseBook({ distance: 3.5 });
    renderWithProviders(<BrowseBookCard book={book} />);
    expect(screen.getByText(/3\.5/)).toBeInTheDocument();
  });

  it('renders cover image with alt text', () => {
    const book = makeBrowseBook();
    renderWithProviders(<BrowseBookCard book={book} />);
    const img = screen.getByAltText('The Alchemist');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/alchemist.jpg');
  });

  it('shows fallback icon when no cover_url', () => {
    const book = makeBrowseBook({ cover_url: '' });
    renderWithProviders(<BrowseBookCard book={book} />);
    expect(screen.queryByAltText('The Alchemist')).not.toBeInTheDocument();
  });

  it('links to book detail page', () => {
    const book = makeBrowseBook({ id: 'book_123' });
    renderWithProviders(<BrowseBookCard book={book} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/books/book_123');
  });

  it('shows owner neighborhood', () => {
    const book = makeBrowseBook();
    renderWithProviders(<BrowseBookCard book={book} />);
    expect(screen.getByText('De Pijp')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// RadiusSelector
// ═══════════════════════════════════════════════════════════════════════════

describe('RadiusSelector', () => {
  it('renders all 5 radius options', () => {
    renderWithProviders(<RadiusSelector value={5000} onChange={vi.fn()} />);
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5);
  });

  it('marks active radius as checked', () => {
    renderWithProviders(<RadiusSelector value={5000} onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: /^5 km/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /^1 km/ })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with radius value on click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<RadiusSelector value={5000} onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: /10 km/ }));
    expect(onChange).toHaveBeenCalledWith(10000);
  });

  it('shows count when counts are provided', () => {
    const counts = { counts: { '1000': 3, '3000': 7, '5000': 15, '10000': 28, '25000': 50 } };
    renderWithProviders(<RadiusSelector value={5000} onChange={vi.fn()} counts={counts} />);
    expect(screen.getByText('(15)')).toBeInTheDocument();
    expect(screen.getByText('(50)')).toBeInTheDocument();
  });

  it('has radiogroup role with label', () => {
    renderWithProviders(<RadiusSelector value={5000} onChange={vi.fn()} />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SearchBar
// ═══════════════════════════════════════════════════════════════════════════

describe('SearchBar', () => {
  it('renders input with placeholder', () => {
    renderWithProviders(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('shows clear button when input has value', () => {
    renderWithProviders(<SearchBar value="test" onChange={vi.fn()} />);
    expect(screen.getByLabelText(/clear/i)).toBeInTheDocument();
  });

  it('does not show clear button when empty', () => {
    renderWithProviders(<SearchBar value="" onChange={vi.fn()} />);
    expect(screen.queryByLabelText(/clear/i)).not.toBeInTheDocument();
  });

  it('shows min chars hint for 1-2 character input', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SearchBar value="" onChange={vi.fn()} />);

    await user.type(screen.getByRole('searchbox'), 'ab');
    expect(screen.getByText(/at least 3/i)).toBeInTheDocument();
  });

  it('calls onChange after debounce with 3+ chars', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<SearchBar value="" onChange={onChange} />);

    await user.type(screen.getByRole('searchbox'), 'alch');

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith('alch');
    });
  });

  it('does not call onChange for 1-2 character input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<SearchBar value="" onChange={onChange} />);

    await user.type(screen.getByRole('searchbox'), 'ab');

    // Wait longer than debounce (300ms) then assert not called
    await new Promise(resolve => setTimeout(resolve, 400));
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FilterPanel
// ═══════════════════════════════════════════════════════════════════════════

describe('FilterPanel', () => {
  const defaultProps = {
    filters: {},
    onGenreChange: vi.fn(),
    onLanguageChange: vi.fn(),
    onConditionChange: vi.fn(),
    onClearAll: vi.fn(),
  };

  it('renders genre, language, and condition sections', () => {
    renderWithProviders(<FilterPanel {...defaultProps} />);
    expect(screen.getByText(/genre/i)).toBeInTheDocument();
    expect(screen.getByText(/language/i)).toBeInTheDocument();
    expect(screen.getByText(/condition/i)).toBeInTheDocument();
  });

  it('calls onGenreChange when a genre is toggled', async () => {
    const user = userEvent.setup();
    const onGenreChange = vi.fn();
    renderWithProviders(<FilterPanel {...defaultProps} onGenreChange={onGenreChange} />);

    await user.click(screen.getByRole('checkbox', { name: 'Fiction' }));
    expect(onGenreChange).toHaveBeenCalledWith(['Fiction']);
  });

  it('calls onClearAll when clear button is clicked', async () => {
    const user = userEvent.setup();
    const onClearAll = vi.fn();
    renderWithProviders(
      <FilterPanel
        {...defaultProps}
        filters={{ genre: ['Fiction'] }}
        onClearAll={onClearAll}
      />,
    );

    await user.click(screen.getByText(/clear all/i));
    expect(onClearAll).toHaveBeenCalledOnce();
  });

  it('shows selected genres as checked', () => {
    renderWithProviders(
      <FilterPanel
        {...defaultProps}
        filters={{ genre: ['Fiction', 'Fantasy'] }}
      />,
    );
    expect(screen.getByRole('checkbox', { name: 'Fiction' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox', { name: 'Fantasy' })).toHaveAttribute('aria-checked', 'true');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// FilterChips
// ═══════════════════════════════════════════════════════════════════════════

describe('FilterChips', () => {
  it('returns null when no active filters', () => {
    const { container } = renderWithProviders(
      <FilterChips
        filters={{}}
        onRemoveGenre={vi.fn()}
        onRemoveLanguage={vi.fn()}
        onRemoveCondition={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders genre chips when genre filters are active', () => {
    renderWithProviders(
      <FilterChips
        filters={{ genre: ['Fiction', 'Fantasy'] }}
        onRemoveGenre={vi.fn()}
        onRemoveLanguage={vi.fn()}
        onRemoveCondition={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
    expect(screen.getByText('Fiction')).toBeInTheDocument();
    expect(screen.getByText('Fantasy')).toBeInTheDocument();
  });

  it('calls onRemoveGenre when genre chip X is clicked', async () => {
    const user = userEvent.setup();
    const onRemoveGenre = vi.fn();
    renderWithProviders(
      <FilterChips
        filters={{ genre: ['Fiction'] }}
        onRemoveGenre={onRemoveGenre}
        onRemoveLanguage={vi.fn()}
        onRemoveCondition={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );

    await user.click(screen.getByLabelText('Remove Fiction'));
    expect(onRemoveGenre).toHaveBeenCalledWith('Fiction');
  });

  it('shows total count when provided', () => {
    renderWithProviders(
      <FilterChips
        filters={{ genre: ['Fiction'] }}
        totalCount={42}
        onRemoveGenre={vi.fn()}
        onRemoveLanguage={vi.fn()}
        onRemoveCondition={vi.fn()}
        onClearAll={vi.fn()}
      />,
    );
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BrowseEmptyState
// ═══════════════════════════════════════════════════════════════════════════

describe('BrowseEmptyState', () => {
  it('shows generic empty message without search', () => {
    renderWithProviders(<BrowseEmptyState radiusKm={5} />);
    expect(screen.getByText(/no books found/i)).toBeInTheDocument();
  });

  it('shows search-specific message when search is provided', () => {
    renderWithProviders(<BrowseEmptyState search="Alchemist" radiusKm={5} />);
    expect(screen.getByText(/alchemist/i)).toBeInTheDocument();
  });

  it('shows expand radius button when onExpandRadius is provided', () => {
    renderWithProviders(
      <BrowseEmptyState radiusKm={5} onExpandRadius={vi.fn()} />,
    );
    expect(screen.getByText(/expand/i)).toBeInTheDocument();
  });

  it('does not show expand button when onExpandRadius is not provided', () => {
    renderWithProviders(<BrowseEmptyState radiusKm={5} />);
    expect(screen.queryByText(/expand/i)).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SetLocationPrompt
// ═══════════════════════════════════════════════════════════════════════════

describe('SetLocationPrompt', () => {
  it('renders location prompt message', () => {
    renderWithProviders(<SetLocationPrompt />);
    expect(screen.getByText(/set your location/i)).toBeInTheDocument();
  });

  it('has a link to profile/edit or set location', () => {
    renderWithProviders(<SetLocationPrompt />);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ViewToggle
// ═══════════════════════════════════════════════════════════════════════════

describe('ViewToggle', () => {
  it('renders list and map options', () => {
    renderWithProviders(<ViewToggle value="list" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: /list/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /map/i })).toBeInTheDocument();
  });

  it('marks active mode as checked', () => {
    renderWithProviders(<ViewToggle value="list" onChange={vi.fn()} />);
    expect(screen.getByRole('radio', { name: /list/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /map/i })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls onChange with map when map is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<ViewToggle value="list" onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: /map/i }));
    expect(onChange).toHaveBeenCalledWith('map');
  });

  it('calls onChange with list when list is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<ViewToggle value="map" onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: /list/i }));
    expect(onChange).toHaveBeenCalledWith('list');
  });

  it('has radiogroup role', () => {
    renderWithProviders(<ViewToggle value="list" onChange={vi.fn()} />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BrowsePage Integration
// ═══════════════════════════════════════════════════════════════════════════

// We mock useProfile to control location state per test
const mockProfileData = {
  location: { latitude: 52.3676, longitude: 4.9041 },
  preferred_radius: 5000,
};

const mockUseProfile = vi.fn();
vi.mock('@features/profile', () => ({
  useProfile: () => mockUseProfile(),
}));

// Lazy import BrowsePage after mock is set up
const { BrowsePage } = await import('../pages/BrowsePage/BrowsePage');

describe('BrowsePage', () => {
  it('shows SetLocationPrompt when user has no location', async () => {
    mockUseProfile.mockReturnValue({
      data: { ...mockProfileData, location: null },
      isLoading: false,
    });

    renderWithProviders(<BrowsePage />);

    await waitFor(() => {
      expect(screen.getByText(/set your location/i)).toBeInTheDocument();
    });
  });

  it('shows loading spinner while profile loads', () => {
    mockUseProfile.mockReturnValue({ data: undefined, isLoading: true });

    renderWithProviders(<BrowsePage />);
    // Spinner should be present (Loader2 renders an SVG)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders page title when user has location', async () => {
    mockUseProfile.mockReturnValue({
      data: mockProfileData,
      isLoading: false,
    });

    renderWithProviders(<BrowsePage />);

    await waitFor(() => {
      expect(screen.getByText(/browse books/i)).toBeInTheDocument();
    });
  });

  it('renders search bar and radius selector', async () => {
    mockUseProfile.mockReturnValue({
      data: mockProfileData,
      isLoading: false,
    });

    renderWithProviders(<BrowsePage />);

    await waitFor(() => {
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
      expect(screen.getByRole('radiogroup', { name: /distance/i })).toBeInTheDocument();
    });
  });

  it('renders view toggle with list and map options', async () => {
    mockUseProfile.mockReturnValue({
      data: mockProfileData,
      isLoading: false,
    });

    renderWithProviders(<BrowsePage />);

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: /list/i })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: /map/i })).toBeInTheDocument();
    });
  });

  it('renders book cards from API data', async () => {
    mockUseProfile.mockReturnValue({
      data: mockProfileData,
      isLoading: false,
    });

    renderWithProviders(<BrowsePage />);

    await waitFor(() => {
      expect(screen.getByText('The Alchemist')).toBeInTheDocument();
      expect(screen.getByText('1984')).toBeInTheDocument();
    });
  });

  it('renders filter panel on desktop (hidden class applied on mobile)', async () => {
    mockUseProfile.mockReturnValue({
      data: mockProfileData,
      isLoading: false,
    });

    renderWithProviders(<BrowsePage />);

    await waitFor(() => {
      expect(screen.getByText(/genre/i)).toBeInTheDocument();
    });
  });
});
