import {
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import {
  ArrowLeftRight,
  BookOpen,
  Globe,
  Sparkles,
  Tag,
} from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { radius, shadows, spacing } from "@/constants/theme";
import { useColors, useIsDark } from "@/hooks/useColors";
import { getMockBookById } from "../data/mockBooks";

type Route = RouteProp<{ BookDetail: { bookId: string } }, "BookDetail">;

const CONDITION_LABELS: Record<string, string> = {
  new: "New",
  like_new: "Like New",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
};

const AVATAR_GRADIENTS = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
];

export function BookDetailScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const { params } = useRoute<Route>();

  const book = getMockBookById(params.bookId);

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  if (!book) {
    return (
      <View style={[s.centered, { backgroundColor: bg }]}>
        <Text style={[s.notFound, { color: c.text.secondary }]}>
          {t("books.notFound", "Book not found")}
        </Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Cover Hero ── */}
        <View style={[s.coverHero, { backgroundColor: book.coverBg }]}>
          <Text style={s.coverTitle} numberOfLines={3}>
            {book.title}
          </Text>
          <Text style={s.coverAuthor}>{book.author}</Text>
          {book.available && (
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
          <View
            style={[
              s.metaPill,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <Tag size={14} color={accent} />
            <Text style={[s.metaText, { color: c.text.primary }]}>
              {book.genre}
            </Text>
          </View>
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
          <View
            style={[
              s.metaPill,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <Globe size={14} color={accent} />
            <Text style={[s.metaText, { color: c.text.primary }]}>
              {book.language}
            </Text>
          </View>
        </View>

        {/* ── Description ── */}
        <View
          style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
        >
          <View style={s.cardHeader}>
            <BookOpen size={16} color={accent} />
            <Text style={[s.cardLabel, { color: c.text.secondary }]}>
              {t("books.description", "Description")}
            </Text>
          </View>
          <Text style={[s.description, { color: c.text.primary }]}>
            {book.description}
          </Text>
        </View>

        {/* ── Listed by (inline) ── */}
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
            <Text style={s.ownerInitial}>{book.owner.initial}</Text>
          </View>
          <View style={s.ownerInfo}>
            <Text style={[s.ownerLabel, { color: c.text.placeholder }]}>
              {t("books.listedBy", "Listed by")}
            </Text>
            <Text style={[s.ownerName, { color: c.text.primary }]}>
              {book.owner.name}
            </Text>
          </View>
          <Text style={[s.ownerSince, { color: c.text.placeholder }]}>
            {t("books.memberSince", "Since 2024")}
          </Text>
        </View>

        <View style={s.bottomSpacer} />
      </ScrollView>

      {/* ── Bottom CTA ── */}
      {book.available && (
        <View style={[s.ctaWrap, { borderTopColor: cardBorder }]}>
          <Pressable
            onPress={() => {
              Alert.alert(
                t("books.requestSwap", "Request Swap"),
                t("books.browseToBrowse", "Browse real books nearby to request a swap!"),
              );
            }}
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

  // Cover hero
  coverHero: {
    height: 250,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    position: "relative",
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

  // Title section
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

  // Meta pills
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

  // Card
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

  // Description
  description: { fontSize: 15, lineHeight: 24 },

  // Owner strip
  ownerStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerInitial: { color: "#fff", fontSize: 16, fontWeight: "700" },
  ownerInfo: { flex: 1 },
  ownerLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  ownerName: { fontSize: 15, fontWeight: "700", marginTop: 1 },
  ownerSince: { fontSize: 11 },

  // Bottom CTA
  ctaWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
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

  bottomSpacer: { height: 20 },
});
