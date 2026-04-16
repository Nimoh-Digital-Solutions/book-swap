import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { radius, shadows, spacing, typography } from "@/constants/theme";
import { useColors, useIsDark } from "@/hooks/useColors";
import type { MockBook } from "@/features/books/data/mockBooks";

export type { MockBook };

const AVATAR_GRADIENTS = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
];
const MAX_VISIBLE = 3;

function BookCard({ book, onPress }: { book: MockBook; onPress?: () => void }) {
  const c = useColors();
  const isDark = useIsDark();

  return (
    <Pressable
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
      {/* Cover thumbnail */}
      <View style={[s.bookCover, { backgroundColor: book.coverBg }]}>
        <Text style={s.bookCoverTitle} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={s.bookCoverAuthor} numberOfLines={1}>
          {book.author}
        </Text>
      </View>

      {/* Info column */}
      <View style={s.bookInfo}>
        {/* Availability dot + label */}
        {book.available && (
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

        {/* Owner row */}
        <View style={s.ownerRow}>
          <View
            style={[
              s.ownerAvatar,
              {
                backgroundColor:
                  AVATAR_GRADIENTS[
                    book.id.charCodeAt(0) % AVATAR_GRADIENTS.length
                  ],
              },
            ]}
          >
            <Text style={s.ownerInitial}>{book.owner.initial}</Text>
          </View>
          <Text style={[s.ownerName, { color: c.text.primary }]}>
            {book.owner.name}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

interface Props {
  books: MockBook[];
  title: string;
  subtitle: string;
  viewAllLabel: string;
  onViewAll: () => void;
  onBookPress: (bookId: string) => void;
}

export function HomeRecentlyAdded({
  books,
  title,
  subtitle,
  viewAllLabel,
  onViewAll,
  onBookPress,
}: Props) {
  const c = useColors();
  const visible = books.slice(0, MAX_VISIBLE);

  return (
    <View style={s.section}>
      <View style={s.sectionHead}>
        <View>
          <Text style={[s.sectionTitle, { color: c.text.primary }]}>
            {title}
          </Text>
          <Text style={[s.sectionSub, { color: c.text.secondary }]}>
            {subtitle}
          </Text>
        </View>
        <Pressable onPress={onViewAll} hitSlop={8} style={s.viewAllBtn}>
          <Text style={[s.viewAllText, { color: c.auth.golden }]}>
            {viewAllLabel}
          </Text>
          <ChevronRight size={14} color={c.auth.golden} />
        </Pressable>
      </View>

      <View style={s.bookList}>
        {visible.map((book) => (
          <BookCard key={book.id} book={book} onPress={() => onBookPress(book.id)} />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginBottom: spacing.xl },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  sectionSub: { ...typography.small, marginTop: 2 },
  viewAllBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAllText: { fontSize: 13, fontWeight: "600" },

  bookList: { paddingHorizontal: spacing.lg, gap: spacing.sm },
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
  ownerAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerInitial: { color: "#fff", fontSize: 9, fontWeight: "700" },
  ownerName: { fontSize: 10, fontWeight: "500" },
});
