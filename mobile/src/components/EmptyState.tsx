import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import type { LucideIcon } from "lucide-react-native";

import { useColors, useIsDark } from "@/hooks/useColors";
import { spacing, radius } from "@/constants/theme";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  compact,
}: EmptyStateProps) {
  const c = useColors();
  const isDark = useIsDark();
  const accent = c.auth.golden;

  return (
    <Animated.View entering={FadeIn.duration(300)} style={[s.root, compact && s.compact]}>
      <View style={[s.iconWrap, { backgroundColor: isDark ? c.auth.card : accent + "14" }]}>
        <Icon size={compact ? 28 : 36} color={accent} />
      </View>
      <Text style={[compact ? s.titleCompact : s.title, { color: c.text.primary }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[s.subtitle, { color: c.text.secondary }]}>
          {subtitle}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => [
            s.actionBtn,
            { backgroundColor: accent, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={s.actionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root: {
    alignItems: "center",
    paddingVertical: spacing.xl + 8,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  compact: {
    paddingVertical: spacing.lg,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  title: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  titleCompact: { fontSize: 15, fontWeight: "600", textAlign: "center" },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 280,
  },
  actionBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.xl,
    marginTop: spacing.sm,
  },
  actionText: { color: "#152018", fontWeight: "700", fontSize: 14 },
});
