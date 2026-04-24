import { type ReactElement, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BrandedLoader, SEOHead } from '@components';
import { LocaleLink } from '@components/common/LocaleLink/LocaleLink';
import { useMapBooks, useRadiusCounts } from '@features/discovery';
import type {
  BrowseBook,
  BrowseFilters,
} from '@features/discovery/types/discovery.types';
import { useUserCity } from '@hooks';
import { PATHS, routeMetadata } from '@routes/config/paths';
import {
  APIProvider,
  Circle,
  Map as GoogleMap,
  Marker,
  useApiIsLoaded,
} from '@vis.gl/react-google-maps';
import { ArrowLeft, MapPin } from 'lucide-react';

import { BookMarker } from './BookMarker';
import {
  DARK_MAP_STYLES,
  DEFAULT_RADIUS,
  GOOGLE_MAPS_API_KEY,
} from './map.constants';
import { SidePanel } from './SidePanel';

export default function MapPage(): ReactElement {
  const { t } = useTranslation();
  const { city, lat, lng } = useUserCity();
  const hasLocation = lat != null && lng != null;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

  const filters = useMemo<BrowseFilters>(
    () => ({
      radius,
      search: searchQuery || undefined,
      genre: selectedGenres.length > 0 ? selectedGenres : undefined,
      language: selectedLanguages.length > 0 ? selectedLanguages : undefined,
      condition: selectedConditions.length > 0 ? selectedConditions : undefined,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
    }),
    [
      radius,
      searchQuery,
      selectedGenres,
      selectedLanguages,
      selectedConditions,
      lat,
      lng,
    ],
  );

  const { data: mapData, isLoading } = useMapBooks(filters, hasLocation);
  const { data: radiusCountsData } = useRadiusCounts(
    lat ?? undefined,
    lng ?? undefined,
    hasLocation,
  );

  const books = useMemo(() => mapData?.results ?? [], [mapData]);

  const center = useMemo<google.maps.LatLngLiteral>(
    () => ({ lat: lat ?? 52.37, lng: lng ?? 4.9 }),
    [lat, lng],
  );

  const groupedByLocation = useMemo(() => {
    const groups = new Map<string, BrowseBook[]>();
    for (const book of books) {
      const loc = book.owner.location;
      if (!loc) continue;
      const key = `${loc.latitude},${loc.longitude}`;
      const existing = groups.get(key);
      if (existing) {
        existing.push(book);
      } else {
        groups.set(key, [book]);
      }
    }
    return groups;
  }, [books]);

  const handleSelectBook = useCallback((book: BrowseBook) => {
    const loc = book.owner.location;
    if (!loc) return;
    const key = `${loc.latitude},${loc.longitude}`;
    setSelectedKey(key);
    setSelectedBookId(book.id);
  }, []);

  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  }, []);

  const toggleCondition = useCallback((cond: string) => {
    setSelectedConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond],
    );
  }, []);

  const hasActiveFilters =
    selectedGenres.length > 0 ||
    selectedLanguages.length > 0 ||
    selectedConditions.length > 0 ||
    !!searchQuery;

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedGenres([]);
    setSelectedLanguages([]);
    setSelectedConditions([]);
    setRadius(DEFAULT_RADIUS);
  }, []);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex-1 bg-[#152018] flex flex-col items-center justify-center text-center p-8">
        <MapPin className="w-12 h-12 text-[#28382D] mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">
          {t('map.noApiKey.title', 'Map unavailable')}
        </h2>
        <p className="text-[#8C9C92] text-sm max-w-sm mb-6">
          {t(
            'map.noApiKey.description',
            'The Google Maps API key is not configured. Please contact support.',
          )}
        </p>
        <LocaleLink
          to={PATHS.BROWSE}
          className="inline-flex items-center gap-2 text-[#E4B643] font-semibold text-sm hover:text-white transition-colors no-underline"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('map.noApiKey.back', 'Back to Browse')}
        </LocaleLink>
      </div>
    );
  }

  if (!hasLocation) {
    return (
      <div className="flex-1 bg-[#152018] flex flex-col items-center justify-center text-center p-8">
        <MapPin className="w-12 h-12 text-[#28382D] mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">
          {t('map.noLocation.title', 'Location needed')}
        </h2>
        <p className="text-[#8C9C92] text-sm max-w-sm mb-6">
          {t(
            'map.noLocation.description',
            'Set your location in Settings so we can show books near you on the map.',
          )}
        </p>
        <LocaleLink
          to={PATHS.SETTINGS}
          className="inline-flex items-center gap-2 bg-[#E4B643] hover:bg-[#D4A633] text-[#152018] px-6 py-3 rounded-full font-bold text-sm transition-colors no-underline"
        >
          {t('map.noLocation.settings', 'Go to Settings')}
        </LocaleLink>
      </div>
    );
  }

  return (
    <main
      className="relative flex-1 -mt-[1px]"
      style={{ height: 'calc(100vh - 73px)' }}
    >
      <SEOHead
        title={routeMetadata[PATHS.MAP].title}
        description={routeMetadata[PATHS.MAP].description}
        path={PATHS.MAP}
      />
      <h1 className="sr-only">{t('map.pageTitle', 'Book Map')}</h1>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
        {/* Top bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          <LocaleLink
            to={PATHS.BROWSE}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#152018]/90 backdrop-blur-xl border border-[#28382D] rounded-full text-white text-sm font-medium hover:bg-[#1A251D] transition-colors no-underline shadow-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('map.topBar.back', 'Browse')}
          </LocaleLink>

          <div className="flex items-center gap-2 px-5 py-2.5 bg-[#152018]/90 backdrop-blur-xl border border-[#28382D] rounded-full shadow-lg">
            <MapPin className="w-4 h-4 text-[#E4B643]" />
            <span className="text-white text-sm font-medium">
              {city ?? t('map.topBar.unknownCity', 'Your area')}
            </span>
            <span className="text-[#5A6A60] text-xs">
              &middot; {books.length} {t('map.topBar.books', 'books')}
            </span>
          </div>

        </div>

        {/* Side panel */}
        <SidePanel
          books={books}
          isLoading={isLoading}
          isOpen={panelOpen}
          onOpen={() => setPanelOpen(true)}
          onClose={() => setPanelOpen(false)}
          onSelectBook={handleSelectBook}
          selectedBookId={selectedBookId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          radius={radius}
          onRadiusChange={setRadius}
          radiusCounts={radiusCountsData?.counts}
          genres={selectedGenres}
          onGenreToggle={toggleGenre}
          languages={selectedLanguages}
          onLanguageChange={setSelectedLanguages}
          conditions={selectedConditions}
          onConditionToggle={toggleCondition}
          onClearAll={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Loading overlay while Google Maps script + initial book data load */}
        <MapLoadingOverlay isDataLoading={isLoading} hasBooks={books.length > 0} />

        {/* Full-screen map */}
        <GoogleMap
          defaultCenter={center}
          defaultZoom={hasLocation ? 13 : 7}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          styles={DARK_MAP_STYLES}
          className="w-full h-full"
        >
          {/* User location */}
          <Marker
            position={center}
            clickable={false}
            title={t('map.yourLocation', 'Your location')}
            icon={{
              path: 0,
              scale: 8,
              fillColor: '#3B82F6',
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />

          {/* Radius circle */}
          <Circle
            center={center}
            radius={radius}
            fillColor="#E4B643"
            fillOpacity={0.04}
            strokeColor="#E4B643"
            strokeOpacity={0.25}
            strokeWeight={1}
          />

          {/* Book markers */}
          {[...groupedByLocation.entries()].map(([key, booksAtLocation]) => {
            const loc = booksAtLocation[0]!.owner.location!;
            return (
              <BookMarker
                key={key}
                locationKey={key}
                books={booksAtLocation}
                position={{ lat: loc.latitude, lng: loc.longitude }}
                isSelected={selectedKey === key}
                onSelect={setSelectedKey}
                selectedBookId={selectedBookId}
              />
            );
          })}
        </GoogleMap>
      </APIProvider>
    </main>
  );
}

/**
 * Branded overlay shown while the Google Maps script is initialising or while
 * the first batch of book markers is loading. Sits inside `APIProvider` so it
 * can read API readiness via `useApiIsLoaded`.
 */
function MapLoadingOverlay({
  isDataLoading,
  hasBooks,
}: {
  isDataLoading: boolean;
  hasBooks: boolean;
}): ReactElement | null {
  const { t } = useTranslation();
  const apiLoaded = useApiIsLoaded();

  // Only show on the initial load:
  //  - Maps API not yet ready, OR
  //  - data is loading and we have no markers to render yet.
  const visible = !apiLoaded || (isDataLoading && !hasBooks);

  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-[#0f1a14]/95 pointer-events-none"
      aria-hidden={!visible}
    >
      <BrandedLoader
        size="lg"
        label={
          !apiLoaded
            ? t('map.loading.tiles', 'Loading map…')
            : t('map.loading.books', 'Finding books near you…')
        }
        fillParent={false}
      />
    </div>
  );
}
