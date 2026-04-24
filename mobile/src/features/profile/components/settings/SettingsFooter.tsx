import { Download, LogOut, Trash2 } from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useColors, useIsDark } from "@/hooks/useColors";

import { settingsStyles as s } from "./styles";

interface SettingsFooterProps {
  onLogout: () => void;
  onExport: () => void;
  exportPending: boolean;
  onDelete: () => void;
}

export function SettingsFooter({
  onLogout,
  onExport,
  exportPending,
  onDelete,
}: SettingsFooterProps) {
  const c = useColors();
  const isDark = useIsDark();
  const { t } = useTranslation();

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          s.logoutBtn,
          {
            backgroundColor: isDark ? c.auth.card : c.neutral[100],
            borderWidth: 1,
            borderColor: isDark ? c.status.error + "40" : c.neutral[200],
          },
          pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
        ]}
        onPress={onLogout}
        accessibilityRole="button"
        accessibilityLabel={t("settings.logout", "Log out")}
      >
        <LogOut size={20} color={c.status.error} />
        <Text style={[s.logoutText, { color: c.status.error }]}>
          {t("settings.logout", "Log out")}
        </Text>
      </Pressable>

      <View style={s.bottomLinks}>
        <Pressable
          style={({ pressed }) => [s.bottomLink, pressed && { opacity: 0.6 }]}
          onPress={onExport}
          disabled={exportPending}
          accessibilityRole="button"
          accessibilityLabel={t("dataExport.button")}
        >
          {exportPending ? (
            <ActivityIndicator size={13} color={c.text.subtle} />
          ) : (
            <Download size={13} color={c.text.subtle} />
          )}
          <Text style={[s.bottomLinkText, { color: c.text.subtle }]}>
            {exportPending
              ? t("dataExport.loading")
              : t("dataExport.button")}
          </Text>
        </Pressable>

        <View style={[s.bottomDot, { backgroundColor: c.neutral[300] }]} />

        <Pressable
          style={({ pressed }) => [s.bottomLink, pressed && { opacity: 0.6 }]}
          onPress={onDelete}
          accessibilityRole="button"
        >
          <Trash2 size={13} color={c.text.subtle} />
          <Text style={[s.bottomLinkText, { color: c.text.subtle }]}>
            {t("settings.deleteAccount", "Delete account")}
          </Text>
        </Pressable>
      </View>

      <Text style={[s.footer, { color: c.neutral[400] }]}>BookSwap</Text>
    </>
  );
}
