/**
 * Dynamic loader for `react-native-maps` and `supercluster`.
 *
 * These packages aren't available in Expo Go, so we wrap the requires in
 * try/catch and expose typed accessors that the screen can use to feature-detect.
 */
import { Platform } from "react-native";

/* eslint-disable @typescript-eslint/no-explicit-any -- dynamic require() for optional native deps */
let MapView: typeof import("react-native-maps").default | null = null;
let MapMarker: typeof import("react-native-maps").MapMarker | null = null;
let MapCircle: typeof import("react-native-maps").Circle | null = null;
let PROVIDER_DEFAULT: any = null;
let PROVIDER_GOOGLE: any = null;
let mapsAvailable = false;
let SuperclusterClass: any = null;

try {
  const maps = require("react-native-maps");
  MapView = maps.default;
  MapMarker = maps.MapMarker;
  MapCircle = maps.Circle;
  PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
  if (Platform.OS === "android") {
    PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
  }
  mapsAvailable = true;
} catch {
  // react-native-maps not available (Expo Go)
}

try {
  const sc = require("supercluster");
  SuperclusterClass = sc.default ?? sc;
} catch {
  // supercluster not available
}

export const HAS_GOOGLE_MAPS_KEY = !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export const nativeMaps = {
  MapView,
  MapMarker,
  MapCircle,
  PROVIDER_DEFAULT,
  PROVIDER_GOOGLE,
  available: mapsAvailable,
};

export const supercluster = {
  Class: SuperclusterClass,
  available: !!SuperclusterClass,
};
/* eslint-enable @typescript-eslint/no-explicit-any */
