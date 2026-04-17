import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BookOpen, PenLine, AlertTriangle, User, BookText } from "lucide-react-native";

import { http } from "@/services/http";
import { API } from "@/configs/apiEndpoints";
import { useColors, useIsDark } from "@/hooks/useColors";
import { spacing, radius } from "@/constants/theme";
import type { ScanStackParamList } from "@/navigation/types";

type Route = RouteProp<ScanStackParamList, "ScanResult">;
type Nav = NativeStackNavigationProp<ScanStackParamList, "ScanResult">;

interface ISBNResult {
  title: string;
  author: string;
  isbn: string;
  cover_url?: string;
  description?: string;
  page_count?: number | null;
  publish_year?: number | null;
  language?: string;
}

export function ScanResultScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  const { data, isLoading, error } = useQuery({
    queryKey: ["isbn-lookup", params.isbn],
    queryFn: async () => {
      const { data: result } = await http.get(API.books.isbnLookup, {
        params: { isbn: params.isbn },
      });
      return result as ISBNResult;
    },
  });

  if (isLoading) {
    return (
      <View style={[s.centered, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={accent} />
        <Text style={[s.loadingTitle, { color: c.text.primary }]}>
          {t("scanner.lookingUp", "Looking up your book...")}
        </Text>
        <Text style={[s.loadingSub, { color: c.text.secondary }]}>
          ISBN {params.isbn}
        </Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={[s.centered, { backgroundColor: bg }]}>
        <View
          style={[
            s.errorIcon,
            { backgroundColor: isDark ? c.auth.card : "#FEF3C7" },
          ]}
        >
          <AlertTriangle size={36} color={accent} />
        </View>
        <Text style={[s.errorTitle, { color: c.text.primary }]}>
          {t("scanner.notFound", "Book not found")}
        </Text>
        <Text style={[s.errorSub, { color: c.text.secondary }]}>
          {t(
            "scanner.notFoundSub",
            "We couldn't find a match for ISBN {{isbn}}. You can still add it manually.",
            { isbn: params.isbn },
          )}
        </Text>
        <Pressable
          style={({ pressed }) => [
            s.primaryBtn,
            { backgroundColor: accent, opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={() => navigation.navigate("AddBook", { isbn: params.isbn })}
        >
          <PenLine size={18} color="#fff" />
          <Text style={s.primaryBtnText}>
            {t("scanner.addManually", "Add manually")}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={[s.root, { backgroundColor: bg }]}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Cover hero */}
      <View
        style={[
          s.coverWrap,
          { backgroundColor: cardBg, borderColor: cardBorder },
        ]}
      >
        {data.cover_url ? (
          <Image
            source={{ uri: data.cover_url }}
            style={s.cover}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[s.coverPlaceholder, { backgroundColor: accent + "18" }]}>
            <BookOpen size={48} color={accent} />
          </View>
        )}
      </View>

      {/* Book info */}
      <Text style={[s.title, { color: c.text.primary }]}>{data.title}</Text>
      <View style={s.authorRow}>
        <User size={14} color={c.text.secondary} />
        <Text style={[s.author, { color: c.text.secondary }]}>
          {data.author || t("scanner.unknownAuthor", "Unknown author")}
        </Text>
      </View>

      {/* Meta pills */}
      <View style={s.metaRow}>
        <View style={[s.pill, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <Text style={[s.pillText, { color: c.text.secondary }]}>
            ISBN {data.isbn}
          </Text>
        </View>
        {data.publish_year ? (
          <View style={[s.pill, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[s.pillText, { color: c.text.secondary }]}>
              {data.publish_year}
            </Text>
          </View>
        ) : null}
        {data.page_count ? (
          <View style={[s.pill, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <BookText size={11} color={c.text.secondary} />
            <Text style={[s.pillText, { color: c.text.secondary }]}>
              {data.page_count} {t("scanner.pages", "pages")}
            </Text>
          </View>
        ) : null}
        {data.language ? (
          <View style={[s.pill, { backgroundColor: accent + "18", borderColor: accent + "40" }]}>
            <Text style={[s.pillText, { color: accent }]}>
              {data.language.toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Description */}
      {data.description ? (
        <Text
          style={[s.description, { color: c.text.secondary }]}
          numberOfLines={5}
        >
          {data.description}
        </Text>
      ) : null}

      {/* Action buttons */}
      <Pressable
        style={({ pressed }) => [
          s.primaryBtn,
          { backgroundColor: accent, opacity: pressed ? 0.9 : 1 },
        ]}
        onPress={() =>
          navigation.navigate("AddBook", {
            isbn: data.isbn,
            title: data.title,
            author: data.author,
            cover_url: data.cover_url,
            description: data.description,
            language: data.language,
            page_count: data.page_count,
            publish_year: data.publish_year,
          })
        }
      >
        <Text style={s.primaryBtnText}>
          {t("scanner.addThisBook", "Add this book")}
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          s.secondaryBtn,
          { borderColor: cardBorder, opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={() => navigation.navigate("AddBook", { isbn: data.isbn })}
      >
        <Text style={[s.secondaryBtnText, { color: c.text.secondary }]}>
          {t("scanner.editDetails", "Edit details before adding")}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },

  loadingTitle: { fontSize: 18, fontWeight: "600", marginTop: spacing.md },
  loadingSub: { fontSize: 14 },

  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  errorTitle: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  errorSub: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },

  coverWrap: {
    width: 180,
    height: 260,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  cover: { width: "100%", height: "100%" },
  coverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.md,
  },
  author: {
    fontSize: 16,
    fontWeight: "500",
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillText: { fontSize: 12, fontWeight: "500" },

  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: radius.xl,
    width: "100%",
    marginTop: spacing.sm,
  },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  secondaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: radius.xl,
    borderWidth: 1,
    width: "100%",
    marginTop: spacing.sm,
  },
  secondaryBtnText: { fontWeight: "600", fontSize: 14 },
});
