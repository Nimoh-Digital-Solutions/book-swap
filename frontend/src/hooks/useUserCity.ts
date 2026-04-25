import { useEffect, useState } from 'react';

import { createExternalHttpClient, HttpError } from '@services';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CACHE_KEY = 'bookswap_city_cache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Fallback: NL centre (Amsterdam coordinates kept for map centering, label is generic)
const FALLBACK_CITY = 'your area';
const FALLBACK_LAT = 52.3676;
const FALLBACK_LNG = 4.9041;

// ---------------------------------------------------------------------------
// External HTTP clients (instrumented through services/httpExternal so
// timeouts, dev logging, and HttpError parsing match the rest of the app).
// ---------------------------------------------------------------------------

const ipapi = createExternalHttpClient({
  baseUrl: 'https://ipapi.co',
  name: 'ipapi',
  defaultTimeout: 5_000,
});

const nominatim = createExternalHttpClient({
  baseUrl: 'https://nominatim.openstreetmap.org',
  name: 'nominatim',
  defaultTimeout: 5_000,
  defaultHeaders: { 'User-Agent': 'BookSwap/1.0 (bookswap.app)' },
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CityCache {
  city: string;
  lat: number;
  lng: number;
  detectedAt: number;
}

interface IpGeoResponse {
  city?: string;
  latitude?: number;
  longitude?: number;
}

interface NominatimResponse {
  address?: { city?: string; town?: string; village?: string };
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
  const { data } = await ipapi.get<IpGeoResponse>('/json/');
  if (!data.city || data.latitude == null || data.longitude == null) {
    throw new HttpError(204, 'Incomplete response from IP geo API');
  }
  return { city: data.city, lat: data.latitude, lng: data.longitude };
}

/** Reverse-geocode coordinates to a city name via Nominatim (OSM) */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const { data } = await nominatim.get<NominatimResponse>(
    `/reverse?format=json&lat=${lat}&lon=${lng}`,
  );
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
 *  1. Browser Geolocation API + Nominatim reverse geocode (more accurate)
 *  2. IP-based geolocation (silent, no permission required) as fallback
 *
 * Results are cached in localStorage for 24 hours to avoid repeated lookups.
 * Both external lookups go through `services/httpExternal` so timeouts,
 * dev logging, and HttpError handling match the rest of the app.
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
