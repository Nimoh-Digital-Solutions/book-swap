import { radius, shadows, spacing } from "@/constants/theme";
import { useColors, useIsDark } from "@/hooks/useColors";
import type { ExchangeBook, ExchangeListItem } from "@/types";
import { Image } from "expo-image";
import { ArrowLeftRight } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ExchangeStatusBadge } from "./ExchangeStatusBadge";

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

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
  const c = useColors();
  const isDark = useIsDark();
  const accent = c.auth.golden;

  const partner =
    exchange.requester.username !== exchange.owner.username
      ? `@${exchange.requester.username} ↔ @${exchange.owner.username}`
      : `@${exchange.requester.username}`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.card,
        {
          backgroundColor: isDark ? c.auth.card : c.surface.white,
          borderColor: isDark ? c.auth.cardBorder : c.border.default,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {/* Status + date row */}
      <View style={s.topRow}>
        <ExchangeStatusBadge status={exchange.status} />
        <Text style={[s.date, { color: c.text.secondary }]}>
          {timeAgo(exchange.created_at)}
        </Text>
      </View>

      {/* Book thumbnails */}
      <View style={s.booksRow}>
        <BookThumb book={exchange.requested_book} label="Requested" />
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
        <BookThumb book={exchange.offered_book} label="Offered" />
      </View>

      {/* Partner */}
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
        <Text
          style={[s.partner, { color: c.text.secondary }]}
          numberOfLines={1}
        >
          {partner}
        </Text>
      </View>
    </Pressable>
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
  },
  partner: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});
