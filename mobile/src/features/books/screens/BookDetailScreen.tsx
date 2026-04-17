import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Image } from "expo-image";
import {
  ArrowLeftRight,
  BookOpen,
  FileText,
  Globe,
  Heart,
  MapPin,
  Repeat2,
  Sparkles,
  Tag,
} from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SkeletonBookDetail } from "@/components/Skeleton";
import { radius, shadows, spacing } from "@/constants/theme";
import { useColors, useIsDark } from "@/hooks/useColors";
import { useBookDetail } from "../hooks/useBooks";
import { AddWishlistSheet } from "../components/AddWishlistSheet";

type Route = RouteProp<{ BookDetail: { bookId: string } }, "BookDetail">;

const CONDITION_LABELS: Record<string, string> = {
  new: "New",
  like_new: "Like New",
  good: "Good",
  acceptable: "Acceptable",
};

const AVATAR_GRADIENTS = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
];

const COVER_COLORS = ["#2D5F3F", "#3B4F7A", "#6B3A5E", "#7A5C2E", "#2B4E5F"];

interface BookOwner {
  id: string;
  username: string;
  avatar: string | null;
  neighborhood: string;
  avg_rating: string;
}

export function BookDetailScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const { params } = useRoute<Route>();
  const navigation = useNavigation<any>();
  const [wishlistOpen, setWishlistOpen] = useState(false);

  const { data: rawBook, isLoading } = useBookDetail(params.bookId);

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  if (isLoading) {
    return (
      <View style={[s.root, { backgroundColor: bg }]}>
        <SkeletonBookDetail />
      </View>
    );
  }

  if (!rawBook) {
    return (
      <View style={[s.centered, { backgroundColor: bg }]}>
        <Text style={[s.notFound, { color: c.text.secondary }]}>
          {t("books.notFound", "Book not found")}
        </Text>
      </View>
    );
  }

  const book = rawBook as any;
  const owner: BookOwner | null =
    typeof book.owner === "object" && book.owner !== null ? book.owner : null;
  const ownerName = owner?.username ?? "Unknown";
  const ownerInitial = ownerName.charAt(0).toUpperCase();
  const coverUri = book.cover_url || book.photos?.[0]?.image || null;
  const coverBg = COVER_COLORS[book.id.charCodeAt(0) % COVER_COLORS.length];
  const isAvailable = book.status === "available";
  const genres: string[] = Array.isArray(book.genres)
    ? book.genres
    : book.genre
      ? [book.genre]
      : [];

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cover Hero ── */}
        <View style={[s.coverHero, { borderColor: cardBorder }]}>
          {coverUri ? (
            <Image
              source={{ uri: coverUri }}
              style={s.coverImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[s.coverPlaceholder, { backgroundColor: coverBg }]}>
              <Text style={s.coverTitle} numberOfLines={3}>
                {book.title}
              </Text>
              <Text style={s.coverAuthor}>{book.author}</Text>
            </View>
          )}
          {isAvailable && (
            <View style={[s.availBadge, { backgroundColor: accent }]}>
              <Text style={s.availBadgeText}>
                {t("books.available", "Available")}
              </Text>
            </View>
          )}
        </View>

        {/* ── Title + Author ── */}
        <View style={s.titleSection}>
          <Text style={[s.title, { color: c.text.primary }]}>{book.title}</Text>
          <Text style={[s.author, { color: c.text.secondary }]}>
            {book.author}
          </Text>
        </View>

        {/* ── Meta pills ── */}
        <View style={s.metaRow}>
          {genres.length > 0 && (
            <View
              style={[
                s.metaPill,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <Tag size={14} color={accent} />
              <Text style={[s.metaText, { color: c.text.primary }]}>
                {genres[0]}
              </Text>
            </View>
          )}
          <View
            style={[
              s.metaPill,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <Sparkles size={14} color={accent} />
            <Text style={[s.metaText, { color: c.text.primary }]}>
              {CONDITION_LABELS[book.condition] ?? book.condition}
            </Text>
          </View>
          {book.language && (
            <View
              style={[
                s.metaPill,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <Globe size={14} color={accent} />
              <Text style={[s.metaText, { color: c.text.primary }]}>
                {book.language.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* ── Description ── */}
        <View style={s.descSection}>
          <View style={s.cardHeader}>
            <BookOpen size={16} color={accent} />
            <Text style={[s.cardLabel, { color: c.text.secondary }]}>
              {t("books.description", "Description")}
            </Text>
          </View>
          {book.description ? (
            <Text style={[s.description, { color: c.text.primary }]}>
              {book.description}
            </Text>
          ) : (
            <View style={s.inlineEmpty}>
              <FileText size={18} color={c.text.placeholder} />
              <Text style={[s.inlineEmptyText, { color: c.text.placeholder }]}>
                {t("books.noDescription", "No description added yet")}
              </Text>
            </View>
          )}
        </View>

        {/* ── Genres (empty state) ── */}
        {genres.length === 0 && (
          <View style={[s.descSection, { marginTop: 0 }]}>
            <View style={s.cardHeader}>
              <Tag size={16} color={accent} />
              <Text style={[s.cardLabel, { color: c.text.secondary }]}>
                {t("books.genres", "Genres")}
              </Text>
            </View>
            <View style={s.inlineEmpty}>
              <Text style={[s.inlineEmptyText, { color: c.text.placeholder }]}>
                {t("books.noGenres", "No genres specified")}
              </Text>
            </View>
          </View>
        )}

        {/* ── Listed by ── */}
        {owner && (
          <View style={[s.ownerStrip, { borderTopColor: cardBorder }]}>
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
              <Text style={s.ownerInitial}>{ownerInitial}</Text>
            </View>
            <View style={s.ownerInfo}>
              <Text style={[s.ownerName, { color: c.text.primary }]}>
                {ownerName}
              </Text>
              <View style={s.ownerStatsRow}>
                {owner.neighborhood ? (
                  <>
                    <MapPin size={12} color={c.text.placeholder} />
                    <Text style={[s.ownerStat, { color: c.text.secondary }]}>
                      {owner.neighborhood}
                    </Text>
                    <Text style={[s.ownerDot, { color: c.text.placeholder }]}>
                      ·
                    </Text>
                  </>
                ) : null}
                <Repeat2 size={12} color={c.text.placeholder} />
                <Text style={[s.ownerStat, { color: c.text.secondary }]}>
                  {t("books.rating", "{{rating}}★", {
                    rating: owner.avg_rating ?? "0",
                  })}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={s.bottomSpacer} />
      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={[s.ctaWrap, { borderTopColor: cardBorder }]}>
        {isAvailable && (
          <Pressable
            onPress={() => navigation.navigate("RequestSwap", { bookId: book.id })}
            style={({ pressed }) => [
              s.ctaBtn,
              { backgroundColor: accent, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <ArrowLeftRight size={18} color="#fff" />
            <Text style={s.ctaBtnText}>
              {t("books.requestSwap", "Request Swap")}
            </Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => setWishlistOpen(true)}
          style={({ pressed }) => [
            s.ctaBtnSecondary,
            { borderColor: accent, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Heart size={18} color={accent} />
          <Text style={[s.ctaBtnSecondaryText, { color: accent }]}>
            {t("books.saveToWishlist", "Save to Wishlist")}
          </Text>
        </Pressable>
      </View>

      <AddWishlistSheet
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        prefill={{
          title: book.title,
          author: book.author,
          isbn: book.isbn,
          genre: genres[0],
          cover_url: coverUri ?? undefined,
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingBottom: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFound: { fontSize: 16 },

  coverHero: {
    height: 280,
    objectFit: "cover",
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
  },
  coverImage: { width: "100%", height: "100%" },
  coverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  coverTitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  coverAuthor: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  availBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  availBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  titleSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  author: { fontSize: 15 },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  metaText: { fontSize: 13, fontWeight: "600" },

  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md + 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.sm,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  descSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  description: { fontSize: 15, lineHeight: 24 },
  inlineEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: spacing.sm,
  },
  inlineEmptyText: { fontSize: 14, fontStyle: "italic" },

  ownerStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ownerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerInitial: { color: "#fff", fontSize: 17, fontWeight: "700" },
  ownerInfo: { flex: 1 },
  ownerName: { fontSize: 15, fontWeight: "700" },
  ownerStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  ownerStat: { fontSize: 12, fontWeight: "500" },
  ownerDot: { fontSize: 12 },

  ctaWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: radius.xl,
  },
  ctaBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  ctaBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },
  ctaBtnSecondaryText: { fontSize: 15, fontWeight: "700" },

  bottomSpacer: { height: 20 },
});
