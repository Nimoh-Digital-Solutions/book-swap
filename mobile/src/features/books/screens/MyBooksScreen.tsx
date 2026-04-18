import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  ChevronRight,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react-native";

import { useColors, useIsDark } from "@/hooks/useColors";
import { spacing, radius, shadows } from "@/constants/theme";
import { SkeletonCard } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { AddBookModal } from "@/features/books/components/AddBookModal";
import { prefsStorage, type AddBookPreference } from "@/lib/storage";
import { useMyBooks, useDeleteBook } from "@/features/books/hooks/useBooks";
import type { Book } from "@/types";
import type { ProfileStackParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ProfileStackParamList, "MyBooks">;
type StatusFilter = "all" | "available" | "in_exchange" | "returned";

const STATUS_COLOR: Record<string, string> = {
  available: "#22C55E",
  in_exchange: "#F59E0B",
  returned: "#6B7280",
};

const CONDITION_LABELS: Record<string, string> = {
  new: "New",
  like_new: "Like New",
  good: "Good",
  acceptable: "Acceptable",
};

export function MyBooksScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const navigation = useNavigation<Nav>();
  const { data: books, isLoading, isRefetching, refetch } = useMyBooks();
  const deleteBook = useDeleteBook();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [modalVisible, setModalVisible] = useState(false);

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: t("books.filter.all", "All") },
    { key: "available", label: t("books.filter.available", "Available") },
    { key: "in_exchange", label: t("books.filter.inExchange", "In Exchange") },
    { key: "returned", label: t("books.filter.returned", "Returned") },
  ];

  const statusCounts = useMemo(() => {
    const all = books ?? [];
    return {
      all: all.length,
      available: all.filter((b: any) => (b.status ?? "available") === "available").length,
      in_exchange: all.filter((b: any) => (b.status ?? "available") === "in_exchange").length,
      returned: all.filter((b: any) => (b.status ?? "available") === "returned").length,
    };
  }, [books]);

  const filtered = useMemo(() => {
    let list = books ?? [];
    if (statusFilter !== "all") {
      list = list.filter((b: any) => (b.status ?? "available") === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q),
      );
    }
    return list;
  }, [books, statusFilter, search]);

  const handleDelete = useCallback(
    (book: Book) => {
      Alert.alert(
        t("books.myBooks.deleteTitle", "Delete book?"),
        t("books.myBooks.deleteMsg", 'Remove "{{title}}" from your listings?', {
          title: book.title,
        }),
        [
          { text: t("common.cancel", "Cancel"), style: "cancel" },
          {
            text: t("common.delete", "Delete"),
            style: "destructive",
            onPress: () => deleteBook.mutate(book.id),
          },
        ],
      );
    },
    [deleteBook, t],
  );

  const goToDetail = useCallback(
    (bookId: string) => navigation.navigate("BookDetail", { bookId }),
    [navigation],
  );

  const navigateToChoice = useCallback(
    (choice: AddBookPreference) => {
      if (choice === "scan") {
        const tabNav = navigation.getParent();
        (tabNav as any)?.navigate("ScanTab");
      } else {
        navigation.navigate("AddBook");
      }
    },
    [navigation],
  );

  const handleFabPress = useCallback(() => {
    const saved = prefsStorage.getAddBookPref();
    if (saved) {
      navigateToChoice(saved);
    } else {
      setModalVisible(true);
    }
  }, [navigateToChoice]);

  const handleFabLongPress = useCallback(() => {
    prefsStorage.clearAddBookPref();
    setModalVisible(true);
  }, []);

  const handleModalSelect = useCallback(
    (choice: AddBookPreference, remember: boolean) => {
      setModalVisible(false);
      if (remember) prefsStorage.setAddBookPref(choice);
      navigateToChoice(choice);
    },
    [navigateToChoice],
  );

  const renderBook = useCallback(
    ({ item }: { item: Book }) => {
      const statusKey = (item as any).status ?? "available";
      const coverUri = (item as any).cover_url || item.photos?.[0]?.image;
      const condition = (item as any).condition;

      return (
        <Pressable
          style={({ pressed }) => [
            s.card,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={() => goToDetail(item.id)}
        >
          {/* Cover */}
          <View style={[s.coverWrap, { backgroundColor: accent + "12" }]}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={s.cover} contentFit="cover" />
            ) : (
              <BookOpen size={26} color={accent} />
            )}
          </View>

          {/* Info */}
          <View style={s.cardBody}>
            <View style={s.cardTop}>
              <View style={s.cardInfo}>
                <Text
                  style={[s.cardTitle, { color: c.text.primary }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={[s.cardAuthor, { color: c.text.secondary }]}
                  numberOfLines={1}
                >
                  {item.author}
                </Text>
              </View>
              <ChevronRight size={18} color={c.text.placeholder} />
            </View>

            {/* Bottom row: status + condition + delete */}
            <View style={s.cardBottom}>
              <View style={s.tagsRow}>
                <View style={[s.statusTag, { backgroundColor: (STATUS_COLOR[statusKey] ?? "#6B7280") + "18" }]}>
                  <View
                    style={[
                      s.statusDot,
                      { backgroundColor: STATUS_COLOR[statusKey] ?? "#6B7280" },
                    ]}
                  />
                  <Text
                    style={[
                      s.statusTagText,
                      { color: STATUS_COLOR[statusKey] ?? "#6B7280" },
                    ]}
                  >
                    {t(`books.status.${statusKey}`, statusKey) as string}
                  </Text>
                </View>
                {condition && (
                  <View style={[s.conditionTag, { backgroundColor: cardBorder + "40" }]}>
                    <Sparkles size={10} color={c.text.secondary} />
                    <Text style={[s.conditionText, { color: c.text.secondary }]}>
                      {CONDITION_LABELS[condition] ?? condition}
                    </Text>
                  </View>
                )}
              </View>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleDelete(item);
                }}
                hitSlop={12}
                style={s.deleteBtn}
              >
                <Trash2 size={15} color={c.text.placeholder} />
              </Pressable>
            </View>
          </View>
        </Pressable>
      );
    },
    [cardBg, cardBorder, accent, c, goToDetail, handleDelete, t],
  );

  const ListHeader = (
    <View>
      {/* Search bar */}
      <View
        style={[
          s.searchBar,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
          },
        ]}
      >
        <Search size={18} color={c.text.placeholder} />
        <TextInput
          style={[s.searchInput, { color: c.text.primary }]}
          placeholder={t("books.myBooks.search", "Search your books...")}
          placeholderTextColor={c.text.placeholder}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <X size={16} color={c.text.placeholder} />
          </Pressable>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
      >
        {filters.map(({ key, label }) => {
          const active = statusFilter === key;
          const count = statusCounts[key];
          return (
            <Pressable
              key={key}
              onPress={() => setStatusFilter(key)}
              style={[
                s.filterChip,
                {
                  backgroundColor: active ? accent + "18" : "transparent",
                  borderColor: active ? accent : cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  s.filterLabel,
                  { color: active ? accent : c.text.secondary },
                ]}
              >
                {label}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    s.filterBadge,
                    {
                      backgroundColor: active ? accent : c.text.placeholder + "25",
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.filterBadgeText,
                      { color: active ? "#fff" : c.text.secondary },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[s.root, { backgroundColor: bg }]}>
        <View style={s.listContent}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderBook}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={[
          s.listContent,
          filtered.length === 0 && (books ?? []).length > 0 && s.searchEmptyPad,
        ]}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isRefetching}
        ListEmptyComponent={
          search.trim() || statusFilter !== "all" ? (
            <EmptyState
              icon={Search}
              title={t("books.myBooks.noResults", "No matches")}
              subtitle={t(
                "books.myBooks.noResultsSub",
                "Try a different search or filter.",
              )}
              compact
            />
          ) : (
            <EmptyState
              icon={BookOpen}
              title={t("books.myBooks.emptyTitle", "No books yet")}
              subtitle={t(
                "books.myBooks.emptySub",
                "Scan a barcode or add a book manually to get started.",
              )}
              actionLabel={t("books.myBooks.addFirst", "Add your first book")}
              onAction={handleFabPress}
            />
          )
        }
      />

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [
          s.fab,
          { backgroundColor: accent, opacity: pressed ? 0.9 : 1 },
        ]}
        onPress={handleFabPress}
        onLongPress={handleFabLongPress}
        delayLongPress={500}
      >
        <Plus size={24} color="#152018" strokeWidth={2.5} />
      </Pressable>

      <AddBookModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={handleModalSelect}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 20,
    gap: spacing.sm,
  },
  searchEmptyPad: { paddingBottom: 0 },

  /* ── Search ── */
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },

  /* ── Filters ── */
  filterRow: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingBottom: spacing.md,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  filterLabel: { fontSize: 13, fontWeight: "600" },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  filterBadgeText: { fontSize: 10, fontWeight: "700" },

  /* ── Card ── */
  card: {
    flexDirection: "row",
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  coverWrap: {
    width: 80,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cover: { width: 80, height: 100 },

  cardBody: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardAuthor: { fontSize: 13 },

  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tagsRow: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  statusTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTagText: { fontSize: 11, fontWeight: "600" },
  conditionTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  conditionText: { fontSize: 11, fontWeight: "500" },

  deleteBtn: { padding: spacing.xs },

  /* ── FAB ── */
  fab: {
    position: "absolute",
    bottom: 110,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
});
