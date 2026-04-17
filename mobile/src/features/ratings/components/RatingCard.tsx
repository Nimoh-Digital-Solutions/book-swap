import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors, useIsDark } from "@/hooks/useColors";
import { Avatar } from "@/components/Avatar";
import { radius, spacing } from "@/constants/theme";
import type { Rating } from "@/types";
import { StarDisplay } from "./StarDisplay";

interface Props {
  rating: Rating;
}

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

export const RatingCard = memo(function RatingCard({ rating }: Props) {
  const c = useColors();
  const isDark = useIsDark();
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;

  return (
    <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={s.header}>
        <Avatar
          uri={rating.rater.avatar}
          name={rating.rater.username}
          size={32}
        />
        <View style={s.headerText}>
          <Text style={[s.username, { color: c.text.primary }]}>
            @{rating.rater.username}
          </Text>
          <Text style={[s.date, { color: c.text.placeholder }]}>
            {timeAgo(rating.created_at)}
          </Text>
        </View>
        <StarDisplay score={rating.score} size={12} />
      </View>
      {!!rating.comment && (
        <Text style={[s.comment, { color: c.text.secondary }]}>
          {rating.comment}
        </Text>
      )}
    </View>
  );
});

const s = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  username: {
    fontSize: 13,
    fontWeight: "700",
  },
  date: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  comment: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
});
