import { BookOpen, ChevronRight, MapPin } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { spacing, typography } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { SkeletonCard } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { BookCard } from "@/features/books/components/BookCard";
import type { BrowseBook } from "@/features/books/hooks/useBooks";

const MAX_VISIBLE = 3;

interface Props {
  books: BrowseBook[];
  isLoading?: boolean;
  /** Nearby lists need location; when denied, show explanation instead of generic empty. */
  locationDenied?: boolean;
  onOpenSettings?: () => void;
  title: string;
  subtitle: string;
  viewAllLabel: string;
  onViewAll: () => void;
  onBookPress: (bookId: string) => void;
  onAddBook?: () => void;
}

export function HomeRecentlyAdded({
  books,
  isLoading,
  locationDenied,
  onOpenSettings,
  title,
  subtitle,
  viewAllLabel,
  onViewAll,
  onBookPress,
  onAddBook,
}: Props) {
  const { t } = useTranslation();
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
        {visible.length > 0 && (
          <Pressable
            onPress={onViewAll}
            hitSlop={8}
            style={s.viewAllBtn}
            accessibilityRole="button"
            accessibilityLabel={t("home.viewAll", "View all")}
          >
            <Text style={[s.viewAllText, { color: c.auth.golden }]}>
              {viewAllLabel}
            </Text>
            <ChevronRight size={14} color={c.auth.golden} />
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={s.bookList}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : locationDenied ? (
        <EmptyState
          icon={MapPin}
          title={t(
            'home.locationDeniedRecentTitle',
            'Turn on location to see nearby books',
          )}
          subtitle={t(
            'home.locationDeniedRecentBody',
            'We use your approximate area to show fresh listings and community activity.',
          )}
          actionLabel={t('home.openSettings', 'Open Settings')}
          onAction={onOpenSettings}
          compact
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t("home.recentlyAddedEmptyTitle", "No books yet")}
          subtitle={t(
            "home.recentlyAddedEmptySubtitle",
            "Be the first to add a book and start swapping with your neighbors.",
          )}
          actionLabel={t("home.recentlyAddedAction", "Add a book")}
          onAction={onAddBook}
          compact
        />
      ) : (
        <View style={s.bookList}>
          {visible.map((book) => (
            <BookCard key={book.id} book={book} onPress={() => onBookPress(book.id)} />
          ))}
        </View>
      )}
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
});
