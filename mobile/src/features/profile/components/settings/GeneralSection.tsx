import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Constants from "expo-constants";
import { Globe, Info, Sun } from "lucide-react-native";
import React from "react";
import { Text, View, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

import { useColors, useIsDark } from "@/hooks/useColors";
import type { ProfileStackParamList } from "@/navigation/types";
import { useThemeStore } from "@/stores/themeStore";

import { SettingsRow } from "./SettingsRow";
import { settingsStyles as s } from "./styles";

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

interface GeneralSectionProps {
  cardStyle: ViewStyle | ViewStyle[];
  dividerColor: string;
}

export function GeneralSection({ cardStyle, dividerColor }: GeneralSectionProps) {
  const c = useColors();
  const isDark = useIsDark();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const appearanceMode = useThemeStore((s) => s.mode);

  const currentLang = i18n.language?.startsWith("fr")
    ? "Français"
    : i18n.language?.startsWith("nl")
      ? "Nederlands"
      : "English";

  return (
    <>
      <Text style={[s.sectionHeading, { color: c.text.secondary }]}>
        {t("settings.general", "General")}
      </Text>
      <View style={cardStyle}>
        <SettingsRow
          icon={
            <Sun size={20} color={isDark ? c.auth.golden : c.text.secondary} />
          }
          title={t("settings.appearance", "Appearance")}
          subtitle={t(
            `settings.appearance.${appearanceMode}`,
            appearanceMode.charAt(0).toUpperCase() + appearanceMode.slice(1),
          )}
          onPress={() => navigation.navigate("Appearance")}
        />
        <View style={[s.divider, { backgroundColor: dividerColor }]} />
        <SettingsRow
          icon={
            <Globe
              size={20}
              color={isDark ? c.auth.golden : c.text.secondary}
            />
          }
          title={t("settings.language", "Language")}
          subtitle={currentLang}
          onPress={() => navigation.navigate("Language")}
        />
        <View style={[s.divider, { backgroundColor: dividerColor }]} />
        <SettingsRow
          icon={
            <Info size={20} color={isDark ? c.auth.golden : c.text.secondary} />
          }
          title={t("settings.about", "About")}
          subtitle={`v${Constants.expoConfig?.version ?? "1.0.0"}`}
          onPress={() => navigation.navigate("About")}
        />
      </View>
    </>
  );
}
