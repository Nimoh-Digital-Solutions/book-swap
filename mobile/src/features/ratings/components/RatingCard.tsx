import React, { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors, useIsDark } from "@/hooks/useColors";
import { Avatar } from "@/components/Avatar";
import { radius, spacing } from "@/constants/theme";
import type { Rating } from "@/types";
import { StarDisplay } from "./StarDisplay";
import { timeAgo } from "@/lib/timeAgo";

interface Props {
  rating: Rating;
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
