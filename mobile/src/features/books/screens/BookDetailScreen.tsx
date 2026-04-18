import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Image } from "expo-image";
import {
  ArrowLeftRight,
  BookOpen,
  ChevronRight,
  FileText,
  Flag,
  Globe,
  Heart,
  MapPin,
  Repeat2,
  Sparkles,
  Tag,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SkeletonBookDetail } from "@/components/Skeleton";
import { showErrorToast } from "@/components/Toast";
import { Avatar } from "@/components/Avatar";
import { radius, shadows, spacing } from "@/constants/theme";
import { useColors, useIsDark } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";
import { ReportSheet } from "@/features/trust-safety/components/ReportSheet";
import { useBookDetail } from "../hooks/useBooks";
import { useBookWishlistStatus, useAddWishlistItem, useRemoveWishlistItem } from "../hooks/useWishlist";
import { GENRE_VALUE_TO_I18N_KEY, type GenreValue } from "../constants";

type Route = RouteProp<{ BookDetail: { bookId: string } }, "BookDetail">;

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
  const currentUserId = useAuthStore((s) => s.user?.id);

  const { data: rawBook, isLoading } = useBookDetail(params.bookId);
  const { data: wishlistEntry, isLoading: wishlistLoading } = useBookWishlistStatus(params.bookId);
  const addWishlist = useAddWishlistItem();
  const removeWishlist = useRemoveWishlistItem();
  const [reportVisible, setReportVisible] = useState(false);

  const isWishlisted = !!wishlistEntry;
  const wishlistBusy = addWishlist.isPending || removeWishlist.isPending;

  const handleWishlistPress = useCallback(() => {
    if (wishlistBusy) return;

    if (isWishlisted && wishlistEntry) {
      Alert.alert(
        t("books.wishlist.removeTitle", "Remove from Wishlist"),
        t("books.wishlist.removeMsg", "Are you sure you want to remove this book from your wishlist?"),
        [
          { text: t("common.cancel", "Cancel"), style: "cancel" },
          {
            text: t("common.remove", "Remove"),
            style: "destructive",
            onPress: () =>
              removeWishlist.mutate(
                { id: wishlistEntry.id, bookId: params.bookId },
                {
                  onError: () =>
                    showErrorToast(
                      t(
                        "books.wishlist.removeError",
                        "Could not remove from wishlist. Try again.",
                      ),
                    ),
                },
              ),
          },
        ],
      );
    } else {
      addWishlist.mutate(
        { book: params.bookId },
        {
          onError: () =>
            showErrorToast(
              t("books.wishlist.addError", "Failed to add to wishlist"),
            ),
        },
      );
    }
  }, [wishlistBusy, isWishlisted, wishlistEntry, addWishlist, removeWishlist, params.bookId, t]);

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
  const coverUri = book.cover_url || book.photos?.[0]?.image || null;
  const coverBg = COVER_COLORS[book.id.charCodeAt(0) % COVER_COLORS.length];
  const isAvailable = book.status === "available";
  const isOwnBook = owner?.id === currentUserId;
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
              accessibilityRole="image"
              accessibilityLabel={t("books.coverImageA11y", "{{title}} cover image", {
                title: book.title,
              })}
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
                {GENRE_VALUE_TO_I18N_KEY[genres[0] as GenreValue]
                  ? t(`books.genres.${GENRE_VALUE_TO_I18N_KEY[genres[0] as GenreValue]}`, {
                      defaultValue: genres[0],
                    })
                  : genres[0]}
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
              {t(`books.conditions.${book.condition}`, { defaultValue: book.condition })}
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
                {t("books.genresHeading", "Genres")}
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isOwnBook
                ? t("books.listedByYouA11y", "Listed by you")
                : t("books.viewOwnerProfileA11y", "View {{name}}'s profile", { name: ownerName })
            }
            accessibilityState={{ disabled: isOwnBook }}
            onPress={() => {
              if (!isOwnBook) navigation.navigate('UserProfile', { userId: owner.id });
            }}
            disabled={isOwnBook}
            style={({ pressed }) => [
              s.ownerStrip,
              { borderTopColor: cardBorder },
              !isOwnBook && pressed && { opacity: 0.7 },
            ]}
          >
            <Avatar
              uri={owner.avatar}
              name={ownerName}
              size={38}
            />
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
            {!isOwnBook && <ChevronRight size={18} color={c.text.placeholder} />}
          </Pressable>
        )}

        {/* Report book */}
        {!isOwnBook && owner && (
          <View style={s.reportRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("report.button", "Report")}
              onPress={() => setReportVisible(true)}
              style={({ pressed }) => [s.reportBtn, pressed && { opacity: 0.6 }]}
            >
              <Flag size={14} color={c.text.placeholder} />
              <Text style={[s.reportText, { color: c.text.placeholder }]}>
                {t('report.button', 'Report')}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={s.bottomSpacer} />
      </ScrollView>

      {!isOwnBook && owner && (
        <ReportSheet
          visible={reportVisible}
          onClose={() => setReportVisible(false)}
          reportedUserId={owner.id}
          reportedBookId={book.id}
        />
      )}

      {!isOwnBook && (
        <View style={[s.ctaWrap, { borderTopColor: cardBorder }]}>
          {isAvailable && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("books.requestSwap", "Request Swap")}
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
            accessibilityRole="button"
            accessibilityLabel={
              isWishlisted
                ? t("books.wishlist.removeFromA11y", "Remove from wishlist")
                : t("books.wishlist.addToA11y", "Add to wishlist")
            }
            accessibilityState={{ disabled: wishlistBusy || wishlistLoading }}
            onPress={handleWishlistPress}
            disabled={wishlistBusy || wishlistLoading}
            style={({ pressed }) => [
              s.wishlistBtn,
              isWishlisted
                ? { backgroundColor: accent, borderColor: accent }
                : { borderColor: accent },
              { opacity: pressed || wishlistBusy ? 0.7 : 1 },
            ]}
          >
            {wishlistBusy ? (
              <ActivityIndicator size="small" color={isWishlisted ? "#fff" : accent} />
            ) : (
              <Heart
                size={18}
                color={isWishlisted ? "#fff" : accent}
                fill={isWishlisted ? "#fff" : "none"}
              />
            )}
          </Pressable>
        </View>
      )}
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  ctaBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: radius.xl,
  },
  ctaBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  wishlistBtn: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },

  reportRow: {
    alignItems: "center",
    marginTop: spacing.sm,
  },
  reportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  reportText: {
    fontSize: 13,
    fontWeight: "500",
  },

  bottomSpacer: { height: 20 },
});
