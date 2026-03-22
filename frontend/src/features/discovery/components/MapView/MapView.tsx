import { type ReactElement, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';

import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
// Fix default marker icon paths (common webpack/vite issue)
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

import type { BrowseBook } from '../../types/discovery.types';
import { BookPopup } from '../BookPopup';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import 'leaflet.markercluster';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

/** Custom gold book pin icon. */
const bookIcon = new L.Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/** Calculate zoom level from radius in metres. */
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

export function MapView({ books, userLocation, radiusMetres }: MapViewProps): ReactElement {
  const { t } = useTranslation();

  const center: [number, number] = [userLocation.latitude, userLocation.longitude];
  const zoom = getZoomForRadius(radiusMetres);

  // Group books by owner location (same snapped point = same pin)
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

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-[500px] lg:h-[600px] rounded-2xl border border-[#28382D] z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User location — blue dot */}
      <CircleMarker
        center={center}
        radius={8}
        pathOptions={{
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.8,
          weight: 2,
        }}
      >
        <Popup>
          <span className="text-sm font-medium">
            {t('discovery.map.yourLocation', 'Your location')}
          </span>
        </Popup>
      </CircleMarker>

      {/* Book markers with clustering */}
      <MarkerClusterGroup chunkedLoading>
        {Array.from(groupedByLocation.entries()).map(([key, booksAtLocation]) => {
          const loc = booksAtLocation[0]!.owner.location!;
          return (
            <Marker
              key={key}
              position={[loc.latitude, loc.longitude]}
              icon={bookIcon}
            >
              <Popup maxWidth={280}>
                <BookPopup books={booksAtLocation} />
              </Popup>
            </Marker>
          );
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
