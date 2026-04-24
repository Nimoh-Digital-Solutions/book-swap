import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  DEFAULT_REGION,
  type MapRegion,
} from "../components/browse-map/types";

interface MapAnimator {
  animateToRegion?: (region: MapRegion, duration?: number) => void;
}

interface UseUserLocationOptions {
  /** Whether the underlying map is rendered and can be animated to. */
  mapAvailable: boolean;
}

export function useUserLocation({ mapAvailable }: UseUserLocationOptions) {
  const [region, setRegion] = useState<MapRegion>(DEFAULT_REGION);
  const [locationReady, setLocationReady] = useState(false);
  const mapRef = useRef<MapAnimator | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        if (cancelled) return;
        const userRegion: MapRegion = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(userRegion);
        if (mapAvailable) {
          mapRef.current?.animateToRegion?.(userRegion, 500);
        }
      }
      if (!cancelled) setLocationReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [mapAvailable]);

  const recenterMap = useCallback(async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return;
    const loc = await Location.getCurrentPositionAsync({});
    const newRegion: MapRegion = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion?.(newRegion, 500);
  }, []);

  return {
    region,
    setRegion,
    locationReady,
    mapRef,
    recenterMap,
  };
}
