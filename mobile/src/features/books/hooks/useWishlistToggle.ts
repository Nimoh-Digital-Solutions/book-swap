import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { showErrorToast } from "@/components/Toast";

import {
  useAddWishlistItem,
  useBookWishlistStatus,
  useRemoveWishlistItem,
} from "./useWishlist";

export function useWishlistToggle(bookId: string) {
  const { t } = useTranslation();
  const { data: wishlistEntry, isLoading: wishlistLoading } =
    useBookWishlistStatus(bookId);
  const addWishlist = useAddWishlistItem();
  const removeWishlist = useRemoveWishlistItem();

  const isWishlisted = !!wishlistEntry;
  const wishlistBusy = addWishlist.isPending || removeWishlist.isPending;

  const toggle = useCallback(() => {
    if (wishlistBusy) return;

    if (isWishlisted && wishlistEntry) {
      Alert.alert(
        t("books.wishlist.removeTitle", "Remove from Wishlist"),
        t(
          "books.wishlist.removeMsg",
          "Are you sure you want to remove this book from your wishlist?",
        ),
        [
          { text: t("common.cancel", "Cancel"), style: "cancel" },
          {
            text: t("common.remove", "Remove"),
            style: "destructive",
            onPress: () =>
              removeWishlist.mutate(
                { id: wishlistEntry.id, bookId },
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
        { book: bookId },
        {
          onError: () =>
            showErrorToast(
              t("books.wishlist.addError", "Failed to add to wishlist"),
            ),
        },
      );
    }
  }, [
    wishlistBusy,
    isWishlisted,
    wishlistEntry,
    addWishlist,
    removeWishlist,
    bookId,
    t,
  ]);

  return {
    isWishlisted,
    wishlistBusy,
    wishlistLoading,
    toggle,
  };
}
