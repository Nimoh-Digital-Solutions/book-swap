import { type ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SEOHead } from '@components';
import { LocaleLink } from '@components/common/LocaleLink/LocaleLink';
import { useAuth } from '@features/auth';
import { BookCard, useBooks } from '@features/books';
import { MapView, useMapBooks, useNearbyCount } from '@features/discovery';
import { useUserCity } from '@hooks';
import { useLocaleNavigate } from '@hooks/useLocaleNavigate';
import { PATHS, routeMetadata } from '@routes/config/paths';
import { AlertTriangle, BookOpen, MapPin, RefreshCw, Search } from 'lucide-react';

const DEFAULT_RADIUS = 10_000;

const GENRES = [
  'Fiction',
  'Non-Fiction',
  'Sci-Fi & Fantasy',
  'Romance',
  'Thriller & Mystery',
  'Biographies',
  "Children's Books",
  'Comics & Graphic Novels',
  'History',
  'Self-Help',
  'Cookbooks',
  'Poetry',
] as const;

export default function BrowsePage(): ReactElement {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useLocaleNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGenres, setActiveGenres] = useState<Set<string>>(new Set());
  const { city, lat, lng } = useUserCity();
  const { data: nearbyData } = useNearbyCount(lat, lng, DEFAULT_RADIUS);
  const activeGenreFilter = activeGenres.size > 0
    ? [...activeGenres].join(',')
    : undefined;
  const {
    data: recentBooks,
    isLoading: recentLoading,
    isError: recentError,
    refetch: refetchRecent,
  } = useBooks({
    page_size: 12,
    ordering: '-created_at',
    ...(activeGenreFilter && { genre: activeGenreFilter }),
  });
  const filteredBooks = recentBooks?.results ?? [];
  const hasLocation = lat != null && lng != null;
  const {
    data: mapData,
    isLoading: mapLoading,
    isError: mapError,
    refetch: refetchMap,
  } = useMapBooks(
    { radius: DEFAULT_RADIUS, lat: lat ?? undefined, lng: lng ?? undefined },
    hasLocation,
  );

  const toggleGenre = (genre: string) => {
    setActiveGenres((prev) => {
      const next = new Set(prev);
      if (next.has(genre)) next.delete(genre);
      else next.add(genre);
      return next;
    });
  };

  const handleSearch = (term: string) => {
    const q = term.trim();
    if (!q) return;
    void navigate(`${PATHS.CATALOGUE}?search=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-[#152018] text-[#8C9C92]">
      <SEOHead
        title={routeMetadata[PATHS.BROWSE].title}
        description={routeMetadata[PATHS.BROWSE].description}
        path={PATHS.BROWSE}
      />
      {/* Hero */}
      <section className="relative overflow-hidden pb-8">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[#E4B643]/6 blur-[140px] rounded-full" />
          <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] bg-[#E4B643]/4 blur-[120px] rounded-full" />
          <div className="absolute top-1/4 -right-32 w-[300px] h-[300px] bg-[#4ADE80]/3 blur-[100px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center" style={{ marginInline: 'auto' }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A251D] border border-[#28382D] text-[#E4B643] text-xs font-semibold mb-8">
            <Search className="w-3.5 h-3.5" aria-hidden="true" />
            {nearbyData
              ? t('browse.hero.badge', '{{count}} books available near you', {
                  count: nearbyData.count,
                })
              : t('browse.hero.badgeLoading', 'Finding books near you...')}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-[1.08]">
            {t('browse.hero.titleLine1', 'Discover your')}{' '}
            <span className="text-[#E4B643]">{t('browse.hero.titleLine2', 'next read.')}</span>
          </h1>
          <p className="text-lg md:text-xl text-[#8C9C92] mb-10 max-w-2xl mx-auto">
            {t(
              'browse.hero.subtitle',
              'Search thousands of books available for swap near you. Find something new, trade something old.',
            )}
          </p>

          <form
            className="max-w-2xl mx-auto relative"
            onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery); }}
          >
            <div className="flex items-center bg-[#1A251D] border border-[#28382D] rounded-full p-2 pl-6 shadow-2xl focus-within:border-[#E4B643]/50 transition-colors">
              <Search className="w-5 h-5 text-[#8C9C92]" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('browse.hero.searchPlaceholder', 'Search by title, author, or ISBN...')}
                className="flex-1 bg-transparent border-none outline-none text-white px-4 placeholder-[#5A6A60]"
                aria-label={t('browse.hero.searchLabel', 'Search books')}
              />
              <button
                type="submit"
                className="bg-[#E4B643] hover:bg-[#D4A633] text-[#152018] px-8 py-3 rounded-full font-bold transition-colors"
              >
                {t('browse.hero.search', 'Search')}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Genre Pills + Books */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" style={{ marginInline: 'auto' }}>
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {t('browse.recent.title', 'Recently Added')}
            </h2>
            <p className="text-[#8C9C92]">
              {t('browse.genres.subtitle', 'Filter by genre or browse everything.')}
            </p>
          </div>
          <LocaleLink
            to={PATHS.CATALOGUE}
            className="text-[#E4B643] font-semibold text-sm hover:text-white transition-colors no-underline hidden sm:block"
          >
            {t('browse.recent.viewAll', 'View full catalogue')}
          </LocaleLink>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {GENRES.map((genre) => {
            const isActive = activeGenres.has(genre);
            return (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#E4B643] text-[#152018]'
                    : 'bg-[#1A251D] border border-[#28382D] text-[#8C9C92] hover:border-[#E4B643]/50 hover:text-white'
                }`}
              >
                {genre}
              </button>
            );
          })}
          {activeGenres.size > 0 && (
            <button
              type="button"
              onClick={() => setActiveGenres(new Set())}
              className="px-4 py-2 rounded-full text-sm font-medium text-[#E4B643] hover:text-white transition-colors"
            >
              {t('browse.genres.clearAll', 'Clear all')}
            </button>
          )}
        </div>

        {recentError ? (
          /* AUD-W-202: explicit error UI for the books grid so a failed
             /books/ call doesn't silently render an empty state that
             reads like "no books exist". */
          <div className="bg-[#1A251D] border border-[#28382D] rounded-3xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 mb-5">
              <AlertTriangle className="w-6 h-6 text-red-400" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {t('browse.recent.errorTitle', "Couldn't load books")}
            </h3>
            <p className="text-[#5A6A60] mb-5 max-w-sm mx-auto">
              {t(
                'browse.recent.errorBody',
                'Something went wrong while fetching books. Check your connection and try again.',
              )}
            </p>
            <button
              type="button"
              onClick={() => {
                void refetchRecent();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E4B643] hover:bg-[#D4A633] text-[#152018] font-bold text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              {t('common.retry', 'Retry')}
            </button>
          </div>
        ) : recentLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#1A251D] rounded-2xl border border-[#28382D] overflow-hidden animate-pulse"
              >
                <div className="aspect-[3/4] bg-[#152018]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[#28382D] rounded w-3/4" />
                  <div className="h-3 bg-[#28382D] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (recentBooks?.results ?? []).length === 0 ? (
          <div className="bg-[#1A251D] border border-[#28382D] rounded-3xl p-12 md:p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E4B643]/10 mb-6">
              <BookOpen className="w-8 h-8 text-[#E4B643]" aria-hidden="true" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              {t('browse.empty.title', 'No books available yet')}
            </h3>
            <p className="text-[#8C9C92] max-w-md mx-auto mb-6">
              {t(
                'browse.empty.description',
                'Be the first to list a book in your area! Add a book to your shelf and kickstart the community.',
              )}
            </p>
            {isAuthenticated ? (
              <LocaleLink
                to={PATHS.ADD_BOOK}
                className="inline-flex items-center gap-2 bg-[#E4B643] hover:bg-[#D4A633] text-[#152018] px-6 py-3 rounded-full font-bold text-sm transition-colors no-underline"
              >
                <BookOpen className="w-4 h-4" aria-hidden="true" />
                {t('browse.empty.addBook', 'List Your First Book')}
              </LocaleLink>
            ) : (
              <LocaleLink
                to={PATHS.REGISTER}
                className="inline-flex items-center gap-2 bg-[#E4B643] hover:bg-[#D4A633] text-[#152018] px-6 py-3 rounded-full font-bold text-sm transition-colors no-underline"
              >
                {t('browse.empty.register', 'Sign Up to Get Started')}
              </LocaleLink>
            )}
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="bg-[#1A251D] border border-[#28382D] rounded-3xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#28382D] mb-5">
              <Search className="w-6 h-6 text-[#5A6A60]" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {t('browse.genres.noResultsTitle', 'No matches')}
            </h3>
            <p className="text-[#5A6A60] mb-5 max-w-sm mx-auto">
              {t(
                'browse.genres.noResults',
                'No books match the selected genres yet. Try a different combination or clear the filters.',
              )}
            </p>
            <button
              type="button"
              onClick={() => setActiveGenres(new Set())}
              className="text-[#E4B643] font-semibold text-sm hover:text-white transition-colors"
            >
              {t('browse.genres.clearFilters', 'Clear all filters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <LocaleLink
            to={PATHS.CATALOGUE}
            className="text-[#E4B643] font-semibold text-sm hover:text-white transition-colors no-underline"
          >
            {t('browse.recent.viewAll', 'View full catalogue')}
          </LocaleLink>
        </div>
      </section>

      {/* Books Near You — Map */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24" style={{ marginInline: 'auto' }}>
        <div className="bg-[#1A251D] border border-[#28382D] rounded-3xl p-6 md:p-10 overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-80 flex-shrink-0 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-6 h-6 text-[#E4B643]" aria-hidden="true" />
                <h2 className="text-2xl font-bold text-white">
                  {t('browse.location.title', 'Books Near You')}
                </h2>
              </div>
              <p className="text-[#8C9C92] mb-2">
                {nearbyData
                  ? t('browse.location.stats', '{{count}} books available within 10 km of {{city}}.', {
                      count: nearbyData.count,
                      city,
                    })
                  : t('browse.location.loading', 'Finding books near you...')}
              </p>
              <p className="text-[#5A6A60] text-sm mb-6">
                {t(
                  'browse.location.description',
                  'Explore what\'s available in your neighbourhood. Tap a pin to see book details and request a swap.',
                )}
              </p>
              <LocaleLink
                to={PATHS.MAP}
                className="inline-flex items-center gap-2 bg-[#E4B643] hover:bg-[#D4A633] text-[#152018] px-6 py-3 rounded-full font-bold text-sm transition-colors no-underline self-start"
              >
                <MapPin className="w-4 h-4" aria-hidden="true" />
                {t('browse.location.cta', 'Explore Full Map')}
              </LocaleLink>
            </div>

            <div className="flex-1 min-h-[400px] lg:min-h-[500px] rounded-2xl overflow-hidden border border-[#28382D]">
              {hasLocation ? (
                mapError ? (
                  /* AUD-W-202: map-data fetch error gets its own UI instead
                     of leaving the map skeleton spinning forever. */
                  <div className="w-full h-full min-h-[400px] bg-[#152018] flex flex-col items-center justify-center text-center p-8">
                    <AlertTriangle
                      className="w-10 h-10 text-red-400 mb-4"
                      aria-hidden="true"
                    />
                    <p className="text-white font-semibold mb-2">
                      {t('browse.location.errorTitle', "Couldn't load the map")}
                    </p>
                    <p className="text-[#5A6A60] text-sm max-w-xs mb-5">
                      {t(
                        'browse.location.errorBody',
                        'Check your connection and try again.',
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        void refetchMap();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E4B643] hover:bg-[#D4A633] text-[#152018] font-bold text-xs transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                      {t('common.retry', 'Retry')}
                    </button>
                  </div>
                ) : (
                  <MapView
                    books={mapData?.results ?? []}
                    userLocation={{ latitude: lat!, longitude: lng! }}
                    radiusMetres={DEFAULT_RADIUS}
                    isLoading={mapLoading}
                  />
                )
              ) : (
                <div className="w-full h-full min-h-[400px] bg-[#152018] flex flex-col items-center justify-center text-center p-8">
                  <MapPin className="w-10 h-10 text-[#28382D] mb-4" aria-hidden="true" />
                  <p className="text-[#5A6A60] text-sm max-w-xs">
                    {t(
                      'browse.location.noLocation',
                      'Set your location in Settings to see books on the map.',
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
