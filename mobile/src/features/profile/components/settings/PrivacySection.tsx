import { Eye, Radar } from "lucide-react-native";
import React from "react";
import { Switch, Text, View, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

import { useColors, useIsDark } from "@/hooks/useColors";

import { settingsStyles as s } from "./styles";

interface PrivacySectionProps {
  cardStyle: ViewStyle | ViewStyle[];
  dividerColor: string;
  iconCircleBg: string;
  profilePublic: boolean;
  profilePublicPending: boolean;
  onToggleProfilePublic: (val: boolean) => void;
  analyticsOptedOut: boolean;
  onToggleAnalytics: (val: boolean) => void;
}

export function PrivacySection({
  cardStyle,
  dividerColor,
  iconCircleBg,
  profilePublic,
  profilePublicPending,
  onToggleProfilePublic,
  analyticsOptedOut,
  onToggleAnalytics,
}: PrivacySectionProps) {
  const c = useColors();
  const isDark = useIsDark();
  const { t } = useTranslation();

  return (
    <>
      <Text style={[s.sectionHeading, { color: c.text.secondary }]}>
        {t("settings.privacy", "Privacy & Visibility")}
      </Text>
      <View style={cardStyle}>
        <View style={s.switchRow}>
          <View style={s.rowLeft}>
            <View style={[s.iconCircle, { backgroundColor: iconCircleBg }]}>
              <Eye
                size={20}
                color={isDark ? c.auth.golden : c.text.secondary}
              />
            </View>
            <View style={s.rowTextWrap}>
              <Text style={[s.rowTitle, { color: c.text.primary }]}>
                {t("settings.profilePublic", "Public profile")}
              </Text>
              <Text style={[s.rowSubtitle, { color: c.text.secondary }]}>
                {t(
                  "settings.profilePublicSubtitle",
                  "Allow other users to see your profile",
                )}
              </Text>
            </View>
          </View>
          <Switch
            value={profilePublic}
            onValueChange={onToggleProfilePublic}
            disabled={profilePublicPending}
            trackColor={{
              true: c.auth.golden,
              false: isDark ? c.auth.cardBorder : c.neutral[200],
            }}
            thumbColor="#fff"
          />
        </View>
        <View style={[s.divider, { backgroundColor: dividerColor }]} />
        <View style={s.switchRow}>
          <View style={s.rowLeft}>
            <View style={[s.iconCircle, { backgroundColor: iconCircleBg }]}>
              <Radar
                size={20}
                color={isDark ? c.auth.golden : c.text.secondary}
              />
            </View>
            <View style={s.rowTextWrap}>
              <Text style={[s.rowTitle, { color: c.text.primary }]}>
                {t("settings.analyticsOptOut", "Opt out of analytics")}
              </Text>
              <Text style={[s.rowSubtitle, { color: c.text.secondary }]}>
                {t(
                  "settings.analyticsOptOutSubtitle",
                  "Disable anonymous usage analytics",
                )}
              </Text>
            </View>
          </View>
          <Switch
            value={analyticsOptedOut}
            onValueChange={onToggleAnalytics}
            trackColor={{
              true: c.auth.golden,
              false: isDark ? c.auth.cardBorder : c.neutral[200],
            }}
            thumbColor="#fff"
          />
        </View>
      </View>
    </>
  );
}
