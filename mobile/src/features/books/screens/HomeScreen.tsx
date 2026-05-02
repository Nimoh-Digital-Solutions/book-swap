import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { BookMarked, MapPin, ScanBarcode } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

import { useQueryClient } from "@tanstack/react-query";
import { useColors, useIsDark } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";
import { ANIMATION } from "@/constants/animation";
import type { HomeStackParamList, MainTabNavigationProp } from "@/navigation/types";
import { useCommunityStats, useMyBooks, useNearbyCount, useRecentBooks } from "../hooks/useBooks";
import { useExchanges } from "@/features/exchanges/hooks/useExchanges";
import { gettingStartedStorage } from "@/lib/storage";

import { HomeCommunitySection } from "../components/home/HomeCommunitySection";
import { HomeGettingStarted } from "../components/home/HomeGettingStarted";
import { HomeNearbyBadge } from "../components/home/HomeNearbyBadge";
import { HomeQuickActions } from "../components/home/HomeQuickActions";
import { HomeRecentlyAdded } from "../components/home/HomeRecentlyAdded";
import { HomeSearchBar } from "../components/home/HomeSearchBar";

type Nav = NativeStackNavigationProp<HomeStackParamList, "Home">;

export function HomeScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const preferredRadius = useAuthStore((s) => s.user?.preferred_radius ?? 5000);
  const profileNeighborhood = useAuthStore((s) => s.user?.neighborhood);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [gpsCity, setGpsCity] = useState("");
  const [locationDenied, setLocationDenied] = useState(false);

  // Prefer the profile neighbourhood (set from settings); fall back to GPS reverse-geocode
  const city = profileNeighborhood || gpsCity;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationDenied(true);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      try {
        const [geo] = await Location.reverseGeocodeAsync(loc.coords);
        if (geo?.city) setGpsCity(geo.city);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const openLocationSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  const locationResolving = !coords && !locationDenied;
  const { data: nearbyData, isError: nearbyError } = useNearbyCount(coords?.lat, coords?.lng, preferredRadius);
  const { data: recentBooks, isLoading: booksLoading, isError: booksError } = useRecentBooks(coords?.lat, coords?.lng, preferredRadius);
  const { data: communityData, isError: communityError } = useCommunityStats(coords?.lat, coords?.lng, preferredRadius);
  const hasQueryError = nearbyError || booksError || communityError;

  const { data: myBooks } = useMyBooks();
  const { data: exchanges } = useExchanges();
  const hasBooks = (myBooks?.length ?? 0) > 0;
  const hasBrowsed = gettingStartedStorage.hasBrowsed();
  const hasExchange = (exchanges?.length ?? 0) > 0;

  const tabNav = navigation.getParent<MainTabNavigationProp>();
  const goToBrowse = useCallback(
    () => tabNav?.navigate("BrowseTab"),
    [tabNav],
  );
  const goToScan = useCallback(
    () => tabNav?.navigate("ScanTab"),
    [tabNav],
  );
  const goToMyBooks = useCallback(
    () => tabNav?.navigate("ProfileTab", { screen: "MyBooks" }),
    [tabNav],
  );

  const goToBookDetail = useCallback(
    (bookId: string) => navigation.navigate('BookDetail', { bookId }),
    [navigation],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        setLocationDenied(false);
        try {
          const [geo] = await Location.reverseGeocodeAsync(loc.coords);
          if (geo?.city) setGpsCity(geo.city);
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["nearbyCount"] }),
      queryClient.invalidateQueries({ queryKey: ["recentBooks"] }),
      queryClient.invalidateQueries({ queryKey: ["communityStats"] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    const tabNavLocal = navigation.getParent<MainTabNavigationProp>();
    tabNavLocal?.navigate("BrowseTab", {
      screen: "BrowseMap",
      params: { initialSearch: searchQuery.trim() },
    });
  }, [searchQuery, navigation]);

  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;

  const quickActions = [
    { icon: ScanBarcode, label: t("home.scan", "Scan"), onPress: goToScan },
    {
      icon: MapPin,
      label: t("home.browseMap", "Browse Map"),
      onPress: goToBrowse,
    },
    {
      icon: BookMarked,
      label: t("home.myBooks", "My Books"),
      onPress: goToMyBooks,
    },
  ];

  return (
    <View
      style={[s.root, { backgroundColor: isDark ? c.auth.bg : c.neutral[50] }]}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={c.auth.golden}
          />
        }
      >
        {locationDenied && (
          <Animated.View
            entering={FadeIn.duration(300).delay(100)}
            style={[
              s.locBanner,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <Text style={[s.locBannerTitle, { color: c.text.primary }]}>
              {t(
                "home.locationDeniedBannerTitle",
                "Location is off",
              )}
            </Text>
            <Text style={[s.locBannerBody, { color: c.text.secondary }]}>
              {t(
                "home.locationDeniedBannerBody",
                "Enable location in Settings to see nearby books, counts, and community activity.",
              )}
            </Text>
            <Pressable
              onPress={openLocationSettings}
              accessibilityRole="button"
              accessibilityLabel={t("home.openSettings", "Open Settings")}
              style={({ pressed }) => [
                s.locBannerBtn,
                { backgroundColor: c.auth.golden, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Text style={s.locBannerBtnText}>
                {t("home.openSettings", "Open Settings")}
              </Text>
            </Pressable>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.duration(250).delay(ANIMATION.stagger.slow * 0)}>
          <HomeNearbyBadge
            userCount={nearbyData?.user_count}
            bookCount={nearbyData?.count}
            city={city}
            locationDenied={locationDenied}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(250).delay(ANIMATION.stagger.slow * 1)}>
          <HomeSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmit={handleSearch}
            placeholder={t(
              "home.searchPlaceholder",
              "Search by title, author, or ISBN...",
            )}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(250).delay(ANIMATION.stagger.slow * 1.5)}>
          <HomeGettingStarted
            hasBooks={hasBooks}
            hasBrowsed={hasBrowsed}
            hasExchange={hasExchange}
            onAddBook={goToScan}
            onBrowse={goToBrowse}
          />
        </Animated.View>

        {hasQueryError && !locationDenied && (
          <Animated.View entering={FadeIn.duration(200)}>
            <Pressable
              onPress={handleRefresh}
              accessibilityRole="button"
              accessibilityLabel={t(
                "home.queryError",
                "Could not load some data. Tap to retry.",
              )}
              style={[s.errorHint, { backgroundColor: c.status.error + '14' }]}
            >
              <Text style={[s.errorHintText, { color: c.status.error }]}>
                {t('home.queryError', 'Could not load some data. Tap to retry.')}
              </Text>
            </Pressable>
          </Animated.View>
        )}

        <Animated.View entering={FadeInUp.duration(250).delay(ANIMATION.stagger.slow * 2)}>
          <HomeQuickActions actions={quickActions} />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(250).delay(ANIMATION.stagger.slow * 3)}>
          <HomeRecentlyAdded
            books={recentBooks ?? []}
            isLoading={booksLoading || locationResolving}
            locationDenied={locationDenied}
            onOpenSettings={openLocationSettings}
            title={t("home.recentlyAdded", "Recently Added")}
            subtitle={t(
              "home.freshArrivals",
              "Fresh arrivals from the community.",
            )}
            viewAllLabel={t("home.viewAll", "View all")}
            onViewAll={goToBrowse}
            onBookPress={goToBookDetail}
            onAddBook={goToScan}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(250).delay(ANIMATION.stagger.slow * 4)}>
          <HomeCommunitySection
            bookCount={nearbyData?.count}
            swapsThisWeek={communityData?.swaps_this_week}
            activityFeed={communityData?.activity_feed}
            communityLabel={t(
              "home.liveCommunity",
              "LIVE COMMUNITY",
            ).toUpperCase()}
            communityTitle={t("home.communityTitle", "Your Neighbourhood")}
            booksAvailableLabel={t(
              "home.booksAvailable",
              "BOOKS AVAILABLE",
            ).toUpperCase()}
            swapsThisWeekLabel={t(
              "home.swapsThisWeek",
              "SWAPS THIS WEEK",
            ).toUpperCase()}
            browseMapLabel={t("home.viewFullMap", "Browse Full Map")}
            onBrowseMap={goToBrowse}
          />
        </Animated.View>

        <View style={s.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 16 },
  bottomSpacer: { height: 20 },
  locBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  locBannerTitle: { fontSize: 16, fontWeight: "700" },
  locBannerBody: { fontSize: 14, lineHeight: 20 },
  locBannerBtn: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  locBannerBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  errorHint: {
    marginHorizontal: 16,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  errorHintText: { fontSize: 13, fontWeight: "600", textAlign: "center" },
});
