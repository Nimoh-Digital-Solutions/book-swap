import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

import { radius, shadows, spacing } from "@/constants/theme";
import { useColors, useIsDark } from "@/hooks/useColors";
import { Avatar } from "@/components/Avatar";
import type { BrowseBook } from "@/features/books/hooks/useBooks";

const COVER_COLORS = ["#2D5F3F", "#3B4F7A", "#6B3A5E", "#7A5C2E", "#2B4E5F"];

export function BookCard({
  book,
  onPress,
}: {
  book: BrowseBook;
  onPress?: () => void;
}) {
  const c = useColors();
  const isDark = useIsDark();
  const coverUri = book.cover_url || book.primary_photo;
  const coverBg = COVER_COLORS[book.id.charCodeAt(0) % COVER_COLORS.length];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${book.title} by ${book.author}`}
      onPress={onPress}
      style={({ pressed }) => [
        s.bookCard,
        {
          backgroundColor: isDark ? c.auth.card : c.surface.white,
          borderColor: isDark ? c.auth.cardBorder : c.border.default,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[s.bookCover, { backgroundColor: coverBg }]}>
        {coverUri ? (
          <Image
            source={{ uri: coverUri }}
            style={s.coverImage}
            contentFit="cover"
          />
        ) : (
          <>
            <Text style={s.bookCoverTitle} numberOfLines={2}>
              {book.title}
            </Text>
            <Text style={s.bookCoverAuthor} numberOfLines={1}>
              {book.author}
            </Text>
          </>
        )}
      </View>

      <View style={s.bookInfo}>
        {book.status === "available" && (
          <View style={s.availRow}>
            <View style={[s.availDot, { backgroundColor: c.auth.golden }]} />
            <Text style={[s.availLabel, { color: c.text.secondary }]}>
              Available
            </Text>
          </View>
        )}

        <Text
          style={[s.bookTitle, { color: c.text.primary }]}
          numberOfLines={2}
        >
          {book.title}
        </Text>
        <Text
          style={[s.bookAuthor, { color: c.text.secondary }]}
          numberOfLines={1}
        >
          {book.author}
        </Text>

        <View style={s.ownerRow}>
          <Avatar
            uri={book.owner.avatar}
            name={book.owner.username}
            size={20}
          />
          <Text style={[s.ownerName, { color: c.text.primary }]}>
            {book.owner.username}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  bookCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.sm + 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadows.card,
  },
  bookCover: {
    width: 80,
    height: 112,
    borderRadius: radius.sm,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
    flexShrink: 0,
  },
  coverImage: {
    width: "100%",
    height: "100%",
    borderRadius: radius.sm,
  },
  bookCoverTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  bookCoverAuthor: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 7,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  bookInfo: { flex: 1 },
  availRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  availLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 2,
  },
  bookAuthor: { fontSize: 12, marginBottom: spacing.md },
  ownerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ownerName: { fontSize: 10, fontWeight: "500" },
});
