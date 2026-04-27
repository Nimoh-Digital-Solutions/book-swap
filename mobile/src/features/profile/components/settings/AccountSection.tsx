import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Bell, ShieldOff } from "lucide-react-native";
import React from "react";
import { Text, View, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

import { useColors, useIsDark } from "@/hooks/useColors";
import type { ProfileStackParamList } from "@/navigation/types";

import { SettingsRow } from "./SettingsRow";
import { settingsStyles as s } from "./styles";

// Settings sections are only mounted inside ProfileStack (AUD-M-407).
type Nav = NativeStackNavigationProp<ProfileStackParamList>;

interface AccountSectionProps {
  cardStyle: ViewStyle | ViewStyle[];
  dividerColor: string;
}

export function AccountSection({ cardStyle, dividerColor }: AccountSectionProps) {
  const c = useColors();
  const isDark = useIsDark();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  return (
    <>
      <Text style={[s.sectionHeading, { color: c.text.secondary }]}>
        {t("settings.account", "Account")}
      </Text>
      <View style={cardStyle}>
        <SettingsRow
          icon={
            <Bell size={20} color={isDark ? c.auth.golden : c.text.secondary} />
          }
          title={t("settings.notifications", "Notifications")}
          subtitle={t(
            "settings.notificationsSubtitle",
            "Swap alerts and messages",
          )}
          onPress={() => navigation.navigate("NotificationPreferences")}
        />
        <View style={[s.divider, { backgroundColor: dividerColor }]} />
        <SettingsRow
          icon={
            <ShieldOff
              size={20}
              color={isDark ? c.auth.golden : c.text.secondary}
            />
          }
          title={t("settings.blockedUsers", "Blocked Users")}
          subtitle={t(
            "settings.blockedUsersSubtitle",
            "Manage blocked accounts",
          )}
          onPress={() => navigation.navigate("BlockedUsers")}
        />
      </View>
    </>
  );
}
