import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import axios from "axios";
import { AlertTriangle, Pencil } from "lucide-react-native";
import React, { useCallback, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { EmptyState } from "@/components/EmptyState";
import { SkeletonBookDetail } from "@/components/Skeleton";
import { showErrorToast, showInfoToast } from "@/components/Toast";
import { useBookExchangeStatus } from "@/features/exchanges/hooks/useBookExchangeStatus";
import { useCancelExchange } from "@/features/exchanges/hooks/useExchanges";
import { ReportSheet } from "@/features/trust-safety/components/ReportSheet";
import { useColors, useIsDark } from "@/hooks/useColors";
import { useEmailVerificationGate } from "@/hooks/useEmailVerificationGate";
import { useAuthStore } from "@/stores/authStore";

import {
  CoverGallery,
  DescriptionSection,
  ExchangeAwareCta,
  MetaPills,
  OwnerCta,
  OwnerStrip,
  ReportRow,
  bookDetailStyles as s,
  type BookDetailData,
  type BookOwner,
} from "../components/detail";
import { useBookDetail, useUpdateBook } from "../hooks/useBooks";
import { useWishlistToggle } from "../hooks/useWishlistToggle";

type Route = RouteProp<{ BookDetail: { bookId: string } }, "BookDetail">;

// BookDetailScreen is registered in HomeStack, BrowseStack, MessagesStack,
// and ProfileStack. Rather than hard-couple to one of them, we declare a
// local nav-param shape listing only the routes this screen navigates to.
// (AUD-M-407 — replaces `useNavigation<any>()`.)
type BookDetailNavParams = {
  EditBook: { bookId: string };
  RequestSwap: { bookId: string };
  ExchangeDetail: { exchangeId: string };
};
type Nav = NativeStackNavigationProp<BookDetailNavParams>;

export function BookDetailScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { requireVerified } = useEmailVerificationGate();

  const {
    data: rawBook,
    isLoading,
    isError,
    error,
    refetch,
  } = useBookDetail(params.bookId);
  const isNotFound =
    isError && axios.isAxiosError(error) && error.response?.status === 404;
  const updateBook = useUpdateBook(params.bookId);
  const wishlist = useWishlistToggle(params.bookId);
  const { exchange: existingExchange, status: exchangeStatus } =
    useBookExchangeStatus(params.bookId);
  const cancelExchange = useCancelExchange();
  const [reportVisible, setReportVisible] = useState(false);

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  const detail = rawBook as unknown as BookDetailData | undefined;
  const ownBookDetected =
    !isLoading &&
    detail &&
    typeof detail.owner === "object" &&
    detail.owner?.id === currentUserId;

  useLayoutEffect(() => {
    if (!ownBookDetected) return;
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() =>
            navigation.navigate("EditBook", { bookId: params.bookId })
          }
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t("books.editBookA11y", "Edit book")}
          style={[
            s.editHeaderBtn,
            {
              backgroundColor: isDark ? c.auth.card : c.surface.white,
              borderColor: isDark ? c.auth.cardBorder : c.border.default,
            },
          ]}
        >
          <Pencil size={18} color={isDark ? c.auth.golden : c.text.primary} />
        </Pressable>
      ),
    });
  }, [ownBookDetected, navigation, params.bookId, t, isDark, c]);

  const handleStatusToggle = useCallback(() => {
    if (!rawBook || updateBook.isPending) return;
    const newStatus = rawBook.status === "available" ? "returned" : "available";
    updateBook.mutate(
      { status: newStatus },
      {
        onError: () =>
          showErrorToast(
            t("books.statusToggleError", "Could not update status. Try again."),
          ),
      },
    );
  }, [rawBook, updateBook, t]);

  const handleCancelExchange = useCallback(
    (exchangeId: string) => {
      Alert.alert(
        t("exchanges.bookCta.cancelConfirmTitle", "Cancel Request"),
        t(
          "exchanges.bookCta.cancelConfirmMsg",
          "Are you sure you want to cancel this swap request?",
        ),
        [
          { text: t("common.cancel", "Cancel"), style: "cancel" },
          {
            text: t("exchanges.bookCta.cancelRequest", "Cancel Request"),
            style: "destructive",
            onPress: () =>
              cancelExchange.mutate(exchangeId, {
                onSuccess: () =>
                  showInfoToast(
                    t("exchanges.requestSent", "Request cancelled"),
                  ),
                onError: () =>
                  showErrorToast(t("common.error", "Something went wrong")),
              }),
          },
        ],
      );
    },
    [cancelExchange, t],
  );

  if (isLoading) {
    return (
      <View style={[s.root, { backgroundColor: bg }]}>
        <SkeletonBookDetail />
      </View>
    );
  }

  if (isNotFound || (!isLoading && !isError && !rawBook)) {
    return (
      <View style={[s.centered, { backgroundColor: bg }]}>
        <Text style={[s.notFound, { color: c.text.secondary }]}>
          {t("books.notFound", "Book not found")}
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[s.centered, { backgroundColor: bg }]}>
        <EmptyState
          icon={AlertTriangle}
          title={t("common.loadError", "Something went wrong")}
          subtitle={t(
            "common.loadErrorHint",
            "Check your connection and try again.",
          )}
          actionLabel={t("common.retry", "Retry")}
          onAction={() => refetch()}
        />
      </View>
    );
  }

  if (!rawBook) {
    return null;
  }

  const book = rawBook as unknown as BookDetailData & typeof rawBook;
  const owner: BookOwner | null =
    typeof book.owner === "object" && book.owner !== null
      ? (book.owner as BookOwner)
      : null;

  const photoUris: string[] = [];
  if (book.cover_url) photoUris.push(book.cover_url);
  if (Array.isArray(book.photos)) {
    for (const p of book.photos) {
      const uri = p.image;
      if (uri && !photoUris.includes(uri)) photoUris.push(uri);
    }
  }

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
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            tintColor={accent}
          />
        }
      >
        <CoverGallery
          bookId={book.id}
          title={book.title}
          author={book.author}
          photoUris={photoUris}
          isAvailable={isAvailable}
          cardBorderColor={cardBorder}
          accent={accent}
        />

        <Animated.View entering={FadeIn.duration(300)} style={s.titleSection}>
          <Text style={[s.title, { color: c.text.primary }]}>{book.title}</Text>
          <Text style={[s.author, { color: c.text.secondary }]}>
            {book.author}
          </Text>
        </Animated.View>

        <MetaPills
          genres={genres}
          condition={book.condition}
          language={book.language}
          cardBg={cardBg}
          cardBorderColor={cardBorder}
          accent={accent}
        />

        <DescriptionSection
          description={book.description}
          hasGenres={genres.length > 0}
          accent={accent}
        />

        {owner && (
          <OwnerStrip
            owner={owner}
            isOwnBook={isOwnBook}
            cardBorderColor={cardBorder}
          />
        )}

        {!isOwnBook && owner && (
          <ReportRow onPress={() => setReportVisible(true)} />
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
          isAvailable={isAvailable}
          exchangeStatus={exchangeStatus}
          exchangeId={existingExchange?.id ?? null}
          isWishlisted={wishlist.isWishlisted}
          wishlistBusy={wishlist.wishlistBusy}
          wishlistLoading={wishlist.wishlistLoading}
          onWishlistPress={wishlist.toggle}
          onRequestSwap={() =>
            requireVerified(() =>
              navigation.navigate("RequestSwap", { bookId: book.id }),
            )
          }
          onViewExchange={(exId) =>
            navigation.navigate("ExchangeDetail", { exchangeId: exId })
          }
          onCancelExchange={handleCancelExchange}
          cancelPending={cancelExchange.isPending}
          accent={accent}
          cardBorderColor={cardBorder}
        />
      )}

      {isOwnBook && (
        <OwnerCta
          bookId={book.id}
          isAvailable={isAvailable}
          updatePending={updateBook.isPending}
          onToggleStatus={handleStatusToggle}
          accent={accent}
          cardBorderColor={cardBorder}
        />
      )}
    </View>
  );
}
