import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ArrowLeftRight,
  Bell,
  CheckCheck,
  MessageSquare,
  Star,
} from "lucide-react-native";

import { useColors, useIsDark } from "@/hooks/useColors";
import { EmptyState } from "@/components/EmptyState";
import { radius, spacing } from "@/constants/theme";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllRead,
  useNotificationWsSync,
} from "../hooks/useNotifications";
import type { Notification, NotificationType } from "@/types";

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

const ICON_MAP: Record<NotificationType, typeof Bell> = {
  new_request: ArrowLeftRight,
  request_accepted: ArrowLeftRight,
  request_declined: ArrowLeftRight,
  request_expired: ArrowLeftRight,
  exchange_completed: ArrowLeftRight,
  new_message: MessageSquare,
  rating_received: Star,
};

function extractExchangeId(link: string): string | null {
  const match = link.match(/exchanges\/([a-f0-9-]+)/i);
  return match?.[1] ?? null;
}

export function NotificationListScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const navigation = useNavigation<any>();

  const { data, isLoading, isRefetching, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();
  useNotificationWsSync();

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  const notifications = data?.results ?? [];
  const unreadCount = data?.unread_count ?? 0;

  const handleTap = useCallback(
    (notif: Notification) => {
      if (!notif.is_read) {
        markRead.mutate(notif.id);
      }

      const exchangeId = extractExchangeId(notif.link);
      if (!exchangeId) return;

      const tabNav = navigation.getParent();
      if (notif.notification_type === "new_message") {
        if (tabNav) {
          tabNav.navigate("MessagesTab", {
            screen: "Chat",
            params: { exchangeId },
          });
        }
      } else {
        if (tabNav) {
          tabNav.navigate("MessagesTab", {
            screen: "ExchangeDetail",
            params: { exchangeId },
          });
        }
      }
    },
    [markRead, navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => {
      const Icon = ICON_MAP[item.notification_type] ?? Bell;
      const unread = !item.is_read;

      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.title}. ${item.body}. ${unread ? t("notifications.unreadA11y", "Unread") + ". " : ""}${timeAgo(item.created_at)}`}
          onPress={() => handleTap(item)}
          style={({ pressed }) => [
            s.row,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              opacity: unread ? 1 : 0.65,
            },
            pressed && { opacity: 0.5 },
          ]}
        >
          <View style={s.iconCol}>
            <View
              style={[
                s.iconWrap,
                { backgroundColor: accent + "18" },
              ]}
            >
              <Icon size={18} color={accent} />
            </View>
            {unread && <View style={[s.unreadDot, { backgroundColor: c.status.error }]} />}
          </View>
          <View style={s.textCol}>
            <Text style={[s.title, { color: c.text.primary }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[s.body, { color: c.text.secondary }]} numberOfLines={2}>
              {item.body}
            </Text>
          </View>
          <Text style={[s.time, { color: c.text.placeholder }]}>
            {timeAgo(item.created_at)}
          </Text>
        </Pressable>
      );
    },
    [handleTap, cardBg, cardBorder, accent, c, t],
  );

  const ListHeader = useCallback(() => {
    if (unreadCount === 0) return null;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("notifications.markAllRead", "Mark all as read")}
        accessibilityState={{ disabled: markAll.isPending }}
        onPress={() => markAll.mutate()}
        disabled={markAll.isPending}
        style={({ pressed }) => [
          s.markAllBtn,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <CheckCheck size={14} color={accent} />
        <Text style={[s.markAllText, { color: accent }]}>
          {t("notifications.markAllRead", "Mark all as read")}
        </Text>
      </Pressable>
    );
  }, [unreadCount, markAll, accent, t]);

  if (isLoading) {
    return (
      <View style={[s.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={["bottom"]}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          isError ? (
            <EmptyState
              icon={AlertTriangle}
              title={t("common.error", "Something went wrong")}
              subtitle={t("common.retryHint", "Check your connection and try again.")}
              actionLabel={t("common.retry", "Retry")}
              onAction={() => refetch()}
            />
          ) : (
            <EmptyState
              icon={Bell}
              title={t("notifications.emptyTitle", "No notifications")}
              subtitle={t(
                "notifications.emptySubtitle",
                "You'll be notified about swap requests, messages, and ratings here.",
              )}
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: {
    paddingHorizontal: spacing.md + 4,
    paddingTop: spacing.sm,
    paddingBottom: 20,
    gap: spacing.xs + 2,
  },
  markAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  markAllText: { fontSize: 13, fontWeight: "600" },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm + 2,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  iconCol: {
    alignItems: "center",
    width: 40,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  textCol: { flex: 1 },
  title: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  body: { fontSize: 13, lineHeight: 19 },
  time: { fontSize: 11, fontWeight: "500", marginTop: 2 },
});
