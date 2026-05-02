/**
 * CataloguePage — reference-styled book catalogue (route `/catalogue`).
 *
 * Layout: hero header + left filter sidebar + paginated 3-col book grid.
 * Desktop: sticky sidebar with dark card filters.
 * Mobile: "Filters" button opens the MobileFilterSheet.
 * No location → seed books are always shown; no location gate.
 *
 * Note: distinct from `pages/BrowseLandingPage` which is the marketing
 * landing page mounted at `/browse`. Renamed under AUD-W-405 to remove
 * the duplicate `BrowsePage` ambiguity.
 */
import { type ReactElement, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BrandedLoader, EmptyPlaceholder } from '@components/common';
import { useAuth } from '@features/auth';
import { useProfile } from '@features/profile';
import { useCurrentLocation, useLocationMismatch, useUserCity } from '@hooks';
import { AlertTriangle } from 'lucide-react';

import { BrowseBookCard } from '../../components/BrowseBookCard';
import { BrowseEmptyState } from '../../components/BrowseEmptyState';
import { CurrentLocationToggle } from '../../components/CurrentLocationToggle';
import { FilterPanel } from '../../components/FilterPanel';
import { LocationMismatchBanner } from '../../components/LocationMismatchBanner';
import { MobileFilterSheet } from '../../components/MobileFilterSheet';
import { SearchBar } from '../../components/SearchBar';
import { SetLocationPrompt } from '../../components/SetLocationPrompt/SetLocationPrompt';
import { SwapFlowModal } from '../../components/SwapFlowModal';
import { useBrowseBooks } from '../../hooks/useBrowseBooks';
import { useBrowseFilters } from '../../hooks/useBrowseFilters';
import type { BrowseBook } from '../../types/discovery.types';

const DEFAULT_RADIUS = 5000;
const PAGE_SIZE = 12;

// ---------------------------------------------------------------------------
// Pagination helpers
// ---------------------------------------------------------------------------

function buildPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  if (total > 1) pages.push(total);
  return pages;
}

export function CataloguePage(): ReactElement {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile(isAuthenticated);
  const { filters, setFilters, clearFilters } = useBrowseFilters();
  const { city: detectedCity, lat: gpsLat, lng: gpsLng } = useUserCity();
  const currentLocation = useCurrentLocation();

  const mismatch = useLocationMismatch(
    gpsLat,
    gpsLng,
    detectedCity,
    profile?.location,
    profile?.neighborhood,
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BrowseBook | null>(null);

  const hasExplicitRadius = filters.radius != null;
  const baseRadius = filters.radius ?? profile?.preferred_radius ?? DEFAULT_RADIUS;
  const activeRadius = filters.search && !hasExplicitRadius ? 50_000 : baseRadius;

  // Build location params:
  // 1. If the "use my current location" toggle is active → send GPS coords.
  // 2. For unauthenticated users → send detected city coords.
  // 3. Otherwise → omit (backend uses profile location).
  const locationParams =
    currentLocation.active && currentLocation.lat != null && currentLocation.lng != null
      ? { lat: currentLocation.lat, lng: currentLocation.lng }
      : !isAuthenticated && gpsLat != null && gpsLng != null
        ? { lat: gpsLat, lng: gpsLng }
        : {};

  const { data, isLoading, isError } = useBrowseBooks(
    { ...filters, ...locationParams, radius: activeRadius, page: currentPage, page_size: PAGE_SIZE },
  );

  const books = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 0;
  const pageNumbers = buildPageNumbers(currentPage, totalPages);

  // ---------------------------------------------------------------------------
  // Filter handlers — all reset to page 1
  // ---------------------------------------------------------------------------

  const handleFilterChange = useCallback(
    (partial: Parameters<typeof setFilters>[0]) => {
      setFilters(partial);
      setCurrentPage(1);
    },
    [setFilters],
  );

  const handleSearchChange = useCallback(
    (search: string) => handleFilterChange({ search: search || undefined }),
    [handleFilterChange],
  );

  const handleRadiusChange = useCallback(
    (radius: number) => handleFilterChange({ radius }),
    [handleFilterChange],
  );

  const handleGenreChange = useCallback(
    (genre: string[]) => handleFilterChange({ genre: genre.length ? genre : undefined }),
    [handleFilterChange],
  );

  const handleLanguageChange = useCallback(
    (language: string[]) =>
      handleFilterChange({ language: language.length ? language : undefined }),
    [handleFilterChange],
  );

  const handleConditionChange = useCallback(
    (condition: string[]) =>
      handleFilterChange({ condition: condition.length ? condition : undefined }),
    [handleFilterChange],
  );

  const handleClearAll = useCallback(() => {
    clearFilters();
    setCurrentPage(1);
  }, [clearFilters]);

  const hasActiveFilters = Boolean(
    filters.search ||
    (filters.genre && filters.genre.length > 0) ||
    (filters.language && filters.language.length > 0) ||
    (filters.condition && filters.condition.length > 0),
  );

  // ---------------------------------------------------------------------------
  // Profile loading
  // ---------------------------------------------------------------------------

  if (isAuthenticated && profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <BrandedLoader size="lg" label={t('common.loading', 'Loading…')} fillParent={false} />
      </div>
    );
  }

  // Gate: authenticated user has no location set — show prompt instead of empty grid
  if (isAuthenticated && profile && !profile.location) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <SetLocationPrompt />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main layout
  // ---------------------------------------------------------------------------

  const filterPanelProps = {
    filters,
    radius: activeRadius,
    onRadiusChange: handleRadiusChange,
    onGenreChange: handleGenreChange,
    onLanguageChange: handleLanguageChange,
    onConditionChange: handleConditionChange,
    onClearAll: handleClearAll,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ── Hero ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-3">
            {t('discovery.heroTitle', 'Find your next story')}
          </h1>
          <p className="text-[#E4B643] text-lg">
            {t('discovery.heroSubtitle', 'Browse books available for swap near you.')}
          </p>
        </div>

        {/* Search */}
        <div className="w-full md:w-96">
          <SearchBar
            value={filters.search ?? ''}
            onChange={handleSearchChange}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Location mismatch banner */}
      {isAuthenticated && mismatch.showMismatch && mismatch.detectedCity && mismatch.profileNeighborhood && (
        <LocationMismatchBanner
          detectedCity={mismatch.detectedCity}
          profileNeighborhood={mismatch.profileNeighborhood}
          distanceKm={mismatch.distanceKm ?? 0}
          onDismiss={mismatch.dismiss}
        />
      )}

      {/* Current location toggle (authenticated users only) */}
      {isAuthenticated && profile?.location && (
        <div className="mb-6">
          <CurrentLocationToggle
            active={currentLocation.active}
            detecting={currentLocation.detecting}
            error={currentLocation.error}
            onToggle={currentLocation.toggle}
          />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* ── Sidebar (desktop) ── */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-24">
            <FilterPanel
              {...filterPanelProps}
              onApplyFilters={() => undefined}
            />
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter + result count row */}
          <div className="flex items-center justify-between mb-6 text-sm">
            <span className="text-gray-300">
              {isLoading ? (
                <span className="text-gray-500">{t('discovery.loading', 'Loading…')}</span>
              ) : !isError ? (
                <>
                  {t('discovery.showing', 'Showing')}{' '}
                  <strong className="text-white">{totalCount}</strong>{' '}
                  {t('discovery.booksNearby', 'books near you')}
                </>
              ) : null}
            </span>

            {/* Mobile filter trigger */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden inline-flex items-center gap-1.5 px-4 py-2 bg-surface-dark border border-white/10 rounded-full text-xs font-medium text-gray-300 hover:text-white transition-colors"
              aria-label={t('discovery.filters.title', 'Filters')}
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">
                tune
              </span>
              {t('discovery.filters.title', 'Filters')}
            </button>
          </div>

          {/* Error state */}
          {isError && (
            <EmptyPlaceholder
              icon={AlertTriangle}
              title={t('error.somethingWentWrong', 'Something went wrong')}
              description={t(
                'error.somethingWentWrongHint',
                'We could not load books right now. Please try again.',
              )}
            />
          )}

          {/* Empty state */}
          {!isLoading && !isError && books.length === 0 && (
            <BrowseEmptyState
              search={filters.search}
              radiusKm={activeRadius / 1000}
              hasFilters={hasActiveFilters}
              onClearFilters={hasActiveFilters ? handleClearAll : undefined}
            />
          )}

          {/* Loading skeleton */}
          {isLoading && books.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div
                  key={i}
                  className="bg-surface-dark rounded-2xl border border-white/5 overflow-hidden animate-pulse"
                >
                  <div className="aspect-[3/4] bg-white/5" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-white/5 rounded w-3/4" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                    <div className="h-8 bg-white/5 rounded-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Book grid */}
          {books.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {books.map(book => (
                <BrowseBookCard
                  key={book.id}
                  book={book}
                  onRequestSwap={setSelectedBook}
                />
              ))}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <nav
              className="flex items-center justify-center gap-2 mt-12"
              aria-label={t('discovery.pagination', 'Pagination')}
            >
              {/* Previous */}
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label={t('discovery.previousPage', 'Previous page')}
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">
                  chevron_left
                </span>
              </button>

              {/* Page numbers */}
              {pageNumbers.map((pg, idx) =>
                pg === '...' ? (
                  <span key={`ellipsis-${idx}`} className="text-gray-500 px-1">
                    …
                  </span>
                ) : (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg as number)}
                    aria-current={currentPage === pg ? 'page' : undefined}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                      currentPage === pg
                        ? 'bg-[#E4B643] text-[#152018] font-bold'
                        : 'border border-white/10 text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {pg}
                  </button>
                ),
              )}

              {/* Next */}
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label={t('discovery.nextPage', 'Next page')}
              >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">
                  chevron_right
                </span>
              </button>
            </nav>
          )}
        </div>
      </div>

      {/* ── Mobile filter sheet ── */}
      <MobileFilterSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
      >
        <FilterPanel
          {...filterPanelProps}
          onApplyFilters={() => setMobileFiltersOpen(false)}
        />
      </MobileFilterSheet>

      {/* ── Swap flow modal ── */}
      <SwapFlowModal
        isOpen={!!selectedBook}
        onClose={() => setSelectedBook(null)}
        requestedBook={selectedBook}
      />
    </div>
  );
}
