/**
 * BrowsePage — main discovery page.
 *
 * Authenticated users see nearby books with infinite scroll.
 * Desktop: FilterPanel sidebar + book grid.
 * Mobile: "Filters" button opens bottom sheet.
 * If the user hasn't set a location, shows SetLocationPrompt.
 */
import { type ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@features/profile';
import { Loader2, SlidersHorizontal } from 'lucide-react';

import { BrowseBookCard } from '../../components/BrowseBookCard';
import { BrowseEmptyState } from '../../components/BrowseEmptyState';
import { FilterChips } from '../../components/FilterChips';
import { FilterPanel } from '../../components/FilterPanel';
import { MobileFilterSheet } from '../../components/MobileFilterSheet';
import { RadiusSelector } from '../../components/RadiusSelector';
import { SearchBar } from '../../components/SearchBar';
import { SetLocationPrompt } from '../../components/SetLocationPrompt';
import { useBrowseBooks } from '../../hooks/useBrowseBooks';
import { useBrowseFilters } from '../../hooks/useBrowseFilters';
import { useRadiusCounts } from '../../hooks/useRadiusCounts';

const DEFAULT_RADIUS = 5000;
const EXPAND_RADIUS = 10000;

export function BrowsePage(): ReactElement {
  const { t } = useTranslation();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { filters, setFilters, clearFilters } = useBrowseFilters();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Default radius from user profile, fallback to 5 km
  const activeRadius = filters.radius ?? profile?.preferred_radius ?? DEFAULT_RADIUS;

  const hasLocation = profile?.location != null;

  const { data: radiusCounts } = useRadiusCounts(hasLocation);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useBrowseBooks(
    { ...filters, radius: activeRadius },
    hasLocation,
  );

  // Flatten paginated results
  const books = data?.pages.flatMap(page => page.results) ?? [];
  const totalCount = data?.pages[0]?.count;

  // --- Infinite scroll sentinel ----
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // --- Filter handlers ---
  const handleSearchChange = useCallback(
    (search: string) => setFilters({ search: search || undefined }),
    [setFilters],
  );

  const handleRadiusChange = useCallback(
    (radius: number) => setFilters({ radius }),
    [setFilters],
  );

  const handleExpandRadius = useCallback(() => {
    setFilters({ radius: EXPAND_RADIUS });
  }, [setFilters]);

  const removeFromArray = (arr: string[] | undefined, item: string) =>
    arr?.filter(v => v !== item) ?? [];

  const handleRemoveGenre = useCallback(
    (genre: string) => {
      const next = removeFromArray(filters.genre, genre);
      setFilters({ genre: next.length ? next : undefined });
    },
    [filters.genre, setFilters],
  );

  const handleRemoveLanguage = useCallback(
    (lang: string) => {
      const next = removeFromArray(filters.language, lang);
      setFilters({ language: next.length ? next : undefined });
    },
    [filters.language, setFilters],
  );

  const handleRemoveCondition = useCallback(
    (cond: string) => {
      const next = removeFromArray(filters.condition, cond);
      setFilters({ condition: next.length ? next : undefined });
    },
    [filters.condition, setFilters],
  );

  // --- FilterPanel handlers (set full arrays) ---
  const handleGenreChange = useCallback(
    (genres: string[]) => setFilters({ genre: genres.length ? genres : undefined }),
    [setFilters],
  );

  const handleLanguageChange = useCallback(
    (languages: string[]) => setFilters({ language: languages.length ? languages : undefined }),
    [setFilters],
  );

  const handleConditionChange = useCallback(
    (conditions: string[]) => setFilters({ condition: conditions.length ? conditions : undefined }),
    [setFilters],
  );

  const activeFilterCount =
    (filters.genre?.length ?? 0) +
    (filters.language?.length ?? 0) +
    (filters.condition?.length ?? 0);

  // --- Loading state ---
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[#E4B643] animate-spin" />
      </div>
    );
  }

  // --- No location set ---
  if (!hasLocation) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          {t('discovery.title', 'Browse Books')}
        </h1>
        <SetLocationPrompt />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">
          {t('discovery.title', 'Browse Books')}
        </h1>
        <p className="text-[#8C9C92] text-sm">
          {t('discovery.subtitle', 'Discover books available for swap near you')}
        </p>
      </div>

      {/* Search + Radius controls */}
      <div className="space-y-4">
        <SearchBar
          value={filters.search ?? ''}
          onChange={handleSearchChange}
          isLoading={isLoading && !isFetchingNextPage}
        />
        <div className="flex items-center gap-3">
          <RadiusSelector
            value={activeRadius}
            onChange={handleRadiusChange}
            counts={radiusCounts}
          />
          {/* Mobile filter button */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 px-3 py-2 bg-[#1A251D] border border-[#28382D] rounded-xl text-xs font-medium text-[#8C9C92] hover:text-white transition-colors"
            aria-label={t('discovery.filters.title', 'Filters')}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t('discovery.filters.title', 'Filters')}
            {activeFilterCount > 0 && (
              <span className="bg-[#E4B643] text-[#152018] text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active filters + result count */}
      <FilterChips
        filters={filters}
        totalCount={totalCount}
        onRemoveGenre={handleRemoveGenre}
        onRemoveLanguage={handleRemoveLanguage}
        onRemoveCondition={handleRemoveCondition}
        onClearAll={clearFilters}
      />

      {/* Sidebar + Grid layout */}
      <div className="flex gap-8">
        {/* Desktop filter sidebar */}
        <aside className="hidden lg:block w-[280px] shrink-0">
          <div className="sticky top-24 bg-[#1A251D] border border-[#28382D] rounded-2xl p-5">
            <FilterPanel
              filters={filters}
              onGenreChange={handleGenreChange}
              onLanguageChange={handleLanguageChange}
              onConditionChange={handleConditionChange}
              onClearAll={clearFilters}
            />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Error state */}
          {isError && (
            <div className="text-center py-10">
              <p className="text-red-400">
                {t('error.somethingWentWrong')}
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && books.length === 0 && (
            <BrowseEmptyState
              search={filters.search}
              radiusKm={activeRadius / 1000}
              onExpandRadius={activeRadius < EXPAND_RADIUS ? handleExpandRadius : undefined}
            />
          )}

          {/* Book grid */}
          {books.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {books.map(book => (
                <BrowseBookCard key={book.id} book={book} />
              ))}
            </div>
          )}

          {/* Loading skeleton for initial load */}
          {isLoading && books.length === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-[#1A251D] rounded-2xl border border-[#28382D] overflow-hidden animate-pulse"
                >
                  <div className="aspect-[3/4] bg-[#28382D]" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-[#28382D] rounded w-3/4" />
                    <div className="h-3 bg-[#28382D] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {/* Loading more indicator */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 text-[#E4B643] animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter sheet */}
      <MobileFilterSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
      >
        <FilterPanel
          filters={filters}
          onGenreChange={handleGenreChange}
          onLanguageChange={handleLanguageChange}
          onConditionChange={handleConditionChange}
          onClearAll={clearFilters}
        />
      </MobileFilterSheet>
    </div>
  );
}
