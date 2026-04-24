import { useMemo } from "react";

import { supercluster } from "../components/browse-map/mapsLoader";
import type {
  BookPoint,
  ClusterOrPoint,
  MapRegion,
} from "../components/browse-map/types";
import type { BrowseBook } from "./useBooks";

interface UseMapClustersResult {
  clusters: ClusterOrPoint[];
  /** Returns the map region (delta) the caller should animate to in order to
   *  expand a tapped cluster. */
  expandCluster: (cluster: ClusterOrPoint) => MapRegion | null;
}

export function useMapClusters(
  books: BrowseBook[],
  region: MapRegion,
): UseMapClustersResult {
  const clusterIndex = useMemo(() => {
    if (!supercluster.Class) return null;
    const Index = supercluster.Class;
    const index = new Index({ radius: 60, maxZoom: 16 });

    const points: BookPoint[] = books
      .filter((b) => b.location?.coordinates)
      .map((b) => ({
        type: "Feature" as const,
        properties: { bookId: b.id },
        geometry: {
          type: "Point" as const,
          coordinates: [
            b.location!.coordinates[0],
            b.location!.coordinates[1],
          ],
        },
      }));

    index.load(points);
    return index;
  }, [books]);

  const clusters = useMemo<ClusterOrPoint[]>(() => {
    if (!clusterIndex) return [];
    const bbox: GeoJSON.BBox = [
      region.longitude - region.longitudeDelta / 2,
      region.latitude - region.latitudeDelta / 2,
      region.longitude + region.longitudeDelta / 2,
      region.latitude + region.latitudeDelta / 2,
    ];
    const zoom = Math.round(Math.log2(360 / region.longitudeDelta) + 1);
    return clusterIndex.getClusters(bbox, zoom);
  }, [clusterIndex, region]);

  const expandCluster = (cluster: ClusterOrPoint): MapRegion | null => {
    if (
      !clusterIndex ||
      !("cluster" in cluster.properties) ||
      !cluster.properties.cluster
    ) {
      return null;
    }
    const expansionZoom = clusterIndex.getClusterExpansionZoom(
      cluster.properties.cluster_id as number,
    );
    const lng = cluster.geometry.coordinates[0] ?? 0;
    const lat = cluster.geometry.coordinates[1] ?? 0;
    const delta = 360 / Math.pow(2, expansionZoom + 1);
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: delta,
      longitudeDelta: delta,
    };
  };

  return { clusters, expandCluster };
}
