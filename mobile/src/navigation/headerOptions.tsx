import { useNavigation, type NavigationProp } from "@react-navigation/native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import type { HomeStackParamList, RootStackParamList } from "@/navigation/types";
import type { AnyTabNavProp } from "@/navigation/navigationHelpers";
import { Bell, ChevronLeft, Home } from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from "react-native-reanimated";

import { Avatar } from "@/components/Avatar";
import { ANIMATION } from "@/constants/animation";
import { useUnreadCount } from "@/features/notifications/hooks/useNotifications";
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
  const { t } = useTranslation();
  // Header sits inside a stack inside MainTabs — `AnyTabNavProp` is a
  // composite that knows about both this stack AND the surrounding tab
  // navigator, so cross-tab `.navigate(...)` is typed (no more `<any>`).
  const navigation = useNavigation<AnyTabNavProp<HomeStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const c = useColors();

  const goToProfile = () => {
    navigation.navigate("ProfileTab", { screen: "MyProfile" });
  };

  return (
    <Pressable
      onPress={goToProfile}
      style={s.headerBtn}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t("navigation.openProfile", "Open profile")}
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
  const { t } = useTranslation();
  const navigation = useNavigation<AnyTabNavProp<HomeStackParamList>>();
  const c = useColors();
  const isDark = useIsDark();
  const unread = useUnreadCount();
  const prevUnread = useRef(unread);
  const badgeScale = useSharedValue(1);

  useEffect(() => {
    if (unread > 0 && prevUnread.current === 0) {
      badgeScale.value = withSequence(
        withSpring(ANIMATION.scale.badge, ANIMATION.spring.bounce),
        withSpring(1, ANIMATION.spring.snappy),
      );
    }
    prevUnread.current = unread;
  }, [unread, badgeScale]);

  const badgeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const goToNotifications = () => {
    navigation.navigate("HomeTab", { screen: "Notifications" });
  };

  return (
    <Pressable
      onPress={goToNotifications}
      style={s.headerBtn}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        unread > 0
          ? t("navigation.notificationsUnread", "Notifications, {{count}} unread", {
              count: unread,
            })
          : t("navigation.notifications", "Notifications")
      }
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
      {unread > 0 && (
        <Animated.View style={[s.badge, badgeAnimStyle]}>
          <Text style={s.badgeText}>{unread > 9 ? "9+" : unread}</Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

export function HeaderBackButton() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const c = useColors();
  const isDark = useIsDark();

  return (
    <Pressable
      onPress={() => navigation.goBack()}
      style={[
        s.backBtn,
        {
          backgroundColor: isDark ? c.auth.card : c.surface.white,
          borderColor: isDark ? c.auth.cardBorder : c.border.default,
        },
      ]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t("navigation.goBack", "Go back")}
    >
      <ChevronLeft size={20} color={isDark ? c.auth.golden : c.text.primary} />
    </Pressable>
  );
}

export function HeaderHomeButton() {
  const { t } = useTranslation();
  const navigation = useNavigation<AnyTabNavProp<HomeStackParamList>>();
  const c = useColors();
  const isDark = useIsDark();

  const goHome = () => {
    navigation.navigate("HomeTab");
  };

  return (
    <Pressable
      onPress={goHome}
      style={[
        s.backBtn,
        {
          backgroundColor: isDark ? c.auth.card : c.surface.white,
          borderColor: isDark ? c.auth.cardBorder : c.border.default,
        },
      ]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t("navigation.goHome", "Go home")}
    >
      <Home size={18} color={isDark ? c.auth.golden : c.text.primary} />
    </Pressable>
  );
}

export function useProfileHeaderOptions(): NativeStackNavigationOptions {
  const c = useColors();
  const isDark = useIsDark();

  return {
    headerLeft: () => <HeaderHomeButton />,
    headerRight: () => <NotificationBell />,
    headerStyle: { backgroundColor: isDark ? c.auth.bg : c.neutral[50] },
    headerShadowVisible: false,
    headerTintColor: c.text.primary,
    headerTitleAlign: "center",
  };
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
    headerTitleAlign: "center",
  };
}

export function useChildHeaderOptions(): NativeStackNavigationOptions {
  const c = useColors();
  const isDark = useIsDark();

  return {
    headerLeft: () => <HeaderBackButton />,
    headerRight: () => <NotificationBell />,
    headerStyle: { backgroundColor: isDark ? c.auth.bg : c.neutral[50] },
    headerShadowVisible: false,
    headerTintColor: c.text.primary,
    headerBackVisible: false,
    headerTitleAlign: "center",
  };
}

const s = StyleSheet.create({
  headerBtn: {
    // width: 44,
    // height: 44,
    marginHorizontal: 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  bellCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#E53935",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 11,
  },
});
