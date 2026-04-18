import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { BookOpen, Check } from "lucide-react-native";

import { useColors, useIsDark } from "@/hooks/useColors";
import { spacing, radius } from "@/constants/theme";
import { useCreateBook, type CreateBookPayload } from "@/features/books/hooks/useBooks";
import { GENRE_VALUES, GENRE_VALUE_TO_I18N_KEY, type GenreValue } from "@/features/books/constants";
import type { ScanStackParamList } from "@/navigation/types";

type Route = RouteProp<ScanStackParamList, "AddBook">;
type Nav = NativeStackNavigationProp<ScanStackParamList, "AddBook">;

const CONDITIONS: { key: CreateBookPayload["condition"]; label: string }[] = [
  { key: "new", label: "New" },
  { key: "like_new", label: "Like New" },
  { key: "good", label: "Good" },
  { key: "acceptable", label: "Acceptable" },
];

const LANGUAGES: { key: CreateBookPayload["language"]; label: string }[] = [
  { key: "en", label: "English" },
  { key: "nl", label: "Dutch" },
  { key: "de", label: "German" },
  { key: "fr", label: "French" },
  { key: "es", label: "Spanish" },
  { key: "other", label: "Other" },
];

const MAX_GENRES = 3;

const LANG_CODE_MAP: Record<string, CreateBookPayload["language"]> = {
  en: "en", eng: "en", english: "en",
  nl: "nl", dut: "nl", nld: "nl", dutch: "nl",
  de: "de", ger: "de", deu: "de", german: "de",
  fr: "fr", fre: "fr", fra: "fr", french: "fr",
  es: "es", spa: "es", spanish: "es",
};

function resolveLanguage(raw?: string): CreateBookPayload["language"] | null {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  return LANG_CODE_MAP[key] ?? "other";
}

export function AddBookScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const createBook = useCreateBook();

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;
  const inputBg = isDark ? c.auth.card : c.surface.white;
  const inputBorder = isDark ? c.auth.cardBorder : c.border.default;

  const [title, setTitle] = useState(params?.title ?? "");
  const [author, setAuthor] = useState(params?.author ?? "");
  const [description, setDescription] = useState(params?.description ?? "");
  const [condition, setCondition] = useState<CreateBookPayload["condition"] | null>(null);
  const [language, setLanguage] = useState<CreateBookPayload["language"] | null>(
    resolveLanguage(params?.language),
  );
  const [genres, setGenres] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const coverUrl = params?.cover_url;
  const isbn = params?.isbn;

  const canSubmit = useMemo(
    () => title.trim().length > 0 && author.trim().length > 0 && condition !== null && language !== null,
    [title, author, condition, language],
  );

  const toggleGenre = (g: string) => {
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : prev.length < MAX_GENRES ? [...prev, g] : prev,
    );
  };

  const handleSubmit = () => {
    if (!canSubmit || !condition || !language) return;

    const payload: CreateBookPayload = {
      title: title.trim(),
      author: author.trim(),
      condition,
      language,
      ...(isbn && { isbn }),
      ...(description.trim() && { description: description.trim() }),
      ...(coverUrl && { cover_url: coverUrl }),
      ...(genres.length > 0 && { genres }),
      ...(notes.trim() && { notes: notes.trim() }),
      ...(params?.page_count && { page_count: params.page_count }),
      ...(params?.publish_year && { publish_year: params.publish_year }),
    };

    createBook.mutate(payload, {
      onSuccess: () => {
        Alert.alert(
          t("books.addBook.successTitle", "Book listed!"),
          t("books.addBook.successMsg", "Your book is now available for swapping."),
          [{
            text: "OK",
            onPress: () => {
              navigation.popToTop();
              const tabNav = navigation.getParent();
              if (tabNav) {
                (tabNav as any).navigate("ProfileTab", { screen: "MyBooks" });
              }
            },
          }],
        );
      },
      onError: () => {
        Alert.alert(
          t("common.error", "Error"),
          t("books.addBook.errorMsg", "Failed to list book. Please try again."),
        );
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={s.root}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Cover preview (from ISBN) */}
        {coverUrl ? (
          <View
            style={[s.coverWrap, { backgroundColor: cardBg, borderColor: cardBorder }]}
          >
            <Image
              source={{ uri: coverUrl }}
              style={s.cover}
              contentFit="cover"
              transition={200}
            />
          </View>
        ) : null}

        {/* ISBN badge */}
        {isbn ? (
          <View style={[s.isbnBadge, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[s.isbnText, { color: c.text.secondary }]}>
              ISBN {isbn}
            </Text>
          </View>
        ) : null}

        {/* ── Title ── */}
        <SectionLabel text={t("books.addBook.titleLabel", "Title")} required c={c} />
        <TextInput
          style={[s.input, { backgroundColor: inputBg, borderColor: inputBorder, color: c.text.primary }]}
          value={title}
          onChangeText={setTitle}
          placeholder={t("books.addBook.titlePlaceholder", "e.g. The Great Gatsby")}
          placeholderTextColor={c.text.placeholder}
        />

        {/* ── Author ── */}
        <SectionLabel text={t("books.addBook.authorLabel", "Author")} required c={c} />
        <TextInput
          style={[s.input, { backgroundColor: inputBg, borderColor: inputBorder, color: c.text.primary }]}
          value={author}
          onChangeText={setAuthor}
          placeholder={t("books.addBook.authorPlaceholder", "e.g. F. Scott Fitzgerald")}
          placeholderTextColor={c.text.placeholder}
        />

        {/* ── Description ── */}
        <SectionLabel text={t("books.addBook.descriptionLabel", "Description")} c={c} />
        <TextInput
          style={[
            s.input,
            s.multiline,
            { backgroundColor: inputBg, borderColor: inputBorder, color: c.text.primary },
          ]}
          value={description}
          onChangeText={setDescription}
          placeholder={t("books.addBook.descriptionPlaceholder", "Brief description...")}
          placeholderTextColor={c.text.placeholder}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* ── Condition ── */}
        <SectionLabel text={t("books.addBook.conditionLabel", "Condition")} required c={c} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          <View style={s.chipRow}>
            {CONDITIONS.map((item) => {
              const selected = condition === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setCondition(item.key)}
                  style={[
                    s.chip,
                    {
                      backgroundColor: selected ? accent : cardBg,
                      borderColor: selected ? accent : cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.chipText,
                      { color: selected ? "#152018" : c.text.secondary },
                    ]}
                  >
                    {t(`books.conditions.${item.key}`, item.label)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* ── Language ── */}
        <SectionLabel text={t("books.addBook.languageLabel", "Language")} required c={c} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
          <View style={s.chipRow}>
            {LANGUAGES.map((item) => {
              const selected = language === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => setLanguage(item.key)}
                  style={[
                    s.chip,
                    {
                      backgroundColor: selected ? accent : cardBg,
                      borderColor: selected ? accent : cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.chipText,
                      { color: selected ? "#152018" : c.text.secondary },
                    ]}
                  >
                    {t(`books.languages.${item.key}`, item.label)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* ── Genres ── */}
        <SectionLabel
          text={`${t("books.addBook.genresLabel", "Genres")} (${genres.length}/${MAX_GENRES})`}
          c={c}
        />
        <View style={s.genreGrid}>
          {GENRE_VALUES.map((g) => {
            const selected = genres.includes(g);
            const disabled = !selected && genres.length >= MAX_GENRES;
            const slug = GENRE_VALUE_TO_I18N_KEY[g as GenreValue];
            return (
              <Pressable
                key={g}
                onPress={() => !disabled && toggleGenre(g)}
                style={[
                  s.genreChip,
                  {
                    backgroundColor: selected ? accent : cardBg,
                    borderColor: selected ? accent : cardBorder,
                    opacity: disabled ? 0.4 : 1,
                  },
                ]}
              >
                {selected && <Check size={12} color="#152018" strokeWidth={3} />}
                <Text
                  style={[
                    s.genreChipText,
                    { color: selected ? "#152018" : c.text.secondary },
                  ]}
                >
                  {t(`books.genres.${slug}`, g)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Notes ── */}
        <SectionLabel text={t("books.addBook.notesLabel", "Notes for swappers")} c={c} />
        <TextInput
          style={[
            s.input,
            s.multiline,
            { backgroundColor: inputBg, borderColor: inputBorder, color: c.text.primary },
          ]}
          value={notes}
          onChangeText={setNotes}
          placeholder={t("books.addBook.notesPlaceholder", "Any notes for potential swappers...")}
          placeholderTextColor={c.text.placeholder}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
          maxLength={200}
        />

        {/* ── Submit ── */}
        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit || createBook.isPending}
          style={({ pressed }) => [
            s.submitBtn,
            {
              backgroundColor: accent,
              opacity: !canSubmit ? 0.5 : pressed ? 0.9 : 1,
            },
          ]}
        >
          {createBook.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <BookOpen size={18} color="#152018" />
          )}
          <Text style={s.submitBtnText}>
            {createBook.isPending
              ? t("books.addBook.submitting", "Listing...")
              : t("books.addBook.submit", "List Book")}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SectionLabel({
  text,
  required,
  c,
}: {
  text: string;
  required?: boolean;
  c: ReturnType<typeof useColors>;
}) {
  return (
    <View style={s.labelRow}>
      <Text style={[s.label, { color: c.text.primary }]}>{text}</Text>
      {required && <Text style={[s.required, { color: c.auth.golden }]}>*</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 140,
  },

  coverWrap: {
    width: 120,
    height: 170,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  cover: { width: "100%", height: "100%" },

  isbnBadge: {
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  isbnText: { fontSize: 12, fontWeight: "500" },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  label: { fontSize: 14, fontWeight: "600" },
  required: { fontSize: 14, fontWeight: "700" },

  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multiline: {
    minHeight: 72,
    paddingTop: 12,
  },

  chipScroll: { marginTop: 4 },
  chipRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "600" },

  genreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: 4,
  },
  genreChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  genreChipText: { fontSize: 12, fontWeight: "600" },

  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: radius.xl,
    marginTop: spacing.xl,
  },
  submitBtnText: { color: "#152018", fontWeight: "700", fontSize: 16 },
});
