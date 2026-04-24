import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { BookOpen } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Platform, Text, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { SkeletonCard } from "@/components/Skeleton";
import { darkGreenMapStyle, lightMapStyle } from "@/constants/mapStyle";
import {
  useBrowseBooks,
  useRadiusCounts,
  type BrowseBook,
} from "@/features/books/hooks/useBooks";
import { useColors, useIsDark } from "@/hooks/useColors";
import type { BrowseStackParamList } from "@/navigation/types";

import { BookMapMarker } from "../components/BookMapMarker";
import {
  BookListItem,
  HAS_GOOGLE_MAPS_KEY,
  MapControls,
  MapFilters,
  MapLoadErrorBanner,
  MapSearchBar,
  browseMapStyles as s,
  nativeMaps,
  type ClusterOrPoint,
  type MapRegion,
} from "../components/browse-map";
import { useMapClusters } from "../hooks/useMapClusters";
import { useUserLocation } from "../hooks/useUserLocation";

type Nav = NativeStackNavigationProp<BrowseStackParamList, "BrowseMap">;
type BrowseRoute = RouteProp<BrowseStackParamList, "BrowseMap">;

const SHEET_SNAP_POINTS: (string | number)[] = ["15%", "45%", "85%"];

export function BrowseMapScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<BrowseRoute>();
  const c = useColors();
  const isDark = useIsDark();

  const bottomSheetRef = useRef<BottomSheet>(null);

  const { region, setRegion, mapRef, recenterMap } = useUserLocation({
    mapAvailable: nativeMaps.available,
  });

  const initialSearch = route.params?.initialSearch ?? "";
  const [searchText, setSearchText] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedRadius, setSelectedRadius] = useState(5000);
  const [showGenres, setShowGenres] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  const genreParam =
    selectedGenres.length > 0 ? selectedGenres.join(",") : undefined;

  const {
    data,
    isLoading,
    isError: browseQueryError,
    refetch: refetchBrowse,
    isRefetching: browseRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBrowseBooks({
    lat: region.latitude,
    lng: region.longitude,
    radius: selectedRadius,
    search: debouncedSearch || undefined,
    genre: genreParam,
  });

  const {
    data: radiusData,
    isError: radiusQueryError,
    refetch: refetchRadius,
    isFetching: radiusRefetching,
  } = useRadiusCounts(region.latitude, region.longitude);
  const radiusCounts = radiusData?.counts;

  const books: BrowseBook[] = useMemo(
    () => data?.pages.flatMap((p) => p.results) ?? [],
    [data],
  );

  const { clusters, expandCluster } = useMapClusters(books, region);

  const handleBookPress = useCallback(
    (bookId: string) => navigation.navigate("BookDetail", { bookId }),
    [navigation],
  );

  const handleClusterPress = useCallback(
    (cluster: ClusterOrPoint) => {
      const target = expandCluster(cluster);
      if (target) {
        mapRef.current?.animateToRegion?.(target, 400);
      }
    },
    [expandCluster, mapRef],
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchText("");
    setSelectedGenres([]);
    setSelectedRadius(5000);
    setShowGenres(false);
  }, []);

  const hasActiveFilters =
    selectedGenres.length > 0 || selectedRadius !== 5000;

  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;
  const bg = isDark ? c.auth.bg : c.neutral[50];

  const mapDataError = browseQueryError || radiusQueryError;
  const retryMapDataBusy = browseRefetching || radiusRefetching;

  const handleRetryMapData = useCallback(() => {
    void refetchBrowse();
    void refetchRadius();
  }, [refetchBrowse, refetchRadius]);

  const mapStyle = useMemo(
    () => (isDark ? darkGreenMapStyle : lightMapStyle),
    [isDark],
  );
  const useGoogleProvider = HAS_GOOGLE_MAPS_KEY && Platform.OS === "android";

  const handleZoomIn = useCallback(() => {
    const newRegion: MapRegion = {
      ...region,
      latitudeDelta: region.latitudeDelta / 2,
      longitudeDelta: region.longitudeDelta / 2,
    };
    mapRef.current?.animateToRegion?.(newRegion, 300);
  }, [region, mapRef]);

  const handleZoomOut = useCallback(() => {
    const newRegion: MapRegion = {
      ...region,
      latitudeDelta: Math.min(region.latitudeDelta * 2, 120),
      longitudeDelta: Math.min(region.longitudeDelta * 2, 120),
    };
    mapRef.current?.animateToRegion?.(newRegion, 300);
  }, [region, mapRef]);

  const renderBookItem = useCallback(
    ({ item }: { item: BrowseBook }) => (
      <BookListItem book={item} onPress={handleBookPress} />
    ),
    [handleBookPress],
  );

  const renderListFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={s.footerLoader}>
          <SkeletonCard />
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (browseQueryError) {
      return <View style={s.emptyAfterError} />;
    }
    if (isLoading) {
      return (
        <View style={s.skeletonWrap}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      );
    }
    return (
      <EmptyState
        icon={BookOpen}
        title={t("browse.noBooks", "No books found")}
        subtitle={
          hasActiveFilters || debouncedSearch
            ? t(
                "browse.tryDifferentFilters",
                "Try adjusting your search or filters.",
              )
            : t(
                "browse.noBooksNearby",
                "No books available in this area yet.",
              )
        }
        compact
      />
    );
  };

  const resultCount = books.length;
  const booksNearbyLabel =
    resultCount === 1
      ? t("browse.booksNearbyOne", "{{count}} book nearby", {
          count: resultCount,
        })
      : t("browse.booksNearbyOther", "{{count}} books nearby", {
          count: resultCount,
        });

  // Android requires a Google Maps API key — fall back to list view without one
  const mapUsable =
    nativeMaps.available &&
    nativeMaps.MapView &&
    (Platform.OS !== "android" || HAS_GOOGLE_MAPS_KEY);

  const renderHeaderControls = () => (
    <>
      {mapDataError && (
        <MapLoadErrorBanner
          cardBg={cardBg}
          accent={accent}
          onRetry={handleRetryMapData}
          busy={retryMapDataBusy}
        />
      )}
      <MapSearchBar
        value={searchText}
        onChange={setSearchText}
        cardBg={cardBg}
        cardBorderColor={cardBorder}
      />
      <MapFilters
        selectedRadius={selectedRadius}
        onSelectRadius={setSelectedRadius}
        selectedGenres={selectedGenres}
        onToggleGenre={toggleGenre}
        showGenres={showGenres}
        onToggleGenreList={() => setShowGenres((v) => !v)}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        radiusCounts={radiusCounts}
        cardBg={cardBg}
        cardBorderColor={cardBorder}
        accent={accent}
      />
      {!isLoading && resultCount > 0 && (
        <Text style={[s.resultCount, { color: c.text.secondary }]}>
          {booksNearbyLabel}
        </Text>
      )}
    </>
  );

  if (!mapUsable) {
    return (
      <View style={[s.root, { backgroundColor: bg }]}>
        <View style={s.listHeader}>{renderHeaderControls()}</View>
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          renderItem={renderBookItem}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderListFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  const ResolvedMapView = nativeMaps.MapView!;
  const { MapMarker, MapCircle, PROVIDER_DEFAULT, PROVIDER_GOOGLE } = nativeMaps;

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <ResolvedMapView
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mapRef shape is normalised across native/Expo Go variants
        ref={mapRef as any}
        style={s.map}
        provider={useGoogleProvider ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={useGoogleProvider ? mapStyle : undefined}
      >
        {MapCircle && (
          <MapCircle
            center={{
              latitude: region.latitude,
              longitude: region.longitude,
            }}
            radius={selectedRadius}
            strokeColor={accent + "80"}
            fillColor={accent + "12"}
            strokeWidth={1.5}
          />
        )}

        {clusters.map((feature) => {
          const lng = feature.geometry.coordinates[0] ?? 0;
          const lat = feature.geometry.coordinates[1] ?? 0;
          const isCluster =
            "cluster" in feature.properties && feature.properties.cluster;
          const props = feature.properties;
          const key = isCluster
            ? `cluster-${"cluster_id" in props ? props.cluster_id : ""}`
            : `book-${"bookId" in props ? props.bookId : ""}`;
          const count =
            isCluster && "point_count" in props ? props.point_count : undefined;

          return MapMarker ? (
            <MapMarker
              key={key}
              coordinate={{ latitude: lat, longitude: lng }}
              tracksViewChanges={false}
              onPress={() => {
                if (isCluster) {
                  handleClusterPress(feature);
                } else if ("bookId" in props) {
                  handleBookPress(props.bookId);
                }
              }}
            >
              <BookMapMarker count={count} />
            </MapMarker>
          ) : null;
        })}
      </ResolvedMapView>

      <MapControls
        cardBg={cardBg}
        cardBorderColor={cardBorder}
        accent={accent}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onRecenter={recenterMap}
      />

      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={SHEET_SNAP_POINTS}
        backgroundStyle={[s.sheetBg, { backgroundColor: bg }]}
        handleIndicatorStyle={{ backgroundColor: cardBorder, width: 40 }}
        enablePanDownToClose={false}
      >
        <View style={s.sheetContent}>{renderHeaderControls()}</View>

        <BottomSheetFlatList
          data={books}
          keyExtractor={(item) => item.id}
          renderItem={renderBookItem}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderListFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={s.sheetListContent}
          showsVerticalScrollIndicator={false}
        />
      </BottomSheet>
    </View>
  );
}
