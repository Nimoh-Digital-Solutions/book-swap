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
} from "react-native";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
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
import { useBrowseBooks, type BrowseBook } from "@/features/books/hooks/useBooks";
import { GENRE_OPTIONS, DISTANCE_OPTIONS } from "@/features/books/constants";
import { BookCard } from "@/features/books/components/BookCard";
import { SkeletonCard } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import type { BrowseStackParamList } from "@/navigation/types";

let MapView: typeof import("react-native-maps").default | null = null;
let MapMarker: typeof import("react-native-maps").MapMarker | null = null;
let PROVIDER_DEFAULT: any = null;
let mapsAvailable = false;

try {
  const maps = require("react-native-maps");
  MapView = maps.default;
  MapMarker = maps.MapMarker;
  PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
  mapsAvailable = true;
} catch {
  // react-native-maps not available (Expo Go)
}

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};
type Nav = NativeStackNavigationProp<BrowseStackParamList, "BrowseMap">;

const DEFAULT_REGION: Region = {
  latitude: 50.85,
  longitude: 4.35,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

export function BrowseMapScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const c = useColors();
  const isDark = useIsDark();

  const mapRef = useRef<any>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const searchRef = useRef<TextInput>(null);

  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [locationReady, setLocationReady] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedRadius, setSelectedRadius] = useState(5000);
  const [showGenres, setShowGenres] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Get user location
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

  const genreParam = selectedGenres.length > 0 ? selectedGenres.join(",") : undefined;

  const {
    data,
    isLoading,
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

  const books: BrowseBook[] = useMemo(
    () => data?.pages.flatMap((p) => p.results) ?? [],
    [data],
  );

  const handleBookPress = useCallback(
    (bookId: string) => navigation.navigate("BookDetail", { bookId }),
    [navigation],
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

  const hasActiveFilters = selectedGenres.length > 0 || selectedRadius !== 5000;
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;
  const bg = isDark ? c.auth.bg : c.neutral[50];

  // ── Shared UI pieces ──────────────────────────────────────────────

  const renderSearchBar = () => (
    <View style={[s.searchWrap, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <Search size={18} color={c.text.placeholder} />
      <TextInput
        ref={searchRef}
        style={[s.searchInput, { color: c.text.primary }]}
        placeholder={t("browse.searchPlaceholder", "Search books, authors...")}
        placeholderTextColor={c.text.placeholder}
        value={searchText}
        onChangeText={setSearchText}
        returnKeyType="search"
        onSubmitEditing={() => Keyboard.dismiss()}
      />
      {searchText.length > 0 && (
        <Pressable onPress={() => setSearchText("")} hitSlop={8}>
          <X size={16} color={c.text.placeholder} />
        </Pressable>
      )}
    </View>
  );

  const renderFilters = () => (
    <View style={s.filtersSection}>
      {/* Distance chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipRow}
      >
        {DISTANCE_OPTIONS.map((opt) => {
          const active = selectedRadius === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setSelectedRadius(opt.value)}
              style={[
                s.chip,
                {
                  backgroundColor: active ? accent : cardBg,
                  borderColor: active ? accent : cardBorder,
                },
              ]}
            >
              <MapPin size={12} color={active ? "#fff" : c.text.secondary} />
              <Text
                style={[
                  s.chipText,
                  { color: active ? "#fff" : c.text.primary },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}

        <View style={[s.chipDivider, { backgroundColor: cardBorder }]} />

        <Pressable
          onPress={() => setShowGenres((v) => !v)}
          style={[
            s.chip,
            {
              backgroundColor: selectedGenres.length > 0 ? accent : cardBg,
              borderColor: selectedGenres.length > 0 ? accent : cardBorder,
            },
          ]}
        >
          <SlidersHorizontal
            size={12}
            color={selectedGenres.length > 0 ? "#fff" : c.text.secondary}
          />
          <Text
            style={[
              s.chipText,
              {
                color: selectedGenres.length > 0 ? "#fff" : c.text.primary,
              },
            ]}
          >
            {selectedGenres.length > 0
              ? `Genres (${selectedGenres.length})`
              : "Genres"}
          </Text>
        </Pressable>

        {hasActiveFilters && (
          <Pressable onPress={clearFilters} style={[s.chip, { borderColor: cardBorder }]}>
            <X size={12} color={c.text.secondary} />
            <Text style={[s.chipText, { color: c.text.secondary }]}>Clear</Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Genre expansion */}
      {showGenres && (
        <View style={s.genreWrap}>
          {GENRE_OPTIONS.map((g) => {
            const active = selectedGenres.includes(g);
            return (
              <Pressable
                key={g}
                onPress={() => toggleGenre(g)}
                style={[
                  s.genreChip,
                  {
                    backgroundColor: active ? accent + "20" : cardBg,
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
                  {g}
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
            ? t("browse.tryDifferentFilters", "Try adjusting your search or filters.")
            : t("browse.noBooksNearby", "No books available in this area yet.")
        }
        compact
      />
    );
  };

  const resultCount = books.length;

  // ── Full-screen list fallback (Expo Go) ──────────────────────────
  if (!mapsAvailable || !MapView) {
    return (
      <View style={[s.root, { backgroundColor: bg }]}>
        <View style={s.listHeader}>
          {renderSearchBar()}
          {renderFilters()}
          {!isLoading && resultCount > 0 && (
            <Text style={[s.resultCount, { color: c.text.secondary }]}>
              {resultCount} book{resultCount !== 1 ? "s" : ""} nearby
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

  const snapPoints = useMemo(() => ["15%", "45%", "85%"], []);

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <MapView
        ref={mapRef}
        style={s.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {books.map((book) => {
          const coords = (book as any).location?.coordinates;
          if (!coords) return null;
          return MapMarker ? (
            <MapMarker
              key={book.id}
              coordinate={{ latitude: coords[1], longitude: coords[0] }}
              title={book.title}
              description={book.author}
              onCalloutPress={() => handleBookPress(book.id)}
            />
          ) : null;
        })}
      </MapView>

      {/* Recenter FAB */}
      <Pressable
        style={[s.recenterBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
        onPress={recenterMap}
        hitSlop={8}
      >
        <Navigation size={20} color={accent} />
      </Pressable>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        backgroundStyle={[s.sheetBg, { backgroundColor: bg }]}
        handleIndicatorStyle={{ backgroundColor: cardBorder, width: 40 }}
        enablePanDownToClose={false}
      >
        <View style={s.sheetContent}>
          {renderSearchBar()}
          {renderFilters()}

          {!isLoading && resultCount > 0 && (
            <Text style={[s.resultCount, { color: c.text.secondary }]}>
              {resultCount} book{resultCount !== 1 ? "s" : ""} nearby
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

  // ── Search bar ──
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

  // ── Filter chips ──
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

  // ── Genre grid ──
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

  // ── Result count ──
  resultCount: {
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },

  // ── Bottom sheet ──
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
    paddingBottom: 120,
    gap: spacing.sm,
  },

  // ── Recenter button ──
  recenterBtn: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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

  // ── Full-screen list (Expo Go fallback) ──
  listHeader: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 120,
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
});
