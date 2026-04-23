import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  FlatList,
  Platform,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import {
  Search,
  X,
  Navigation,
  MapPin,
  BookOpen,
  SlidersHorizontal,
} from "lucide-react-native";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";

import { useColors, useIsDark } from "@/hooks/useColors";
import { spacing, radius as themeRadius } from "@/constants/theme";
import { darkGreenMapStyle, lightMapStyle } from "@/constants/mapStyle";
import { useBrowseBooks, useRadiusCounts, type BrowseBook } from "@/features/books/hooks/useBooks";
import {
  GENRE_VALUES,
  GENRE_VALUE_TO_I18N_KEY,
  type GenreValue,
  DISTANCE_OPTIONS,
} from "@/features/books/constants";
import { BookCard } from "@/features/books/components/BookCard";
import { BookMapMarker } from "@/features/books/components/BookMapMarker";
import { SkeletonCard } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import type { BrowseStackParamList } from "@/navigation/types";

let MapView: typeof import("react-native-maps").default | null = null;
let MapMarker: typeof import("react-native-maps").MapMarker | null = null;
let MapCircle: typeof import("react-native-maps").Circle | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic require() for optional native maps
let PROVIDER_DEFAULT: any = null; // eslint-disable-line
let PROVIDER_GOOGLE: any = null; // eslint-disable-line
let mapsAvailable = false;
let SuperclusterClass: any = null; // eslint-disable-line

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

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};
type Nav = NativeStackNavigationProp<BrowseStackParamList, "BrowseMap">;

type BookPoint = GeoJSON.Feature<GeoJSON.Point, { bookId: string }>;
type ClusterOrPoint = GeoJSON.Feature<
  GeoJSON.Point,
  { bookId: string } | { cluster: true; cluster_id: number; point_count: number }
>;

const DEFAULT_REGION: Region = {
  latitude: 50.85,
  longitude: 4.35,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

const hasGoogleMapsKey = !!process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

type BrowseRoute = RouteProp<import('@/navigation/types').BrowseStackParamList, 'BrowseMap'>;

export function BrowseMapScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<BrowseRoute>();
  const c = useColors();
  const isDark = useIsDark();

  const mapRef = useRef<any>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const searchRef = useRef<TextInput>(null);

  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [locationReady, setLocationReady] = useState(false);

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

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        const userRegion: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(userRegion);
        if (mapsAvailable) {
          mapRef.current?.animateToRegion(userRegion, 500);
        }
      }
      setLocationReady(true);
    })();
  }, []);

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

  // ── Supercluster ────────────────────────────────────────────────
  const clusterIndex = useMemo(() => {
    if (!SuperclusterClass) return null;
    const index = new SuperclusterClass({
      radius: 60,
      maxZoom: 16,
    });

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
    if (!clusterIndex || !region) return [];
    const bbox: GeoJSON.BBox = [
      region.longitude - region.longitudeDelta / 2,
      region.latitude - region.latitudeDelta / 2,
      region.longitude + region.longitudeDelta / 2,
      region.latitude + region.latitudeDelta / 2,
    ];
    const zoom = Math.round(
      Math.log2(360 / region.longitudeDelta) + 1,
    );
    return clusterIndex.getClusters(bbox, zoom);
  }, [clusterIndex, region]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleBookPress = useCallback(
    (bookId: string) => navigation.navigate("BookDetail", { bookId }),
    [navigation],
  );

  const handleClusterPress = useCallback(
    (cluster: ClusterOrPoint) => {
      if (!clusterIndex || !("cluster" in cluster.properties) || !cluster.properties.cluster) return;
      const expansionZoom = clusterIndex.getClusterExpansionZoom(
        cluster.properties.cluster_id as number,
      );
      const [lng, lat] = cluster.geometry.coordinates;
      const delta = 360 / Math.pow(2, expansionZoom + 1);
      mapRef.current?.animateToRegion(
        { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta },
        400,
      );
    },
    [clusterIndex],
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchText("");
    setSelectedGenres([]);
    setSelectedRadius(5000);
    setShowGenres(false);
  }, []);

  const recenterMap = useCallback(async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return;
    const loc = await Location.getCurrentPositionAsync({});
    const newRegion: Region = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 500);
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

  const renderLoadErrorBanner = () => {
    if (!mapDataError) return null;
    return (
      <View
        style={[
          s.loadErrorBanner,
          { backgroundColor: cardBg, borderColor: c.status.error },
        ]}
      >
        <Text style={[s.loadErrorTitle, { color: c.text.primary }]}>
          {t("browse.loadErrorTitle", "Could not load map data")}
        </Text>
        <Text style={[s.loadErrorBody, { color: c.text.secondary }]}>
          {t("browse.loadErrorBody", "Check your connection and try again.")}
        </Text>
        <Pressable
          onPress={handleRetryMapData}
          disabled={retryMapDataBusy}
          style={({ pressed }) => [
            s.loadErrorRetry,
            {
              backgroundColor: accent,
              opacity: retryMapDataBusy || pressed ? 0.85 : 1,
            },
          ]}
        >
          {retryMapDataBusy ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.loadErrorRetryText}>
              {t("common.retry", "Retry")}
            </Text>
          )}
        </Pressable>
      </View>
    );
  };

  const mapStyle = useMemo(
    () => (isDark ? darkGreenMapStyle : lightMapStyle),
    [isDark],
  );
  // Google Maps on Android (API key required), Apple Maps on iOS (native, no key needed)
  const useGoogleProvider =
    hasGoogleMapsKey && Platform.OS === "android";

  // ── Shared UI pieces ─────────────────────────────────────────────

  const renderSearchBar = () => (
    <View
      style={[
        s.searchWrap,
        { backgroundColor: cardBg, borderColor: cardBorder },
      ]}
    >
      <Search size={18} color={c.text.placeholder} />
      <TextInput
        ref={searchRef}
        style={[s.searchInput, { color: c.text.primary }]}
        placeholder={t(
          "browse.searchPlaceholder",
          "Search books, authors...",
        )}
        placeholderTextColor={c.text.placeholder}
        value={searchText}
        onChangeText={setSearchText}
        returnKeyType="search"
        onSubmitEditing={() => Keyboard.dismiss()}
        accessibilityLabel={t(
          "browse.searchPlaceholder",
          "Search books, authors...",
        )}
      />
      {searchText.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("browse.clearSearchA11y", "Clear search")}
          onPress={() => setSearchText("")}
          hitSlop={8}
        >
          <X size={16} color={c.text.placeholder} />
        </Pressable>
      )}
    </View>
  );

  const renderFilters = () => (
    <View style={s.filtersSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipRow}
      >
        {DISTANCE_OPTIONS.map((opt) => {
          const active = selectedRadius === opt.value;
          const count = radiusCounts?.[String(opt.value)];
          const radiusLabel = t("browse.distanceKm", "{{count}} km", { count: opt.km });
          return (
            <Pressable
              key={opt.value}
              accessibilityRole="button"
              accessibilityLabel={
                count != null
                  ? `${radiusLabel} search radius, ${count} books nearby`
                  : `${radiusLabel} search radius`
              }
              accessibilityState={{ selected: active }}
              onPress={() => setSelectedRadius(opt.value)}
              style={[
                s.chip,
                {
                  backgroundColor: active ? accent : cardBg,
                  borderColor: active ? accent : cardBorder,
                },
              ]}
            >
              <MapPin
                size={12}
                color={active ? "#fff" : c.text.secondary}
              />
              <Text
                style={[
                  s.chipText,
                  { color: active ? "#fff" : c.text.primary },
                ]}
              >
                {radiusLabel}
                {count != null && (
                  <Text
                    style={{
                      color: active ? "rgba(255,255,255,0.7)" : c.text.placeholder,
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    {` (${count})`}
                  </Text>
                )}
              </Text>
            </Pressable>
          );
        })}

        <View
          style={[s.chipDivider, { backgroundColor: cardBorder }]}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            showGenres
              ? t("browse.genresFilterCloseA11y", "Hide genre filters")
              : t("browse.genresFilterOpenA11y", "Show genre filters")
          }
          accessibilityState={{ expanded: showGenres }}
          onPress={() => setShowGenres((v) => !v)}
          style={[
            s.chip,
            {
              backgroundColor:
                selectedGenres.length > 0 ? accent : cardBg,
              borderColor:
                selectedGenres.length > 0 ? accent : cardBorder,
            },
          ]}
        >
          <SlidersHorizontal
            size={12}
            color={
              selectedGenres.length > 0 ? "#fff" : c.text.secondary
            }
          />
          <Text
            style={[
              s.chipText,
              {
                color:
                  selectedGenres.length > 0
                    ? "#fff"
                    : c.text.primary,
              },
            ]}
          >
            {selectedGenres.length > 0
              ? t("browse.genreFilterSelected", "Genres ({{count}})", {
                  count: selectedGenres.length,
                })
              : t("browse.genreFilter", "Genres")}
          </Text>
        </Pressable>

        {hasActiveFilters && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("browse.clearFiltersA11y", "Clear filters")}
            onPress={clearFilters}
            style={[s.chip, { borderColor: cardBorder }]}
          >
            <X size={12} color={c.text.secondary} />
            <Text style={[s.chipText, { color: c.text.secondary }]}>
              {t("browse.clearFilters", "Clear")}
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {showGenres && (
        <View style={s.genreWrap}>
          {GENRE_VALUES.map((g) => {
            const active = selectedGenres.includes(g);
            const slug = GENRE_VALUE_TO_I18N_KEY[g as GenreValue];
            const genreLabel = t(`books.genres.${slug}`, g);
            return (
              <Pressable
                key={g}
                accessibilityRole="button"
                accessibilityLabel={t("browse.genreToggleA11y", "Genre {{genre}}", { genre: genreLabel })}
                accessibilityState={{ selected: active }}
                onPress={() => toggleGenre(g)}
                style={[
                  s.genreChip,
                  {
                    backgroundColor: active
                      ? accent + "20"
                      : cardBg,
                    borderColor: active ? accent : cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    s.genreChipText,
                    { color: active ? accent : c.text.primary },
                  ]}
                >
                  {genreLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );

  const renderBookItem = useCallback(
    ({ item }: { item: BrowseBook }) => (
      <View style={s.bookItemWrap}>
        <BookCard book={item} onPress={() => handleBookPress(item.id)} />
      </View>
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
      ? t("browse.booksNearbyOne", "{{count}} book nearby", { count: resultCount })
      : t("browse.booksNearbyOther", "{{count}} books nearby", { count: resultCount });

  // Android requires a Google Maps API key — fall back to list view without one
  const mapUsable =
    mapsAvailable && MapView && (Platform.OS !== "android" || hasGoogleMapsKey);

  const snapPoints = useMemo(() => ["15%", "45%", "85%"], []);

  if (!mapUsable) {
    return (
      <View style={[s.root, { backgroundColor: bg }]}>
        <View style={s.listHeader}>
          {renderLoadErrorBanner()}
          {renderSearchBar()}
          {renderFilters()}
          {!isLoading && resultCount > 0 && (
            <Text style={[s.resultCount, { color: c.text.secondary }]}>
              {booksNearbyLabel}
            </Text>
          )}
        </View>
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

  // ── Map + Bottom Sheet ───────────────────────────────────────────

  const ResolvedMapView = MapView!;

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <ResolvedMapView
        ref={mapRef}
        style={s.map}
        provider={useGoogleProvider ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={useGoogleProvider ? mapStyle : undefined}
      >
        {/* Radius circle indicator */}
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

        {/* Clustered book markers */}
        {clusters.map((feature) => {
          const lng = feature.geometry.coordinates[0] ?? 0;
          const lat = feature.geometry.coordinates[1] ?? 0;
          const isCluster =
            "cluster" in feature.properties &&
            feature.properties.cluster;
          const props = feature.properties;
          const key = isCluster
            ? `cluster-${'cluster_id' in props ? props.cluster_id : ''}`
            : `book-${'bookId' in props ? props.bookId : ''}`;
          const count = isCluster && 'point_count' in props
            ? props.point_count
            : undefined;

          return MapMarker ? (
            <MapMarker
              key={key}
              coordinate={{ latitude: lat, longitude: lng }}
              tracksViewChanges={false}
              onPress={() => {
                if (isCluster) {
                  handleClusterPress(feature);
                } else if ('bookId' in props) {
                  handleBookPress(props.bookId);
                }
              }}
            >
              <BookMapMarker count={count} />
            </MapMarker>
          ) : null;
        })}
      </ResolvedMapView>

      {/* Map controls */}
      <View style={[s.mapControls, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("browse.mapZoomInA11y", "Zoom in map")}
          style={s.mapControlBtn}
          onPress={() => {
            const newRegion = {
              ...region,
              latitudeDelta: region.latitudeDelta / 2,
              longitudeDelta: region.longitudeDelta / 2,
            };
            mapRef.current?.animateToRegion(newRegion, 300);
          }}
          hitSlop={4}
        >
          <Text style={[s.mapControlIcon, { color: accent }]}>+</Text>
        </Pressable>
        <View style={[s.mapControlDivider, { backgroundColor: cardBorder }]} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("browse.mapZoomOutA11y", "Zoom out map")}
          style={s.mapControlBtn}
          onPress={() => {
            const newRegion = {
              ...region,
              latitudeDelta: Math.min(region.latitudeDelta * 2, 120),
              longitudeDelta: Math.min(region.longitudeDelta * 2, 120),
            };
            mapRef.current?.animateToRegion(newRegion, 300);
          }}
          hitSlop={4}
        >
          <Text style={[s.mapControlIcon, { color: accent }]}>{"\u2212"}</Text>
        </Pressable>
        <View style={[s.mapControlDivider, { backgroundColor: cardBorder }]} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("browse.mapRecenterA11y", "Center map on my location")}
          style={s.mapControlBtn}
          onPress={recenterMap}
          hitSlop={4}
        >
          <Navigation size={18} color={accent} />
        </Pressable>
      </View>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        backgroundStyle={[s.sheetBg, { backgroundColor: bg }]}
        handleIndicatorStyle={{
          backgroundColor: cardBorder,
          width: 40,
        }}
        enablePanDownToClose={false}
      >
        <View style={s.sheetContent}>
          {renderLoadErrorBanner()}
          {renderSearchBar()}
          {renderFilters()}

          {!isLoading && resultCount > 0 && (
            <Text
              style={[s.resultCount, { color: c.text.secondary }]}
            >
              {booksNearbyLabel}
            </Text>
          )}
        </View>

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

const s = StyleSheet.create({
  root: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.select({ ios: 12, android: 8 }),
    borderRadius: themeRadius.pill,
    borderWidth: 1,
    marginHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },

  filtersSection: {
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 7,
    borderRadius: themeRadius.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  chipDivider: {
    width: 1,
    height: 24,
    alignSelf: "center",
    marginHorizontal: 2,
  },

  genreWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  genreChip: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: themeRadius.pill,
    borderWidth: 1,
  },
  genreChipText: {
    fontSize: 12,
    fontWeight: "500",
  },

  resultCount: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },

  sheetBg: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  sheetContent: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  sheetListContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 20,
    gap: spacing.sm,
  },

  mapControls: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    borderRadius: themeRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  mapControlBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  mapControlIcon: {
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 24,
  },
  mapControlDivider: {
    height: StyleSheet.hairlineWidth,
    width: "100%" as any,
  },

  listHeader: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 20,
    gap: spacing.sm,
  },

  bookItemWrap: {},

  skeletonWrap: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingTop: spacing.md,
  },

  footerLoader: {
    paddingTop: spacing.sm,
  },
  loadErrorBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: themeRadius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  loadErrorTitle: { fontSize: 15, fontWeight: "700" },
  loadErrorBody: { fontSize: 13, lineHeight: 18 },
  loadErrorRetry: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: themeRadius.pill,
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  loadErrorRetryText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  emptyAfterError: { minHeight: 48 },
});
