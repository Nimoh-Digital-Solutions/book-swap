import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { BookMarked, MapPin, ScanBarcode } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

import { useColors, useIsDark } from "@/hooks/useColors";
import type { HomeStackParamList } from "@/navigation/types";
import { useNearbyCount } from "../hooks/useBooks";
import { MOCK_BOOKS } from "../data/mockBooks";

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
  const [searchQuery, setSearchQuery] = useState("");
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

  const { data: nearbyData } = useNearbyCount(coords?.lat, coords?.lng);

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

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    goToBrowse();
  }, [searchQuery, goToBrowse]);

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
      >
        <HomeNearbyBadge
          userCount={nearbyData?.user_count}
          city={city}
          label={t("home.activeSwappers", "Active Swappers")}
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
          books={MOCK_BOOKS}
          title={t("home.recentlyAdded", "Recently Added")}
          subtitle={t(
            "home.freshArrivals",
            "Fresh arrivals from the community.",
          )}
          viewAllLabel={t("home.viewAll", "View all")}
          onViewAll={goToBrowse}
          onBookPress={goToBookDetail}
        />

        <HomeCommunitySection
          bookCount={nearbyData?.count}
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
  bottomSpacer: { height: 100 },
});
