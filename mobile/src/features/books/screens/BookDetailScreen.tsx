import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Image } from "expo-image";
import {
  AlertTriangle,
  ArrowLeftRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Flag,
  Globe,
  Heart,
  MapPin,
  Pencil,
  Repeat2,
  RotateCcw,
  Sparkles,
  Tag,
  XCircle,
} from "lucide-react-native";
import React, { useCallback, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Dimensions, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SkeletonBookDetail } from "@/components/Skeleton";
import { showErrorToast, showInfoToast } from "@/components/Toast";
import { EmptyState } from "@/components/EmptyState";
import { Avatar } from "@/components/Avatar";
import { radius, shadows, spacing } from "@/constants/theme";
import { useColors, useIsDark } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";
import { useEmailVerificationGate } from "@/hooks/useEmailVerificationGate";
import { ReportSheet } from "@/features/trust-safety/components/ReportSheet";
import { useBookDetail, useUpdateBook } from "../hooks/useBooks";
import { useBookWishlistStatus, useAddWishlistItem, useRemoveWishlistItem } from "../hooks/useWishlist";
import { GENRE_VALUE_TO_I18N_KEY, type GenreValue } from "../constants";
import { useBookExchangeStatus } from "@/features/exchanges/hooks/useBookExchangeStatus";
import { useCancelExchange } from "@/features/exchanges/hooks/useExchanges";
import type { ExchangeStatus } from "@/types";

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
  const { requireVerified } = useEmailVerificationGate();

  const { data: rawBook, isLoading, isError, refetch } = useBookDetail(params.bookId);
  const { data: wishlistEntry, isLoading: wishlistLoading } = useBookWishlistStatus(params.bookId);
  const addWishlist = useAddWishlistItem();
  const removeWishlist = useRemoveWishlistItem();
  const updateBook = useUpdateBook(params.bookId);
  const { exchange: existingExchange, status: exchangeStatus } = useBookExchangeStatus(params.bookId);
  const cancelExchange = useCancelExchange();
  const [reportVisible, setReportVisible] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

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

  const ownBookDetected = !isLoading && rawBook && (rawBook as any).owner?.id === currentUserId;
  useLayoutEffect(() => {
    if (!ownBookDetected) return;
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate("EditBook", { bookId: params.bookId })}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("books.editBookA11y", "Edit book")}
          style={{ marginHorizontal: 0.5, justifyContent: "center", alignItems: "center" }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              borderWidth: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: isDark ? c.auth.card : c.surface.white,
              borderColor: isDark ? c.auth.cardBorder : c.border.default,
            }}
          >
            <Pencil size={18} color={isDark ? c.auth.golden : c.text.primary} />
          </View>
        </Pressable>
      ),
    });
  }, [ownBookDetected, navigation, params.bookId, t, isDark, c]);

  const handleStatusToggle = useCallback(() => {
    if (!rawBook || updateBook.isPending) return;
    const book = rawBook as any;
    const newStatus = book.status === "available" ? "returned" : "available";
    updateBook.mutate(
      { status: newStatus },
      {
        onError: () =>
          showErrorToast(t("books.statusToggleError", "Could not update status. Try again.")),
      },
    );
  }, [rawBook, updateBook, t]);

  if (isLoading) {
    return (
      <View style={[s.root, { backgroundColor: bg }]}>
        <SkeletonBookDetail />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[s.centered, { backgroundColor: bg }]}>
        <EmptyState
          icon={AlertTriangle}
          title={t("common.loadError", "Something went wrong")}
          subtitle={t("common.loadErrorHint", "Check your connection and try again.")}
          actionLabel={t("common.retry", "Retry")}
          onAction={() => refetch()}
        />
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
  const ownerName = owner?.username ?? t("common.unknownUser", "Unknown");

  const photoUris: string[] = [];
  if (book.cover_url) photoUris.push(book.cover_url);
  if (Array.isArray(book.photos)) {
    for (const p of book.photos) {
      const uri = p.image;
      if (uri && !photoUris.includes(uri)) photoUris.push(uri);
    }
  }
  const coverUri = photoUris[0] ?? null;
  const hasMultiplePhotos = photoUris.length > 1;

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
        {/* ── Cover Hero / Photo Gallery ── */}
        {hasMultiplePhotos ? (
          <>
            <View style={[s.coverHero, { borderColor: cardBorder }]}>
              <FlatList
                data={photoUris}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => String(i)}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / (Dimensions.get("window").width - spacing.sm * 2));
                  setActivePhotoIdx(idx);
                }}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={[s.coverImage, { width: Dimensions.get("window").width - spacing.sm * 2 }]}
                    contentFit="cover"
                    transition={200}
                  />
                )}
              />
              {isAvailable && (
                <View style={[s.availBadge, { backgroundColor: accent }]}>
                  <Text style={s.availBadgeText}>
                    {t("books.status.available", "Available")}
                  </Text>
                </View>
              )}
            </View>
            <View style={s.dotsRow}>
              {photoUris.map((_, i) => (
                <View
                  key={i}
                  style={[s.dot, { backgroundColor: i === activePhotoIdx ? accent : accent + '40' }]}
                />
              ))}
            </View>
          </>
        ) : (
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
                  {t("books.status.available", "Available")}
                </Text>
              </View>
            )}
          </View>
        )}

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
        <ExchangeAwareCta
          bookId={book.id}
          isAvailable={isAvailable}
          exchangeStatus={exchangeStatus}
          exchangeId={existingExchange?.id ?? null}
          isWishlisted={isWishlisted}
          wishlistBusy={wishlistBusy}
          wishlistLoading={wishlistLoading}
          onWishlistPress={handleWishlistPress}
          onRequestSwap={() => requireVerified(() => navigation.navigate("RequestSwap", { bookId: book.id }))}
          onViewExchange={(exId) => navigation.navigate("ExchangeDetail", { exchangeId: exId })}
          onCancelExchange={(exId) => {
            Alert.alert(
              t("exchanges.bookCta.cancelConfirmTitle", "Cancel Request"),
              t("exchanges.bookCta.cancelConfirmMsg", "Are you sure you want to cancel this swap request?"),
              [
                { text: t("common.cancel", "Cancel"), style: "cancel" },
                {
                  text: t("exchanges.bookCta.cancelRequest", "Cancel Request"),
                  style: "destructive",
                  onPress: () =>
                    cancelExchange.mutate(exId, {
                      onSuccess: () => showInfoToast(t("exchanges.requestSent", "Request cancelled")),
                      onError: () => showErrorToast(t("common.error", "Something went wrong")),
                    }),
                },
              ],
            );
          }}
          cancelPending={cancelExchange.isPending}
          accent={accent}
          cardBorder={cardBorder}
          isDark={isDark}
          colors={c}
        />
      )}

      {isOwnBook && (
        <View style={[s.ctaWrap, { borderTopColor: cardBorder }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("books.editBook.title", "Edit Book")}
            onPress={() => navigation.navigate("EditBook", { bookId: book.id })}
            style={({ pressed }) => [
              s.ctaBtn,
              { backgroundColor: accent, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Pencil size={18} color="#152018" />
            <Text style={[s.ctaBtnText, { color: "#152018" }]}>
              {t("books.editBook.title", "Edit Book")}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="switch"
            accessibilityLabel={
              isAvailable
                ? t("books.markUnavailableA11y", "Mark as unavailable")
                : t("books.markAvailableA11y", "Mark as available")
            }
            accessibilityState={{ checked: isAvailable }}
            onPress={handleStatusToggle}
            disabled={updateBook.isPending}
            style={({ pressed }) => [
              s.statusToggle,
              isAvailable
                ? { backgroundColor: '#22C55E', borderColor: '#22C55E' }
                : { backgroundColor: isDark ? c.auth.card : c.neutral[200], borderColor: cardBorder },
              { opacity: pressed || updateBook.isPending ? 0.7 : 1 },
            ]}
          >
            {updateBook.isPending ? (
              <ActivityIndicator size="small" color={isAvailable ? '#fff' : c.text.secondary} />
            ) : (
              <Text
                style={[
                  s.statusToggleText,
                  { color: isAvailable ? '#fff' : c.text.secondary },
                ]}
                numberOfLines={1}
              >
                {isAvailable
                  ? t("books.statusAvailable", "Available")
                  : t("books.statusUnavailable", "Unavailable")}
              </Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

// Statuses that allow re-requesting (treated as "no exchange")
const RE_REQUESTABLE: ExchangeStatus[] = ["cancelled", "expired", "declined"];

function getStatusConfig(status: ExchangeStatus | null, t: (key: string, fallback: string) => string) {
  switch (status) {
    case "pending":
      return { label: t("exchanges.bookCta.swapRequested", "Swap Requested"), icon: Clock, color: "#F59E0B" };
    case "accepted":
    case "conditions_pending":
      return { label: t("exchanges.status.accepted", "Accepted"), icon: CheckCircle2, color: "#22C55E" };
    case "active":
    case "swap_confirmed":
      return { label: t("exchanges.bookCta.swapActive", "Swap Active"), icon: ArrowLeftRight, color: "#3B82F6" };
    case "completed":
      return { label: t("exchanges.bookCta.swapCompleted", "Completed"), icon: CheckCircle2, color: "#22C55E" };
    case "return_requested":
      return { label: t("exchanges.bookCta.returnRequested", "Return Requested"), icon: RotateCcw, color: "#F59E0B" };
    case "returned":
      return { label: t("exchanges.bookCta.returned", "Returned"), icon: RotateCcw, color: "#6B7280" };
    default:
      return null;
  }
}

interface ExchangeAwareCtaProps {
  bookId: string;
  isAvailable: boolean;
  exchangeStatus: ExchangeStatus | null;
  exchangeId: string | null;
  isWishlisted: boolean;
  wishlistBusy: boolean;
  wishlistLoading: boolean;
  onWishlistPress: () => void;
  onRequestSwap: () => void;
  onViewExchange: (exchangeId: string) => void;
  onCancelExchange: (exchangeId: string) => void;
  cancelPending: boolean;
  accent: string;
  cardBorder: string;
  isDark: boolean;
  colors: any;
}

function ExchangeAwareCta({
  isAvailable,
  exchangeStatus,
  exchangeId,
  isWishlisted,
  wishlistBusy,
  wishlistLoading,
  onWishlistPress,
  onRequestSwap,
  onViewExchange,
  onCancelExchange,
  cancelPending,
  accent,
  cardBorder,
  isDark,
  colors: c,
}: ExchangeAwareCtaProps) {
  const { t } = useTranslation();

  const hasActiveExchange = exchangeStatus && !RE_REQUESTABLE.includes(exchangeStatus);
  const statusConfig = hasActiveExchange ? getStatusConfig(exchangeStatus, t) : null;

  if (hasActiveExchange && statusConfig && exchangeId) {
    return (
      <View style={[s.ctaWrap, { borderTopColor: cardBorder }]}>
        <View style={s.exchangeCtaContent}>
          {/* Status pill */}
          <View style={[s.statusPill, { backgroundColor: statusConfig.color + "18", borderColor: statusConfig.color + "40" }]}>
            <statusConfig.icon size={14} color={statusConfig.color} />
            <Text style={[s.statusPillText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={s.exchangeBtnRow}>
            {exchangeStatus === "pending" ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("exchanges.bookCta.cancelRequest", "Cancel Request")}
                onPress={() => onCancelExchange(exchangeId)}
                disabled={cancelPending}
                style={({ pressed }) => [
                  s.exchangeBtn,
                  { borderColor: "#EF4444", opacity: pressed || cancelPending ? 0.7 : 1 },
                ]}
              >
                {cancelPending ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <XCircle size={16} color="#EF4444" />
                    <Text style={[s.exchangeBtnText, { color: "#EF4444" }]}>
                      {t("exchanges.bookCta.cancelRequest", "Cancel Request")}
                    </Text>
                  </>
                )}
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("exchanges.bookCta.viewExchange", "View Exchange")}
                onPress={() => onViewExchange(exchangeId)}
                style={({ pressed }) => [
                  s.exchangeBtn,
                  { borderColor: accent, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Eye size={16} color={accent} />
                <Text style={[s.exchangeBtnText, { color: accent }]}>
                  {t("exchanges.bookCta.viewExchange", "View Exchange")}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  }

  // Default: "Request Swap" + Wishlist
  return (
    <View style={[s.ctaWrap, { borderTopColor: cardBorder }]}>
      {isAvailable && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("books.requestSwap", "Request Swap")}
          onPress={onRequestSwap}
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
        onPress={onWishlistPress}
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
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingTop: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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

  statusToggle: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
  },
  statusToggleText: {
    fontSize: 13,
    fontWeight: "700",
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

  exchangeCtaContent: {
    flex: 1,
    gap: spacing.sm,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: "700",
  },
  exchangeBtnRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  exchangeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 14,
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },
  exchangeBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
