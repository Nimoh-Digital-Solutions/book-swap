import React, { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { BookPlus, Compass, Repeat2, X, Check } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { spacing, radius as themeRadius } from "@/constants/theme";
import { useColors, useIsDark } from "@/hooks/useColors";
import { gettingStartedStorage } from "@/lib/storage";

interface ChecklistItem {
  key: string;
  labelKey: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  done: boolean;
}

interface HomeGettingStartedProps {
  hasBooks: boolean;
  hasBrowsed: boolean;
  hasExchange: boolean;
  onAddBook: () => void;
  onBrowse: () => void;
}

export function HomeGettingStarted({
  hasBooks,
  hasBrowsed,
  hasExchange,
  onAddBook,
  onBrowse,
}: HomeGettingStartedProps) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const [dismissed, setDismissed] = useState(gettingStartedStorage.isDismissed);

  const items: ChecklistItem[] = useMemo(
    () => [
      { key: "addBook", labelKey: "home.gettingStarted.addBook", icon: BookPlus, done: hasBooks },
      { key: "browse", labelKey: "home.gettingStarted.browse", icon: Compass, done: hasBrowsed },
      { key: "swap", labelKey: "home.gettingStarted.swap", icon: Repeat2, done: hasExchange },
    ],
    [hasBooks, hasBrowsed, hasExchange],
  );

  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;

  const handleDismiss = useCallback(() => {
    gettingStartedStorage.dismiss();
    setDismissed(true);
  }, []);

  if (dismissed || allDone) return null;

  const accent = c.auth.golden;
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const progress = doneCount / items.length;

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={[s.title, { color: c.text.primary }]}>
          {t("home.gettingStarted.title")}
        </Text>
        <Pressable
          onPress={handleDismiss}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("home.gettingStarted.dismiss")}
        >
          <X size={18} color={c.text.placeholder} />
        </Pressable>
      </View>

      {/* Progress bar */}
      <View style={[s.progressTrack, { backgroundColor: isDark ? c.auth.cardBorder : c.neutral[100] }]}>
        <View style={[s.progressFill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
      </View>

      {/* Checklist */}
      {items.map((item) => {
        const Icon = item.icon;
        const onPress =
          item.key === "addBook" ? onAddBook : item.key === "browse" ? onBrowse : undefined;

        return (
          <Pressable
            key={item.key}
            onPress={item.done ? undefined : onPress}
            disabled={item.done || !onPress}
            accessibilityRole="button"
            accessibilityState={{ checked: item.done }}
            style={({ pressed }) => [
              s.row,
              pressed && !item.done && { opacity: 0.7 },
            ]}
          >
            <View
              style={[
                s.checkbox,
                item.done
                  ? { backgroundColor: accent }
                  : { borderColor: cardBorder, borderWidth: 1.5 },
              ]}
            >
              {item.done && <Check size={12} color="#fff" strokeWidth={3} />}
            </View>
            <Icon size={18} color={item.done ? c.text.placeholder : accent} />
            <Text
              style={[
                s.label,
                { color: item.done ? c.text.placeholder : c.text.primary },
                item.done && s.labelDone,
              ]}
            >
              {t(item.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: themeRadius.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 6,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  labelDone: {
    textDecorationLine: "line-through",
  },
});
