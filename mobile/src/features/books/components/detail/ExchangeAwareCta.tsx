import {
  ArrowLeftRight,
  CheckCircle2,
  Clock,
  Eye,
  Heart,
  RotateCcw,
  XCircle,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import type { ExchangeStatus } from "@/types";

import { bookDetailStyles as s } from "./styles";
import { RE_REQUESTABLE_STATUSES } from "./types";

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  color: string;
}

function getStatusConfig(
  status: ExchangeStatus | null,
  t: (key: string, fallback: string) => string,
): StatusConfig | null {
  switch (status) {
    case "pending":
      return {
        label: t("exchanges.bookCta.swapRequested", "Swap Requested"),
        icon: Clock,
        color: "#F59E0B",
      };
    case "accepted":
    case "conditions_pending":
      return {
        label: t("exchanges.status.accepted", "Accepted"),
        icon: CheckCircle2,
        color: "#22C55E",
      };
    case "active":
    case "swap_confirmed":
      return {
        label: t("exchanges.bookCta.swapActive", "Swap Active"),
        icon: ArrowLeftRight,
        color: "#3B82F6",
      };
    case "completed":
      return {
        label: t("exchanges.bookCta.swapCompleted", "Completed"),
        icon: CheckCircle2,
        color: "#22C55E",
      };
    case "return_requested":
      return {
        label: t("exchanges.bookCta.returnRequested", "Return Requested"),
        icon: RotateCcw,
        color: "#F59E0B",
      };
    case "returned":
      return {
        label: t("exchanges.bookCta.returned", "Returned"),
        icon: RotateCcw,
        color: "#6B7280",
      };
    default:
      return null;
  }
}

interface ExchangeAwareCtaProps {
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
  cardBorderColor: string;
}

export function ExchangeAwareCta({
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
  cardBorderColor,
}: ExchangeAwareCtaProps) {
  const { t } = useTranslation();

  const hasActiveExchange =
    exchangeStatus && !RE_REQUESTABLE_STATUSES.includes(exchangeStatus);
  const statusConfig = hasActiveExchange ? getStatusConfig(exchangeStatus, t) : null;

  if (hasActiveExchange && statusConfig && exchangeId) {
    return (
      <View style={[s.ctaWrap, { borderTopColor: cardBorderColor }]}>
        <View style={s.exchangeCtaContent}>
          <View
            style={[
              s.statusPill,
              {
                backgroundColor: statusConfig.color + "18",
                borderColor: statusConfig.color + "40",
              },
            ]}
          >
            <statusConfig.icon size={14} color={statusConfig.color} />
            <Text style={[s.statusPillText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>

          <View style={s.exchangeBtnRow}>
            {exchangeStatus === "pending" ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(
                  "exchanges.bookCta.cancelRequest",
                  "Cancel Request",
                )}
                onPress={() => onCancelExchange(exchangeId)}
                disabled={cancelPending}
                style={({ pressed }) => [
                  s.exchangeBtn,
                  {
                    borderColor: "#EF4444",
                    opacity: pressed || cancelPending ? 0.7 : 1,
                  },
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
                accessibilityLabel={t(
                  "exchanges.bookCta.viewExchange",
                  "View Exchange",
                )}
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

  return (
    <View style={[s.ctaWrap, { borderTopColor: cardBorderColor }]}>
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
