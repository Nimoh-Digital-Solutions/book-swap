import {
  ChevronRight,
  MapPin,
  Navigation,
  Radar,
  Search,
} from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useColors, useIsDark } from "@/hooks/useColors";
import type { User } from "@/types";

import { RADIUS_OPTIONS } from "../../hooks/useSearchRadius";
import { settingsStyles as s } from "./styles";

interface LocationSectionProps {
  user: User;
  cardStyle: ViewStyle | ViewStyle[];
  dividerColor: string;
  iconCircleBg: string;
  gpsUpdating: boolean;
  onUpdateGps: () => void;
  onOpenManual: () => void;
  currentRadius: number;
  radiusUpdating: boolean;
  onUpdateRadius: (val: number) => void;
}

export function LocationSection({
  user,
  cardStyle,
  dividerColor,
  iconCircleBg,
  gpsUpdating,
  onUpdateGps,
  onOpenManual,
  currentRadius,
  radiusUpdating,
  onUpdateRadius,
}: LocationSectionProps) {
  const c = useColors();
  const isDark = useIsDark();
  const { t } = useTranslation();

  return (
    <>
      <Text style={[s.sectionHeading, { color: c.text.secondary }]}>
        {t("settings.locationSearch", "Location & Search")}
      </Text>
      <View style={cardStyle}>
        <View style={s.locationRow}>
          <View style={s.rowLeft}>
            <View style={[s.iconCircle, { backgroundColor: iconCircleBg }]}>
              <MapPin
                size={20}
                color={isDark ? c.auth.golden : c.text.secondary}
              />
            </View>
            <View style={s.rowTextWrap}>
              <Text style={[s.rowTitle, { color: c.text.primary }]}>
                {t("settings.currentLocation", "Current location")}
              </Text>
              <Text style={[s.rowSubtitle, { color: c.text.secondary }]}>
                {user.neighborhood || t("settings.noLocation", "Not set")}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onUpdateGps}
            disabled={gpsUpdating}
            style={({ pressed }) => [
              s.locationBtn,
              {
                backgroundColor: isDark ? c.auth.card : c.neutral[50],
                borderColor: isDark ? c.auth.cardBorder : c.border.default,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {gpsUpdating ? (
              <ActivityIndicator size="small" color={c.auth.golden} />
            ) : (
              <Navigation size={14} color={c.auth.golden} />
            )}
            <Text style={[s.locationBtnText, { color: c.text.primary }]}>
              {t("settings.update", "Update")}
            </Text>
          </Pressable>
        </View>

        <View style={[s.divider, { backgroundColor: dividerColor }]} />

        <Pressable
          style={({ pressed }) => [
            s.row,
            pressed && {
              backgroundColor: isDark
                ? c.auth.cardBorder + "20"
                : c.neutral[50],
            },
          ]}
          onPress={onOpenManual}
          accessibilityRole="button"
          accessibilityLabel={t(
            "settings.setManually",
            "Set location manually",
          )}
        >
          <View style={s.rowLeft}>
            <View style={[s.iconCircle, { backgroundColor: iconCircleBg }]}>
              <Search
                size={20}
                color={isDark ? c.auth.golden : c.text.secondary}
              />
            </View>
            <View style={s.rowTextWrap}>
              <Text style={[s.rowTitle, { color: c.text.primary }]}>
                {t("settings.setManually", "Set location manually")}
              </Text>
              <Text style={[s.rowSubtitle, { color: c.text.secondary }]}>
                {t("settings.setManuallySub", "Enter a city or postcode")}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={c.text.placeholder} />
        </Pressable>

        <View style={[s.divider, { backgroundColor: dividerColor }]} />

        <View style={s.radiusSection}>
          <View style={s.rowLeft}>
            <View style={[s.iconCircle, { backgroundColor: iconCircleBg }]}>
              <Radar
                size={20}
                color={isDark ? c.auth.golden : c.text.secondary}
              />
            </View>
            <View style={s.rowTextWrap}>
              <Text style={[s.rowTitle, { color: c.text.primary }]}>
                {t("settings.searchRadius", "Search radius")}
              </Text>
              <Text style={[s.rowSubtitle, { color: c.text.secondary }]}>
                {t("settings.searchRadiusSub", "{{km}} km", {
                  km: currentRadius / 1000,
                })}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.radiusScroll}
            contentContainerStyle={s.radiusChips}
          >
            {RADIUS_OPTIONS.map((opt) => {
              const selected = currentRadius === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => onUpdateRadius(opt.value)}
                  disabled={radiusUpdating}
                  style={[
                    s.radiusChip,
                    {
                      backgroundColor: selected
                        ? c.auth.golden
                        : isDark
                          ? c.auth.card
                          : c.neutral[50],
                      borderColor: selected
                        ? c.auth.golden
                        : isDark
                          ? c.auth.cardBorder
                          : c.border.default,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.radiusChipText,
                      { color: selected ? "#152018" : c.text.secondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </>
  );
}
