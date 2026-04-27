/**
 * Google Maps JSON style that matches the BookSwap dark green theme.
 * Works on both iOS (with Google Maps provider) and Android.
 *
 * Style spec: https://mapstyle.withgoogle.com/
 */
export const darkGreenMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#1a2f23" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#142219" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#8C9C92" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#2d4f3d" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#5A6A60" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#1e352a" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#243f2f" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8C9C92" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#253d2e" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2d4f3d" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#243f2f" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8C9C92" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3a6b4f" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#2d4f3d" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a8b8ae" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#243f2f" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8C9C92" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#142219" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d7a5a" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#142219" }],
  },
];

/**
 * Lighter style for light mode — subtle desaturation with warm tones
 * to complement the golden accent.
 */
export const lightMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#f5f5f0" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#4B5563" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#E5E7EB" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#f0efe8" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#e8e7df" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#dde8d5" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#E5E7EB" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#f5ecd0" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e0d4a8" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#e8e7df" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9ddd6" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
];
