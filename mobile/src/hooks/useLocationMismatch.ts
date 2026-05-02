import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuthStore } from "@/stores/authStore";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum distance (km) between GPS and profile to trigger the mismatch. */
const MISMATCH_THRESHOLD_KM = 20;

// ---------------------------------------------------------------------------
// Haversine helper
// ---------------------------------------------------------------------------

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LocationMismatchResult {
  /** `true` when GPS and profile are far apart and not dismissed this session. */
  showMismatch: boolean;
  /** Approximate distance in km between GPS and profile location. */
  distanceKm: number | null;
  /** The neighbourhood stored on the profile. */
  profileNeighborhood: string | null;
  /** Dismiss the mismatch prompt for this app session. */
  dismiss: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Compares the device GPS location with the user's stored profile location.
 * If the distance exceeds the threshold, `showMismatch` becomes `true`.
 *
 * Runs GPS detection once on mount (re-uses existing permission if granted).
 * The prompt is dismissible — stored in a module-level ref so it survives
 * re-renders but resets on app restart.
 */
export function useLocationMismatch(): LocationMismatchResult {
  const user = useAuthStore((s) => s.user);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    if (!user?.location?.coordinates) return;

    const [profileLng, profileLat] = user.location.coordinates;

    let cancelled = false;

    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return;

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (cancelled) return;

      const km = haversineKm(
        pos.coords.latitude,
        pos.coords.longitude,
        profileLat,
        profileLng,
      );
      setDistanceKm(Math.round(km));
      checkedRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.location?.coordinates]);

  const showMismatch =
    !dismissed && distanceKm != null && distanceKm >= MISMATCH_THRESHOLD_KM;

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    showMismatch,
    distanceKm,
    profileNeighborhood: user?.neighborhood ?? null,
    dismiss,
  };
}
