import { useCallback, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CurrentLocationResult {
  /** GPS-detected latitude, or `null` if not yet detected / denied. */
  lat: number | null;
  /** GPS-detected longitude, or `null` if not yet detected / denied. */
  lng: number | null;
  /** Whether the user toggled "use my current location" on. */
  active: boolean;
  /** Whether a GPS detection is in flight. */
  detecting: boolean;
  /** Non-null when the browser denied or failed GPS. */
  error: string | null;
  /** Toggle the "use current location" mode. Triggers GPS on first enable. */
  toggle: () => void;
  /** Explicitly disable the override (revert to profile location). */
  disable: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * On-demand browser Geolocation hook for the "Use my current location" toggle.
 *
 * Unlike `useUserCity` (which auto-detects on mount and caches for 24 h),
 * this hook only fires GPS when the user explicitly toggles it on. The
 * coordinates are ephemeral — they are not persisted anywhere.
 */
export function useCurrentLocation(): CurrentLocationResult {
  const [active, setActive] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectGps = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setDetecting(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setActive(true);
        setDetecting(false);
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access was denied. Please enable it in your browser settings.'
            : 'Could not detect your location. Please try again.',
        );
        setActive(false);
        setDetecting(false);
      },
      { timeout: 10_000, enableHighAccuracy: false },
    );
  }, []);

  const toggle = useCallback(() => {
    if (active) {
      setActive(false);
      return;
    }
    // If we already have coords from a previous detection, just re-enable.
    if (lat != null && lng != null) {
      setActive(true);
      return;
    }
    detectGps();
  }, [active, lat, lng, detectGps]);

  const disable = useCallback(() => {
    setActive(false);
  }, []);

  return { lat: active ? lat : null, lng: active ? lng : null, active, detecting, error, toggle, disable };
}
