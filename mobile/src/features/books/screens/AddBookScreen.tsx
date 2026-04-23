import React, { useMemo } from "react";
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
import type { TFunction } from "i18next";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BookOpen, Check } from "lucide-react-native";

import { useColors, useIsDark } from "@/hooks/useColors";
import { spacing, radius } from "@/constants/theme";
import { useCreateBook, type CreateBookPayload } from "@/features/books/hooks/useBooks";
import { GENRE_VALUES, GENRE_VALUE_TO_I18N_KEY, type GenreValue } from "@/features/books/constants";
import type { ScanStackParamList, MainTabNavigationProp } from "@/navigation/types";

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

const SWAP_TYPES: { key: CreateBookPayload["swap_type"]; label: string }[] = [
  { key: "temporary", label: "Temporary (with return)" },
  { key: "permanent", label: "Permanent (keep)" },
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

function createAddBookSchema(t: TFunction) {
  return z.object({
    title: z.string().min(1, t("books.addBook.validation.titleRequired", "Title is required")).max(200),
    author: z.string().min(1, t("books.addBook.validation.authorRequired", "Author is required")).max(200),
    description: z.string().max(2000),
    condition: z.enum(["new", "like_new", "good", "acceptable"], {
      message: t("books.addBook.validation.conditionRequired", "Select a condition"),
    }),
    language: z.enum(["en", "nl", "de", "fr", "es", "other"], {
      message: t("books.addBook.validation.languageRequired", "Select a language"),
    }),
    swap_type: z.enum(["temporary", "permanent"]),
    genres: z.array(z.string()).max(MAX_GENRES),
    notes: z.string().max(200),
  });
}

type AddBookFormValues = z.infer<ReturnType<typeof createAddBookSchema>>;

export function AddBookScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const createBook = useCreateBook();
  const schema = useMemo(() => createAddBookSchema(t), [t]);

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;
  const inputBg = isDark ? c.auth.card : c.surface.white;
  const inputBorder = isDark ? c.auth.cardBorder : c.border.default;

  const coverUrl = params?.cover_url;
  const isbn = params?.isbn;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<AddBookFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      title: params?.title ?? "",
      author: params?.author ?? "",
      description: params?.description ?? "",
      condition: undefined,
      language: resolveLanguage(params?.language) ?? undefined,
      swap_type: "temporary",
      genres: [],
      notes: "",
    },
  });

  const genresValue = watch("genres") ?? [];

  const toggleGenre = (g: string) => {
    const current = genresValue;
    const updated = current.includes(g)
      ? current.filter((x) => x !== g)
      : current.length < MAX_GENRES
        ? [...current, g]
        : current;
    setValue("genres", updated, { shouldValidate: true });
  };

  const onSubmit = (values: AddBookFormValues) => {
    const payload: CreateBookPayload = {
      title: values.title.trim(),
      author: values.author.trim(),
      condition: values.condition,
      language: values.language,
      swap_type: values.swap_type,
      ...(isbn && { isbn }),
      ...(values.description?.trim() && { description: values.description.trim() }),
      ...(coverUrl && { cover_url: coverUrl }),
      ...(values.genres.length > 0 && { genres: values.genres }),
      ...(values.notes?.trim() && { notes: values.notes.trim() }),
      ...(params?.page_count && { page_count: params.page_count }),
      ...(params?.publish_year && { publish_year: params.publish_year }),
    };

    createBook.mutate(payload, {
      onSuccess: (data) => {
        const goToMyBooks = () => {
          navigation.popToTop();
          const tabNav = navigation.getParent<MainTabNavigationProp>();
          tabNav?.navigate("ProfileTab", { screen: "MyBooks" });
        };
        const goToPhotos = () => {
          navigation.popToTop();
          const tabNav = navigation.getParent<MainTabNavigationProp>();
          tabNav?.navigate("ProfileTab", {
            screen: "EditBook",
            params: { bookId: data.id },
          });
        };

        Alert.alert(
          t("books.addBook.successTitle", "Book listed!"),
          t("books.addBook.successMsg", "Your book is now available for swapping."),
          [
            {
              text: t("books.addBook.addPhotos", "Add Photos"),
              onPress: goToPhotos,
            },
            {
              text: t("books.addBook.skipPhotos", "Done"),
              style: "cancel",
              onPress: goToMyBooks,
            },
          ],
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
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[s.input, { backgroundColor: inputBg, borderColor: errors.title ? c.status.error : inputBorder, color: c.text.primary }]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("books.addBook.titlePlaceholder", "e.g. The Great Gatsby")}
              placeholderTextColor={c.text.placeholder}
              accessibilityLabel={t("books.addBook.accessibility.titleInput", "Book title")}
            />
          )}
        />
        {errors.title && <Text style={[s.errorText, { color: c.status.error }]}>{errors.title.message}</Text>}

        {/* ── Author ── */}
        <SectionLabel text={t("books.addBook.authorLabel", "Author")} required c={c} />
        <Controller
          control={control}
          name="author"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[s.input, { backgroundColor: inputBg, borderColor: errors.author ? c.status.error : inputBorder, color: c.text.primary }]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("books.addBook.authorPlaceholder", "e.g. F. Scott Fitzgerald")}
              placeholderTextColor={c.text.placeholder}
              accessibilityLabel={t("books.addBook.accessibility.authorInput", "Author name")}
            />
          )}
        />
        {errors.author && <Text style={[s.errorText, { color: c.status.error }]}>{errors.author.message}</Text>}

        {/* ── Description ── */}
        <SectionLabel text={t("books.addBook.descriptionLabel", "Description")} c={c} />
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                s.input,
                s.multiline,
                { backgroundColor: inputBg, borderColor: inputBorder, color: c.text.primary },
              ]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("books.addBook.descriptionPlaceholder", "Brief description...")}
              placeholderTextColor={c.text.placeholder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              accessibilityLabel={t("books.addBook.accessibility.descriptionInput", "Book description")}
            />
          )}
        />

        {/* ── Condition ── */}
        <SectionLabel text={t("books.addBook.conditionLabel", "Condition")} required c={c} />
        <Controller
          control={control}
          name="condition"
          render={({ field: { onChange, value } }) => (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
              <View style={s.chipRow}>
                {CONDITIONS.map((item) => {
                  const selected = value === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => onChange(item.key)}
                      accessibilityRole="button"
                      accessibilityLabel={t("books.addBook.accessibility.selectCondition", "Select condition: {{label}}", {
                        label: t(`books.conditions.${item.key}`, item.label),
                      })}
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
          )}
        />
        {errors.condition && <Text style={[s.errorText, { color: c.status.error }]}>{errors.condition.message}</Text>}

        {/* ── Language ── */}
        <SectionLabel text={t("books.addBook.languageLabel", "Language")} required c={c} />
        <Controller
          control={control}
          name="language"
          render={({ field: { onChange, value } }) => (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
              <View style={s.chipRow}>
                {LANGUAGES.map((item) => {
                  const selected = value === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => onChange(item.key)}
                      accessibilityRole="button"
                      accessibilityLabel={t("books.addBook.accessibility.selectLanguage", "Select language: {{label}}", {
                        label: t(`books.languages.${item.key}`, item.label),
                      })}
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
          )}
        />
        {errors.language && <Text style={[s.errorText, { color: c.status.error }]}>{errors.language.message}</Text>}

        {/* ── Swap Type ── */}
        <SectionLabel text={t("books.addBook.swapTypeLabel", "Swap Type")} required c={c} />
        <Controller
          control={control}
          name="swap_type"
          render={({ field: { onChange, value } }) => (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll}>
              <View style={s.chipRow}>
                {SWAP_TYPES.map((item) => {
                  const selected = value === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => onChange(item.key)}
                      accessibilityRole="button"
                      accessibilityLabel={t("books.addBook.accessibility.selectSwapType", "Select swap type: {{label}}", {
                        label: t(`books.swapTypes.${item.key}`, item.label),
                      })}
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
                        {t(`books.swapTypes.${item.key}`, item.label)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}
        />

        {/* ── Genres ── */}
        <SectionLabel
          text={`${t("books.addBook.genresLabel", "Genres")} (${genresValue.length}/${MAX_GENRES})`}
          c={c}
        />
        <View style={s.genreGrid}>
          {GENRE_VALUES.map((g) => {
            const selected = genresValue.includes(g);
            const disabled = !selected && genresValue.length >= MAX_GENRES;
            const slug = GENRE_VALUE_TO_I18N_KEY[g as GenreValue];
            return (
              <Pressable
                key={g}
                onPress={() => !disabled && toggleGenre(g)}
                accessibilityRole="button"
                accessibilityLabel={t("books.addBook.accessibility.toggleGenre", "Toggle genre: {{genre}}", {
                  genre: t(`books.genres.${slug}`, g),
                })}
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
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                s.input,
                s.multiline,
                { backgroundColor: inputBg, borderColor: inputBorder, color: c.text.primary },
              ]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder={t("books.addBook.notesPlaceholder", "Any notes for potential swappers...")}
              placeholderTextColor={c.text.placeholder}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              maxLength={200}
              accessibilityLabel={t("books.addBook.accessibility.notesInput", "Notes for swappers")}
            />
          )}
        />

        {/* ── Submit ── */}
        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || createBook.isPending}
          accessibilityRole="button"
          accessibilityLabel={t("books.addBook.accessibility.listBook", "List book")}
          style={({ pressed }) => [
            s.submitBtn,
            {
              backgroundColor: accent,
              opacity: !isValid ? 0.5 : pressed ? 0.9 : 1,
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

  errorText: { fontSize: 12, marginTop: 4 },
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
