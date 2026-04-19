import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CACHE_KEY = 'bookswap_city_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Fallback: NL centre (Amsterdam coordinates kept for map centering, label is generic)
const FALLBACK_CITY = 'your area';
const FALLBACK_LAT = 52.3676;
const FALLBACK_LNG = 4.9041;

// Swap this URL for a self-hosted or paid proxy if ipapi.co rate limits become an issue
const IP_GEO_URL = 'https://ipapi.co/json/';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CityCache {
  city: string;
  lat: number;
  lng: number;
  detectedAt: number;
}

export interface UserCityResult {
  city: string;
  lat: number;
  lng: number;
  /** `true` while the first detection attempt is in flight */
  loading: boolean;
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

function readCache(): Omit<CityCache, 'detectedAt'> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CityCache;
    if (Date.now() - parsed.detectedAt > CACHE_TTL_MS) return null;
    return { city: parsed.city, lat: parsed.lat, lng: parsed.lng };
  } catch {
    return null;
  }
}

function writeCache(city: string, lat: number, lng: number): void {
  try {
    const entry: CityCache = { city, lat, lng, detectedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage unavailable (private browsing, quota exceeded) — skip silently
  }
}

// ---------------------------------------------------------------------------
// Detection strategies
// ---------------------------------------------------------------------------

/** Tier 1: silent IP-based lookup — no browser permission required */
async function detectViaIp(): Promise<{ city: string; lat: number; lng: number }> {
  const res = await fetch(IP_GEO_URL);
  if (!res.ok) throw new Error('IP geo request failed');
  const data = (await res.json()) as {
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  if (!data.city || data.latitude == null || data.longitude == null) {
    throw new Error('Incomplete response from IP geo API');
  }
  return { city: data.city, lat: data.latitude, lng: data.longitude };
}

/** Reverse-geocode coordinates to a city name via Nominatim (OSM) */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `${NOMINATIM_URL}?format=json&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'BookSwap/1.0 (bookswap.app)' },
  });
  if (!res.ok) throw new Error('Nominatim reverse geocode failed');
  const data = (await res.json()) as {
    address?: { city?: string; town?: string; village?: string };
  };
  return (
    data.address?.city ??
    data.address?.town ??
    data.address?.village ??
    FALLBACK_CITY
  );
}

/**
 * Tier 2: browser Geolocation API (prompts user) + Nominatim reverse geocode.
 * Falls back to IP detection if the browser API is unavailable or denied.
 */
async function detectViaBrowser(): Promise<{ city: string; lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation API not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        reverseGeocode(lat, lng)
          .then((city) => resolve({ city, lat, lng }))
          .catch(reject);
      },
      (err) => reject(err),
      { timeout: 5000 },
    );
  });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Detects the user's current city using a two-tier strategy:
 *  1. IP-based geolocation (silent, no permission required)
 *  2. Browser Geolocation API + Nominatim reverse geocode (more accurate)
 *
 * Results are cached in localStorage for 24 hours to avoid repeated lookups.
 * Defaults to Amsterdam if both tiers fail.
 */
export function useUserCity(): UserCityResult {
  const [result, setResult] = useState<UserCityResult>({
    city: FALLBACK_CITY,
    lat: FALLBACK_LAT,
    lng: FALLBACK_LNG,
    loading: true,
  });

  useEffect(() => {
    // Return cached result immediately if still fresh
    const cached = readCache();
    if (cached) {
      setResult({ ...cached, loading: false });
      return;
    }

    let cancelled = false;

    const detect = async () => {
      let detected: { city: string; lat: number; lng: number } | null = null;

      // Tier 1: browser Geolocation API — GPS/WiFi-accurate, prompts user once.
      // Preferred over IP geo which maps to the ISP's registered address, not the
      // user's actual location.
      try {
        detected = await detectViaBrowser();
      } catch {
        // User denied permission or API unavailable — fall through to IP geo
      }

      // Tier 2: silent IP-based lookup as fallback (city-level, ISP-registered)
      if (!detected) {
        try {
          detected = await detectViaIp();
        } catch {
          // fall through to hardcoded fallback
        }
      }

      if (cancelled) return;

      if (detected) {
        writeCache(detected.city, detected.lat, detected.lng);
        setResult({ ...detected, loading: false });
      } else {
        setResult({
          city: FALLBACK_CITY,
          lat: FALLBACK_LAT,
          lng: FALLBACK_LNG,
          loading: false,
        });
      }
    };

    void detect();

    return () => {
      cancelled = true;
    };
  }, []);

  return result;
}
