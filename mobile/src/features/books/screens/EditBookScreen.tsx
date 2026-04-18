import React, { useState, useMemo, useEffect } from "react";
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
import { AlertTriangle, Check, Save, Trash2 } from "lucide-react-native";

import { useColors, useIsDark } from "@/hooks/useColors";
import { spacing, radius } from "@/constants/theme";
import {
  useBookDetail,
  useUpdateBook,
  useDeleteBook,
  type UpdateBookPayload,
  type CreateBookPayload,
} from "@/features/books/hooks/useBooks";
import { BookPhotoManager } from "@/features/books/components/BookPhotoManager";
import { EmptyState } from "@/components/EmptyState";
import { GENRE_OPTIONS } from "@/features/books/constants";
import type { ProfileStackParamList } from "@/navigation/types";

type Route = RouteProp<ProfileStackParamList, "EditBook">;
type Nav = NativeStackNavigationProp<ProfileStackParamList, "EditBook">;

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

export function EditBookScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { data: book, isLoading: bookLoading, isError: bookError, refetch } = useBookDetail(params.bookId);
  const updateBook = useUpdateBook(params.bookId);
  const deleteBook = useDeleteBook();

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;
  const inputBg = isDark ? c.auth.card : c.surface.white;
  const inputBorder = isDark ? c.auth.cardBorder : c.border.default;

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState<CreateBookPayload["condition"] | null>(null);
  const [language, setLanguage] = useState<CreateBookPayload["language"] | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [hydrated, setHydrated] = useState(false);

  // The Book type is incomplete — API returns genres, notes, cover_url as extra fields
  const bookAny = book as any;

  useEffect(() => {
    if (book && !hydrated) {
      setTitle(book.title ?? "");
      setAuthor(book.author ?? "");
      setDescription(book.description ?? "");
      setCondition(book.condition as CreateBookPayload["condition"] ?? null);
      setLanguage(book.language as CreateBookPayload["language"] ?? null);
      setNotes(bookAny?.notes ?? "");

      const bookGenres: string[] = Array.isArray(bookAny?.genres)
        ? bookAny.genres
        : bookAny?.genre
          ? [bookAny.genre]
          : [];
      setGenres(bookGenres);
      setHydrated(true);
    }
  }, [book, hydrated, bookAny]);

  const coverUrl: string | undefined = bookAny?.cover_url;
  const isbn: string | undefined = book?.isbn;

  const canSubmit = useMemo(
    () =>
      title.trim().length > 0 &&
      author.trim().length > 0 &&
      condition !== null &&
      language !== null,
    [title, author, condition, language],
  );

  const toggleGenre = (g: string) => {
    setGenres((prev) =>
      prev.includes(g)
        ? prev.filter((x) => x !== g)
        : prev.length < MAX_GENRES
          ? [...prev, g]
          : prev,
    );
  };

  const handleSave = () => {
    if (!canSubmit || !condition || !language) return;

    const payload: UpdateBookPayload = {
      title: title.trim(),
      author: author.trim(),
      description: description.trim(),
      condition,
      language,
      genres,
      notes: notes.trim(),
    };

    updateBook.mutate(payload, {
      onSuccess: () => {
        Alert.alert(
          t("books.editBook.successTitle", "Book updated!"),
          t("books.editBook.successMsg", "Your changes have been saved."),
          [{ text: "OK", onPress: () => navigation.goBack() }],
        );
      },
      onError: () => {
        Alert.alert(
          t("common.error", "Error"),
          t("books.editBook.errorMsg", "Failed to save changes. Please try again."),
        );
      },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      t("books.editBook.deleteTitle", "Delete this book?"),
      t(
        "books.editBook.deleteMsg",
        "This will permanently remove the listing. Any active exchanges will be cancelled.",
      ),
      [
        { text: t("common.cancel", "Cancel"), style: "cancel" },
        {
          text: t("books.editBook.deleteConfirm", "Delete"),
          style: "destructive",
          onPress: () => {
            deleteBook.mutate(params.bookId, {
              onSuccess: () => {
                navigation.goBack();
              },
              onError: () => {
                Alert.alert(
                  t("common.error", "Error"),
                  t("books.editBook.deleteError", "Failed to delete book."),
                );
              },
            });
          },
        },
      ],
    );
  };

  if (bookError) {
    return (
      <View style={[s.center, { backgroundColor: bg }]}>
        <EmptyState
          icon={AlertTriangle}
          title={t("books.editBook.loadError", "Couldn't load book")}
          subtitle={t("books.editBook.loadErrorHint", "Check your connection and try again.")}
          actionLabel={t("common.retry", "Retry")}
          onAction={() => refetch()}
        />
      </View>
    );
  }

  if (bookLoading || !hydrated) {
    return (
      <View style={[s.center, { backgroundColor: bg }]}>
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

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
        {/* Cover preview */}
        {coverUrl ? (
          <View style={[s.coverWrap, { backgroundColor: cardBg, borderColor: cardBorder }]}>
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
            <Text style={[s.isbnText, { color: c.text.secondary }]}>ISBN {isbn}</Text>
          </View>
        ) : null}

        {/* ── Photos ── */}
        <SectionLabel text={t("books.editBook.photosLabel", "Photos")} c={c} />
        <BookPhotoManager bookId={params.bookId} photos={book?.photos ?? []} />

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
                    style={[s.chipText, { color: selected ? "#152018" : c.text.secondary }]}
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
                    style={[s.chipText, { color: selected ? "#152018" : c.text.secondary }]}
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
          {GENRE_OPTIONS.map((g) => {
            const selected = genres.includes(g);
            const disabled = !selected && genres.length >= MAX_GENRES;
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
                  style={[s.genreChipText, { color: selected ? "#152018" : c.text.secondary }]}
                >
                  {g}
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

        {/* ── Save ── */}
        <Pressable
          onPress={handleSave}
          disabled={!canSubmit || updateBook.isPending}
          style={({ pressed }) => [
            s.saveBtn,
            {
              backgroundColor: accent,
              opacity: !canSubmit ? 0.5 : pressed ? 0.9 : 1,
            },
          ]}
        >
          {updateBook.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Save size={18} color="#152018" />
          )}
          <Text style={s.saveBtnText}>
            {updateBook.isPending
              ? t("books.editBook.saving", "Saving...")
              : t("books.editBook.save", "Save Changes")}
          </Text>
        </Pressable>

        {/* ── Danger Zone ── */}
        <View style={[s.dangerZone, { borderColor: c.status.error + "40" }]}>
          <Text style={[s.dangerTitle, { color: c.status.error }]}>
            {t("books.editBook.dangerZone", "Danger Zone")}
          </Text>
          <Text style={[s.dangerDesc, { color: c.text.secondary }]}>
            {t(
              "books.editBook.dangerDesc",
              "Deleting this book will permanently remove the listing and cancel any active exchanges.",
            )}
          </Text>
          <Pressable
            onPress={handleDelete}
            disabled={deleteBook.isPending}
            style={({ pressed }) => [
              s.deleteBtn,
              {
                borderColor: c.status.error,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            {deleteBook.isPending ? (
              <ActivityIndicator size="small" color={c.status.error} />
            ) : (
              <Trash2 size={16} color={c.status.error} />
            )}
            <Text style={[s.deleteBtnText, { color: c.status.error }]}>
              {t("books.editBook.delete", "Delete Book")}
            </Text>
          </Pressable>
        </View>
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: radius.xl,
    marginTop: spacing.xl,
  },
  saveBtnText: { color: "#152018", fontWeight: "700", fontSize: 16 },

  dangerZone: {
    marginTop: spacing.xl + 8,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  dangerDesc: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: spacing.md,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: 12,
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },
  deleteBtnText: { fontSize: 14, fontWeight: "700" },
});
