import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { Bell } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import { useColors, useIsDark } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";

function getUserDisplayName(
  user: { first_name?: string; last_name?: string; username?: string } | null,
): string {
  if (!user) return "";
  const parts = [user.first_name, user.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : (user.username ?? "");
}

export function HeaderAvatar() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const c = useColors();

  return (
    <Pressable
      onPress={() => navigation.navigate("ProfileTab")}
      style={s.headerBtn}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Open profile"
    >
      <Avatar
        uri={user?.avatar}
        name={getUserDisplayName(user)}
        size={34}
        borderColor={c.auth.golden}
      />
    </Pressable>
  );
}

export function NotificationBell() {
  const c = useColors();
  const isDark = useIsDark();

  return (
    <Pressable
      style={s.headerBtn}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Notifications"
    >
      <View
        style={[
          s.bellCircle,
          {
            backgroundColor: isDark ? c.auth.card : c.surface.white,
            borderColor: isDark ? c.auth.cardBorder : c.border.default,
          },
        ]}
      >
        <Bell size={18} color={isDark ? c.auth.golden : c.text.primary} />
      </View>
    </Pressable>
  );
}

export function useSharedHeaderOptions(): NativeStackNavigationOptions {
  const c = useColors();
  const isDark = useIsDark();

  return {
    headerLeft: () => <HeaderAvatar />,
    headerRight: () => <NotificationBell />,
    headerStyle: { backgroundColor: isDark ? c.auth.bg : c.neutral[50] },
    headerShadowVisible: false,
    headerTintColor: c.text.primary,
  };
}

const s = StyleSheet.create({
  headerBtn: {
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 0.9,
  },
  bellCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
