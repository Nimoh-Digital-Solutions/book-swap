import { BookOpen, MapPin, Users } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

import { radius, spacing } from "@/constants/theme";
import { useColors, useIsDark } from "@/hooks/useColors";

interface Props {
  userCount?: number;
  bookCount?: number;
  city: string;
  /** When set, skip loading skeletons and show placeholders (no location-based data). */
  locationDenied?: boolean;
}

export function HomeNearbyBadge({ userCount, bookCount, city, locationDenied }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();

  const pillBg = isDark ? c.auth.bgDeep : c.auth.golden + '14';
  const pillBorder = isDark ? c.auth.cardBorder : c.auth.golden + '30';
  const accent = c.auth.golden;
  const textColor = isDark ? c.auth.golden : c.text.primary;

  const labelColor = isDark ? c.text.secondary : c.auth.goldenDark;
  const loading =
    !locationDenied && userCount == null && !city && bookCount == null;
  const offLabel = t('home.locationUnavailable', '—');

  return (
    <View style={s.row}>
      {/* Swappers */}
      <View
        style={[
          s.pill,
          { backgroundColor: pillBg, borderColor: pillBorder },
        ]}
      >
        <Users size={14} color={accent} />
        {locationDenied ? (
          <Text style={[s.pillText, { color: labelColor }]} numberOfLines={1}>
            {offLabel}
          </Text>
        ) : userCount != null ? (
          <Text style={[s.pillText, { color: textColor }]}>
            {userCount}{" "}
            <Text style={[s.pillLabel, { color: labelColor }]}>
              {t("home.nearbySwappers", "Swappers")}
            </Text>
          </Text>
        ) : (
          <View style={[s.skeleton, { backgroundColor: pillBorder }]} />
        )}
      </View>

      {/* Location */}
      <View
        style={[
          s.pill,
          { backgroundColor: pillBg, borderColor: pillBorder },
        ]}
      >
        <MapPin size={14} color={accent} />
        {locationDenied ? (
          <Text style={[s.pillText, { color: labelColor }]} numberOfLines={1}>
            {offLabel}
          </Text>
        ) : city ? (
          <Text style={[s.pillText, { color: labelColor }]} numberOfLines={1}>
            {city}
          </Text>
        ) : (
          <View style={[s.skeleton, { backgroundColor: pillBorder }]} />
        )}
      </View>

      {/* Books */}
      <View
        style={[
          s.pill,
          { backgroundColor: pillBg, borderColor: pillBorder },
        ]}
      >
        <BookOpen size={14} color={accent} />
        {locationDenied ? (
          <Text style={[s.pillText, { color: labelColor }]} numberOfLines={1}>
            {offLabel}
          </Text>
        ) : bookCount != null ? (
          <Text style={[s.pillText, { color: textColor }]}>
            {bookCount}{" "}
            <Text style={[s.pillLabel, { color: labelColor }]}>
              {t("home.nearbyBooks", "Books")}
            </Text>
          </Text>
        ) : (
          <View style={[s.skeleton, { backgroundColor: pillBorder }]} />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillText: { fontSize: 12, fontWeight: "700" },
  pillLabel: { fontWeight: "500" },
  skeleton: { width: 40, height: 10, borderRadius: 5 },
});
