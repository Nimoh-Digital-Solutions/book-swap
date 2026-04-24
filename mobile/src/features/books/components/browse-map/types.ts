export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export const DEFAULT_REGION: MapRegion = {
  latitude: 50.85,
  longitude: 4.35,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export type BookPoint = GeoJSON.Feature<GeoJSON.Point, { bookId: string }>;
export type ClusterOrPoint = GeoJSON.Feature<
  GeoJSON.Point,
  { bookId: string } | { cluster: true; cluster_id: number; point_count: number }
>;
