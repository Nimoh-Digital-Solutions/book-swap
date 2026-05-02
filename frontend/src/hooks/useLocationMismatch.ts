import { useMemo, useState } from 'react';

import type { SnappedLocation } from '@features/profile';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum distance (in km) between GPS and profile to trigger the mismatch. */
const MISMATCH_THRESHOLD_KM = 20;

const SESSION_DISMISSED_KEY = 'bookswap_location_mismatch_dismissed';

// ---------------------------------------------------------------------------
// Haversine helper
// ---------------------------------------------------------------------------

/** Returns the great-circle distance in km between two lat/lng points. */
function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth radius in km
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
  /** `true` when GPS and profile are far apart and the user hasn't dismissed. */
  showMismatch: boolean;
  /** Approximate distance in km between GPS and profile location. */
  distanceKm: number | null;
  /** The city/name detected via GPS (from `useUserCity`). */
  detectedCity: string | null;
  /** The neighbourhood stored on the profile. */
  profileNeighborhood: string | null;
  /** Dismiss the mismatch banner for this session. */
  dismiss: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Compares the user's GPS-detected location (from `useUserCity`) with their
 * saved profile location. If the distance exceeds {@link MISMATCH_THRESHOLD_KM},
 * `showMismatch` is `true` — allowing the UI to render a non-intrusive prompt.
 *
 * The prompt is dismissible per session (stored in `sessionStorage`).
 */
export function useLocationMismatch(
  gpsLat: number | undefined,
  gpsLng: number | undefined,
  gpsCity: string | undefined,
  profileLocation: SnappedLocation | null | undefined,
  profileNeighborhood: string | undefined,
): LocationMismatchResult {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  const distanceKm = useMemo(() => {
    if (
      gpsLat == null ||
      gpsLng == null ||
      !profileLocation?.latitude ||
      !profileLocation?.longitude
    ) {
      return null;
    }
    return haversineKm(
      gpsLat,
      gpsLng,
      profileLocation.latitude,
      profileLocation.longitude,
    );
  }, [gpsLat, gpsLng, profileLocation]);

  const showMismatch =
    !dismissed && distanceKm != null && distanceKm >= MISMATCH_THRESHOLD_KM;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(SESSION_DISMISSED_KEY, '1');
    } catch {
      // sessionStorage unavailable — dismiss in-memory only
    }
  };

  return {
    showMismatch,
    distanceKm: distanceKm != null ? Math.round(distanceKm) : null,
    detectedCity: gpsCity ?? null,
    profileNeighborhood: profileNeighborhood ?? null,
    dismiss,
  };
}
