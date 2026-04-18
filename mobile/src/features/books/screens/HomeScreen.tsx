import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { BookMarked, MapPin, ScanBarcode } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { useColors, useIsDark } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";
import type { HomeStackParamList } from "@/navigation/types";
import { useCommunityStats, useNearbyCount, useRecentBooks } from "../hooks/useBooks";

import { HomeCommunitySection } from "../components/home/HomeCommunitySection";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [city, setCity] = useState("");

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      try {
        const [geo] = await Location.reverseGeocodeAsync(loc.coords);
        if (geo?.city) setCity(geo.city);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const { data: nearbyData } = useNearbyCount(coords?.lat, coords?.lng, preferredRadius);
  const { data: recentBooks, isLoading: booksLoading } = useRecentBooks(coords?.lat, coords?.lng, preferredRadius);
  const { data: communityData } = useCommunityStats(coords?.lat, coords?.lng, preferredRadius);

  const tabNav = navigation.getParent();
  const goToBrowse = useCallback(
    () => (tabNav as any)?.navigate("BrowseTab"),
    [tabNav],
  );
  const goToScan = useCallback(
    () => (tabNav as any)?.navigate("ScanTab"),
    [tabNav],
  );
  const goToMyBooks = useCallback(
    () => (tabNav as any)?.navigate("ProfileTab", { screen: "MyBooks" }),
    [tabNav],
  );

  const goToBookDetail = useCallback(
    (bookId: string) => navigation.navigate('BookDetail', { bookId }),
    [navigation],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["nearbyCount"] }),
      queryClient.invalidateQueries({ queryKey: ["recentBooks"] }),
      queryClient.invalidateQueries({ queryKey: ["communityStats"] }),
    ]);
    setRefreshing(false);
  }, [queryClient]);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    const tabNav = navigation.getParent();
    (tabNav as any)?.navigate("BrowseTab", {
      screen: "BrowseMap",
      params: { initialSearch: searchQuery.trim() },
    });
  }, [searchQuery, navigation]);

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
        <HomeNearbyBadge
          userCount={nearbyData?.user_count}
          bookCount={nearbyData?.count}
          city={city}
        />

        <HomeSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSearch}
          placeholder={t(
            "home.searchPlaceholder",
            "Search by title, author, or ISBN...",
          )}
        />

        <HomeQuickActions actions={quickActions} />

        <HomeRecentlyAdded
          books={recentBooks ?? []}
          isLoading={booksLoading}
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

        <View style={s.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 16 },
  bottomSpacer: { height: 20 },
});
