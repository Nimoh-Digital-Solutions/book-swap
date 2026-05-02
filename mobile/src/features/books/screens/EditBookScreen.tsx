import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AlertTriangle, Save, Trash2 } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { BrandedLoader } from "@/components/BrandedLoader";
import { EmptyState } from "@/components/EmptyState";
import { useColors, useIsDark } from "@/hooks/useColors";

import {
  CONDITIONS,
  ChipPicker,
  CoverHeader,
  GenreGrid,
  LANGUAGES,
  MAX_GENRES,
  SWAP_TYPES,
  SectionLabel,
  bookFormStyles as s,
} from "@/features/books/components/book-form";
import { BookPhotoManager } from "@/features/books/components/BookPhotoManager";
import {
  useBookDetail,
  useDeleteBook,
  useUpdateBook,
  type CreateBookPayload,
  type UpdateBookPayload,
} from "@/features/books/hooks/useBooks";
import type { ProfileStackParamList } from "@/navigation/types";

type Route = RouteProp<ProfileStackParamList, "EditBook">;
type Nav = NativeStackNavigationProp<ProfileStackParamList, "EditBook">;

export function EditBookScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const {
    data: book,
    isLoading: bookLoading,
    isError: bookError,
    refetch,
  } = useBookDetail(params.bookId);
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
  const [condition, setCondition] = useState<
    CreateBookPayload["condition"] | null
  >(null);
  const [language, setLanguage] = useState<
    CreateBookPayload["language"] | null
  >(null);
  const [swapType, setSwapType] =
    useState<CreateBookPayload["swap_type"]>("temporary");
  const [genres, setGenres] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (book && !hydrated) {
      setTitle(book.title ?? "");
      setAuthor(book.author ?? "");
      setDescription(book.description ?? "");
      setCondition((book.condition as CreateBookPayload["condition"]) ?? null);
      setLanguage((book.language as CreateBookPayload["language"]) ?? null);
      setSwapType(
        (book.swap_type as CreateBookPayload["swap_type"]) ?? "temporary",
      );
      setNotes(book.notes ?? "");

      const bookGenres: string[] = Array.isArray(book.genres)
        ? book.genres
        : book.genre
          ? [book.genre]
          : [];
      setGenres(bookGenres);
      setHydrated(true);
    }
  }, [book, hydrated]);

  const coverUrl: string | undefined =
    book?.cover_url || book?.photos?.[0]?.image;
  const isbn: string | undefined = book?.isbn;

  const canSubmit = useMemo(
    () =>
      title.trim().length > 0 &&
      author.trim().length > 0 &&
      condition !== null &&
      language !== null,
    [title, author, condition, language],
  );

  const toggleGenre = useCallback((g: string) => {
    setGenres((prev) =>
      prev.includes(g)
        ? prev.filter((x) => x !== g)
        : prev.length < MAX_GENRES
          ? [...prev, g]
          : prev,
    );
  }, []);

  const conditionOptions = useMemo(
    () =>
      CONDITIONS.map((item) => ({
        key: item.key,
        label: t(`books.conditions.${item.key}`, item.label),
      })),
    [t],
  );
  const languageOptions = useMemo(
    () =>
      LANGUAGES.map((item) => ({
        key: item.key,
        label: t(`books.languages.${item.key}`, item.label),
      })),
    [t],
  );
  const swapTypeOptions = useMemo(
    () =>
      SWAP_TYPES.map((item) => ({
        key: item.key,
        label: t(`books.swapTypes.${item.key}`, item.label),
      })),
    [t],
  );

  const handleSave = () => {
    if (!canSubmit || !condition || !language) return;

    const payload: UpdateBookPayload = {
      title: title.trim(),
      author: author.trim(),
      description: description.trim(),
      condition,
      language,
      swap_type: swapType,
      genres,
      notes: notes.trim(),
    };

    updateBook.mutate(payload, {
      onSuccess: () => {
        Alert.alert(
          t("books.editBook.successTitle", "Book updated!"),
          t("books.editBook.successMsg", "Your changes have been saved."),
          [
            {
              text: t("common.ok", "OK"),
              onPress: () => navigation.goBack(),
            },
          ],
        );
      },
      onError: () => {
        Alert.alert(
          t("common.error", "Error"),
          t(
            "books.editBook.errorMsg",
            "Failed to save changes. Please try again.",
          ),
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
          subtitle={t(
            "books.editBook.loadErrorHint",
            "Check your connection and try again.",
          )}
          actionLabel={t("common.retry", "Retry")}
          onAction={() => refetch()}
        />
      </View>
    );
  }

  if (bookLoading || !hydrated) {
    return (
      <View style={[s.center, { backgroundColor: bg }]}>
        <BrandedLoader size="lg" />
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
        <CoverHeader
          coverUrl={coverUrl}
          isbn={isbn}
          cardBg={cardBg}
          cardBorder={cardBorder}
        />

        <SectionLabel text={t("books.editBook.photosLabel", "Photos")} />
        <BookPhotoManager
          bookId={params.bookId}
          photos={(book?.photos ?? []).map((p, i) => ({
            id: p.id,
            image: p.image,
            position: p.order ?? i,
          }))}
        />

        <SectionLabel text={t("books.addBook.titleLabel", "Title")} required />
        <TextInput
          style={[
            s.input,
            {
              backgroundColor: inputBg,
              borderColor: inputBorder,
              color: c.text.primary,
            },
          ]}
          value={title}
          onChangeText={setTitle}
          placeholder={t(
            "books.addBook.titlePlaceholder",
            "e.g. The Great Gatsby",
          )}
          placeholderTextColor={c.text.placeholder}
          accessibilityLabel={t(
            "books.addBook.accessibility.titleInput",
            "Book title",
          )}
        />

        <SectionLabel
          text={t("books.addBook.authorLabel", "Author")}
          required
        />
        <TextInput
          style={[
            s.input,
            {
              backgroundColor: inputBg,
              borderColor: inputBorder,
              color: c.text.primary,
            },
          ]}
          value={author}
          onChangeText={setAuthor}
          placeholder={t(
            "books.addBook.authorPlaceholder",
            "e.g. F. Scott Fitzgerald",
          )}
          placeholderTextColor={c.text.placeholder}
          accessibilityLabel={t(
            "books.addBook.accessibility.authorInput",
            "Author name",
          )}
        />

        <SectionLabel
          text={t("books.addBook.descriptionLabel", "Description")}
        />
        <TextInput
          style={[
            s.input,
            s.multiline,
            {
              backgroundColor: inputBg,
              borderColor: inputBorder,
              color: c.text.primary,
            },
          ]}
          value={description}
          onChangeText={setDescription}
          placeholder={t(
            "books.addBook.descriptionPlaceholder",
            "Brief description...",
          )}
          placeholderTextColor={c.text.placeholder}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          accessibilityLabel={t(
            "books.addBook.accessibility.descriptionInput",
            "Book description",
          )}
        />

        <SectionLabel
          text={t("books.addBook.conditionLabel", "Condition")}
          required
        />
        <ChipPicker
          options={conditionOptions}
          value={condition}
          onChange={setCondition}
          cardBg={cardBg}
          cardBorder={cardBorder}
          accent={accent}
          accessibilityLabelFor={(opt) =>
            t(
              "books.addBook.accessibility.selectCondition",
              "Select condition: {{label}}",
              { label: opt.label },
            )
          }
        />

        <SectionLabel
          text={t("books.addBook.languageLabel", "Language")}
          required
        />
        <ChipPicker
          options={languageOptions}
          value={language}
          onChange={setLanguage}
          cardBg={cardBg}
          cardBorder={cardBorder}
          accent={accent}
          accessibilityLabelFor={(opt) =>
            t(
              "books.addBook.accessibility.selectLanguage",
              "Select language: {{label}}",
              { label: opt.label },
            )
          }
        />

        <SectionLabel
          text={t("books.addBook.swapTypeLabel", "Swap Type")}
          required
        />
        <ChipPicker
          options={swapTypeOptions}
          value={swapType}
          onChange={setSwapType}
          cardBg={cardBg}
          cardBorder={cardBorder}
          accent={accent}
          accessibilityLabelFor={(opt) =>
            t(
              "books.addBook.accessibility.selectSwapType",
              "Select swap type: {{label}}",
              { label: opt.label },
            )
          }
        />

        <SectionLabel
          text={`${t("books.addBook.genresLabel", "Genres")} (${genres.length}/${MAX_GENRES})`}
        />
        <GenreGrid
          selected={genres}
          onToggle={toggleGenre}
          cardBg={cardBg}
          cardBorder={cardBorder}
          accent={accent}
        />

        <SectionLabel
          text={t("books.addBook.notesLabel", "Notes for swappers")}
        />
        <TextInput
          style={[
            s.input,
            s.multiline,
            {
              backgroundColor: inputBg,
              borderColor: inputBorder,
              color: c.text.primary,
            },
          ]}
          value={notes}
          onChangeText={setNotes}
          placeholder={t(
            "books.addBook.notesPlaceholder",
            "Any notes for potential swappers...",
          )}
          placeholderTextColor={c.text.placeholder}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
          maxLength={200}
          accessibilityLabel={t(
            "books.addBook.accessibility.notesInput",
            "Notes for swappers",
          )}
        />

        <Pressable
          onPress={handleSave}
          disabled={!canSubmit || updateBook.isPending}
          accessibilityRole="button"
          accessibilityLabel={t(
            "books.editBook.accessibility.saveChanges",
            "Save changes",
          )}
          style={({ pressed }) => [
            s.primaryBtn,
            {
              backgroundColor: accent,
              opacity: !canSubmit ? 0.5 : pressed ? 0.9 : 1,
            },
          ]}
        >
          {updateBook.isPending ? (
            <ActivityIndicator size="small" color={c.text.inverse} />
          ) : (
            <Save size={18} color="#152018" />
          )}
          <Text style={s.primaryBtnText}>
            {updateBook.isPending
              ? t("books.editBook.saving", "Saving...")
              : t("books.editBook.save", "Save Changes")}
          </Text>
        </Pressable>

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
            accessibilityRole="button"
            accessibilityLabel={t(
              "books.editBook.accessibility.deleteBook",
              "Delete book",
            )}
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
