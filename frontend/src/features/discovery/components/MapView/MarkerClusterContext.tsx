import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import { MarkerClusterer, type Renderer } from '@googlemaps/markerclusterer';
import { useMap } from '@vis.gl/react-google-maps';

/**
 * MarkerClusterContext
 *
 * Provides a `MarkerClusterer` instance to descendant `<Marker>` components so
 * they can register / unregister with one shared clusterer rather than
 * rendering 200+ overlapping pins on the map.
 *
 * Usage:
 *   <APIProvider apiKey={KEY}>
 *     <Map ...>
 *       <MarkerClusterProvider>
 *         <BookMarker ... />
 *         <BookMarker ... />
 *       </MarkerClusterProvider>
 *     </Map>
 *   </APIProvider>
 *
 *   // inside BookMarker:
 *   const [markerRef, marker] = useMarkerRef();
 *   useClusterMarker(marker);
 *   return <Marker ref={markerRef} ... />;
 */

interface ClusterApi {
  add: (marker: google.maps.Marker) => void;
  remove: (marker: google.maps.Marker) => void;
}

const ClusterContext = createContext<ClusterApi | null>(null);

const BRAND_GOLD = '#E4B643';
const BRAND_GOLD_OUTLINE = '#fff7d6';

/**
 * Custom dark-theme renderer that matches the app's gold-on-deep-green palette
 * instead of the library default red/blue circles.
 */
const darkThemeRenderer: Renderer = {
  render: ({ count, position }) => {
    const svg = window.btoa(
      `<svg fill="${BRAND_GOLD}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">
        <circle cx="120" cy="120" opacity=".18" r="110" />
        <circle cx="120" cy="120" opacity=".28" r="86" />
        <circle cx="120" cy="120" opacity="1"  r="62" stroke="${BRAND_GOLD_OUTLINE}" stroke-width="3"/>
      </svg>`,
    );
    return new google.maps.Marker({
      position,
      icon: {
        url: `data:image/svg+xml;base64,${svg}`,
        scaledSize: new google.maps.Size(48, 48),
      },
      label: {
        text: String(count),
        color: '#152018',
        fontSize: '13px',
        fontWeight: '700',
      },
      // Render clusters above individual markers so labels stay readable.
      zIndex: 1_000 + count,
    });
  },
};

interface MarkerClusterProviderProps {
  children: ReactNode;
}

export function MarkerClusterProvider({
  children,
}: MarkerClusterProviderProps) {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);

  useEffect(() => {
    if (!map) return;
    const clusterer = new MarkerClusterer({
      map,
      renderer: darkThemeRenderer,
    });
    clustererRef.current = clusterer;
    return () => {
      clusterer.clearMarkers();
      clustererRef.current = null;
    };
  }, [map]);

  const api = useMemo<ClusterApi>(
    () => ({
      add: (marker) => {
        clustererRef.current?.addMarker(marker);
      },
      remove: (marker) => {
        clustererRef.current?.removeMarker(marker);
      },
    }),
    [],
  );

  return (
    <ClusterContext.Provider value={api}>{children}</ClusterContext.Provider>
  );
}

/**
 * Register a `<Marker>` with the surrounding `MarkerClusterProvider`.
 * Pass the resolved `google.maps.Marker | null` returned by `useMarkerRef()`.
 *
 * Safe to call without a provider — the hook becomes a no-op so the same
 * `BookMarker` component works whether or not clustering is enabled.
 */
export function useClusterMarker(marker: google.maps.Marker | null): void {
  const cluster = useContext(ClusterContext);

  useEffect(() => {
    if (!cluster || !marker) return;
    cluster.add(marker);
    return () => cluster.remove(marker);
  }, [cluster, marker]);
}
