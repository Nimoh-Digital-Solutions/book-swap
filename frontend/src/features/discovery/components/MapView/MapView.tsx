import { type ReactElement, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  APIProvider,
  InfoWindow,
  Map as GoogleMap,
  Marker,
} from '@vis.gl/react-google-maps';

import type { BrowseBook } from '../../types/discovery.types';
import { BookPopup } from '../BookPopup';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1a2e22' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#152018' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8C9C92' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#b5c4ba' }],
  },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#28382D' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a2e22' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#334a3b' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1a13' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d5c47' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1f3328' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6b8a72' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1f3328' }] },
];

function getZoomForRadius(radiusMetres: number): number {
  if (radiusMetres <= 1000) return 15;
  if (radiusMetres <= 3000) return 14;
  if (radiusMetres <= 5000) return 13;
  if (radiusMetres <= 10000) return 12;
  return 11;
}

interface MapViewProps {
  books: BrowseBook[];
  userLocation: { latitude: number; longitude: number };
  radiusMetres: number;
}

interface BookMarkerProps {
  locationKey: string;
  books: BrowseBook[];
  position: google.maps.LatLngLiteral;
  isSelected: boolean;
  onSelect: (key: string | null) => void;
}

function BookMarker({ locationKey, books, position, isSelected, onSelect }: BookMarkerProps) {
  const handleClick = useCallback(() => {
    onSelect(isSelected ? null : locationKey);
  }, [isSelected, locationKey, onSelect]);

  return (
    <>
      <Marker position={position} onClick={handleClick} />

      {isSelected && (
        <InfoWindow position={position} onClose={() => onSelect(null)} maxWidth={300}>
          <BookPopup books={books} />
        </InfoWindow>
      )}
    </>
  );
}

export function MapView({ books, userLocation, radiusMetres }: MapViewProps): ReactElement {
  const { t } = useTranslation();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const center = useMemo<google.maps.LatLngLiteral>(
    () => ({ lat: userLocation.latitude, lng: userLocation.longitude }),
    [userLocation.latitude, userLocation.longitude],
  );
  const zoom = getZoomForRadius(radiusMetres);

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

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full h-[500px] lg:h-[600px] rounded-2xl border border-[#28382D] bg-[#152018] flex items-center justify-center">
        <p className="text-[#8C9C92] text-sm">
          {t('discovery.map.noApiKey', 'Map unavailable — API key not configured')}
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <div className="w-full h-[500px] lg:h-[600px] rounded-2xl border border-[#28382D] overflow-hidden">
        <GoogleMap
          defaultCenter={center}
          defaultZoom={zoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          styles={DARK_MAP_STYLES}
          className="w-full h-full"
        >
          {/* User location */}
          <Marker
            position={center}
            clickable={false}
            title={t('discovery.map.yourLocation', 'Your location')}
            icon={{
              path: 0,
              scale: 8,
              fillColor: '#3B82F6',
              fillOpacity: 0.9,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
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
              />
            );
          })}
        </GoogleMap>
      </div>
    </APIProvider>
  );
}
