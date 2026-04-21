import { radius, shadows, spacing } from "@/constants/theme";
import { ANIMATION } from "@/constants/animation";
import { useColors, useIsDark } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";
import type { ExchangeBook, ExchangeListItem } from "@/types";
import { Image } from "expo-image";
import { ArrowLeftRight, MessageCircle } from "lucide-react-native";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { ExchangeStatusBadge } from "./ExchangeStatusBadge";
import { timeAgo } from "@/lib/timeAgo";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const COVER_COLORS = ["#2D5F3F", "#3B4F7A", "#6B3A5E", "#7A5C2E", "#2B4E5F"];

interface Props {
  exchange: ExchangeListItem;
  onPress: () => void;
}

function BookThumb({ book, label }: { book: ExchangeBook; label: string }) {
  const c = useColors();
  const coverUri = book.cover_url || book.primary_photo;
  const coverBg = COVER_COLORS[book.id.charCodeAt(0) % COVER_COLORS.length];

  return (
    <View style={s.thumbWrap}>
      <View style={[s.thumb, { backgroundColor: coverBg }]}>
        {coverUri ? (
          <Image
            source={{ uri: coverUri }}
            style={s.thumbImage}
            contentFit="cover"
          />
        ) : (
          <Text style={s.thumbFallback} numberOfLines={2}>
            {book.title}
          </Text>
        )}
      </View>
      <Text
        style={[s.thumbBookTitle, { color: c.text.primary }]}
        numberOfLines={1}
      >
        {book.title}
      </Text>
      <Text
        style={[s.thumbLabel, { color: c.text.secondary }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export function ExchangeCard({ exchange, onPress }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const accent = c.auth.golden;
  const currentUserId = useAuthStore((st) => st.user?.id);
  const isOwner = currentUserId === exchange.owner.id;

  const leftBook = isOwner ? exchange.requested_book : exchange.offered_book;
  const rightBook = isOwner ? exchange.offered_book : exchange.requested_book;

  const otherUser = isOwner ? exchange.requester : exchange.owner;
  const roleLabel = isOwner
    ? t("exchanges.roleOwner", "Owner")
    : t("exchanges.roleRequester", "Requester");

  const a11yLabel = `Exchange with @${otherUser.username}. ${leftBook.title} and ${rightBook.title}. ${exchange.status}.`;

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const onPressIn = useCallback(() => {
    scale.value = withSpring(ANIMATION.scale.pressed, ANIMATION.spring.snappy);
  }, [scale]);
  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, ANIMATION.spring.snappy);
  }, [scale]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        s.card,
        {
          backgroundColor: isDark ? c.auth.card : c.surface.white,
          borderColor: isDark ? c.auth.cardBorder : c.border.default,
        },
        animatedStyle,
      ]}
    >
      {/* Status + date row */}
      <View style={s.topRow}>
        <View style={s.topLeft}>
          <ExchangeStatusBadge status={exchange.status} />
          <View style={[s.rolePill, { backgroundColor: accent + '18' }]}>
            <Text style={[s.roleText, { color: accent }]}>{roleLabel}</Text>
          </View>
        </View>
        <Text style={[s.date, { color: c.text.secondary }]}>
          {timeAgo(exchange.created_at)}
        </Text>
      </View>

      {/* Book thumbnails — current user's book always on the left */}
      <View style={s.booksRow}>
        <BookThumb book={leftBook} label={t("exchanges.yours", "Yours")} />
        <View style={s.arrowWrap}>
          <View
            style={[
              s.arrowCircle,
              {
                backgroundColor: isDark ? c.auth.bg : c.neutral[50],
                borderColor: isDark ? c.auth.cardBorder : c.border.default,
              },
            ]}
          >
            <ArrowLeftRight size={14} color={accent} />
          </View>
        </View>
        <BookThumb book={rightBook} label={t("exchanges.theirs", "Theirs")} />
      </View>

      {/* Partner + last message */}
      <View
        style={[
          s.partnerRow,
          {
            borderTopColor: isDark
              ? c.auth.cardBorder + "50"
              : c.border.default + "50",
          },
        ]}
      >
        <View style={s.partnerLine}>
          <Text
            style={[s.partner, { color: c.text.secondary }]}
            numberOfLines={1}
          >
            with @{otherUser.username}
          </Text>
          {exchange.unread_count > 0 && (
            <View style={[s.unreadBadge, { backgroundColor: accent }]}>
              <Text style={s.unreadText}>
                {exchange.unread_count > 9 ? "9+" : exchange.unread_count}
              </Text>
            </View>
          )}
        </View>
        {!!exchange.last_message_preview && (
          <View style={s.previewRow}>
            <MessageCircle size={11} color={c.text.placeholder} />
            <Text
              style={[
                s.previewText,
                { color: exchange.unread_count > 0 ? c.text.primary : c.text.secondary },
                exchange.unread_count > 0 && s.previewBold,
              ]}
              numberOfLines={1}
            >
              {exchange.last_message_preview}
            </Text>
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...shadows.card,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  rolePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  roleText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  date: { fontSize: 11, fontWeight: "500" },

  booksRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },

  arrowWrap: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: spacing.xs,
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  thumbWrap: {
    flex: 1,
    alignItems: "center",
  },
  thumb: {
    width: "80%",
    aspectRatio: 0.7,
    borderRadius: radius.sm,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm + 2,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbFallback: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    color: "rgba(255,255,255,0.85)",
    paddingHorizontal: spacing.xs,
  },
  thumbBookTitle: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  thumbLabel: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 1,
  },

  partnerRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: 4,
  },
  partnerLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  partner: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  previewText: {
    fontSize: 11,
    maxWidth: "85%",
  },
  previewBold: {
    fontWeight: "600",
  },
});
