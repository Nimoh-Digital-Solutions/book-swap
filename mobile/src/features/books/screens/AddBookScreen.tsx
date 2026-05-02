import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { TFunction } from "i18next";
import { BookOpen } from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
} from "react-native";
import { z } from "zod";

import { LocationMismatchBanner } from "@/components/LocationMismatchBanner";
import { SuccessCheckmark } from "@/components/SuccessCheckmark";
import { useColors, useIsDark } from "@/hooks/useColors";
import { useLocationMismatch } from "@/hooks/useLocationMismatch";

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
  resolveLanguage,
} from "@/features/books/components/book-form";
import {
  useCreateBook,
  type CreateBookPayload,
} from "@/features/books/hooks/useBooks";
import { useLocationManager } from "@/features/profile/hooks/useLocationManager";
import type {
  MainTabNavigationProp,
  ScanStackParamList,
} from "@/navigation/types";

type Route = RouteProp<ScanStackParamList, "AddBook">;
type Nav = NativeStackNavigationProp<ScanStackParamList, "AddBook">;

function createAddBookSchema(t: TFunction) {
  return z.object({
    title: z
      .string()
      .min(
        1,
        t("books.addBook.validation.titleRequired", "Title is required"),
      )
      .max(200),
    author: z
      .string()
      .min(
        1,
        t("books.addBook.validation.authorRequired", "Author is required"),
      )
      .max(200),
    description: z.string().max(2000),
    condition: z.enum(["new", "like_new", "good", "acceptable"], {
      message: t(
        "books.addBook.validation.conditionRequired",
        "Select a condition",
      ),
    }),
    language: z.enum(["en", "nl", "de", "fr", "es", "other"], {
      message: t(
        "books.addBook.validation.languageRequired",
        "Select a language",
      ),
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
  const mismatch = useLocationMismatch();
  const { gpsUpdating, updateFromGps } = useLocationManager();
  const [showCheck, setShowCheck] = useState(false);
  const successDataRef = useRef<{ id: string } | null>(null);

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

  const toggleGenre = useCallback(
    (g: string) => {
      const current = genresValue;
      const updated = current.includes(g)
        ? current.filter((x) => x !== g)
        : current.length < MAX_GENRES
          ? [...current, g]
          : current;
      setValue("genres", updated, { shouldValidate: true });
    },
    [genresValue, setValue],
  );

  const onSubmit = (values: AddBookFormValues) => {
    const payload: CreateBookPayload = {
      title: values.title.trim(),
      author: values.author.trim(),
      condition: values.condition,
      language: values.language,
      swap_type: values.swap_type,
      ...(isbn && { isbn }),
      ...(values.description?.trim() && {
        description: values.description.trim(),
      }),
      ...(coverUrl && { cover_url: coverUrl }),
      ...(values.genres.length > 0 && { genres: values.genres }),
      ...(values.notes?.trim() && { notes: values.notes.trim() }),
      ...(params?.page_count && { page_count: params.page_count }),
      ...(params?.publish_year && { publish_year: params.publish_year }),
    };

    createBook.mutate(payload, {
      onSuccess: (data) => {
        successDataRef.current = data;
        setShowCheck(true);
      },
      onError: () => {
        Alert.alert(
          t("common.error", "Error"),
          t(
            "books.addBook.errorMsg",
            "Failed to list book. Please try again.",
          ),
        );
      },
    });
  };

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

  const handleCheckDone = useCallback(() => {
    setShowCheck(false);
    const data = successDataRef.current;
    if (!data) return;

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
        { text: t("books.addBook.addPhotos", "Add Photos"), onPress: goToPhotos },
        { text: t("books.addBook.skipPhotos", "Done"), style: "cancel", onPress: goToMyBooks },
      ],
    );
  }, [navigation, t]);

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

        {mismatch.showMismatch && mismatch.profileNeighborhood && (
          <LocationMismatchBanner
            profileNeighborhood={mismatch.profileNeighborhood}
            distanceKm={mismatch.distanceKm ?? 0}
            onUpdate={updateFromGps}
            onDismiss={mismatch.dismiss}
            updating={gpsUpdating}
          />
        )}

        <SectionLabel text={t("books.addBook.titleLabel", "Title")} required />
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                s.input,
                {
                  backgroundColor: inputBg,
                  borderColor: errors.title ? c.status.error : inputBorder,
                  color: c.text.primary,
                },
              ]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
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
          )}
        />
        {errors.title && (
          <Text style={[s.errorText, { color: c.status.error }]}>
            {errors.title.message}
          </Text>
        )}

        <SectionLabel
          text={t("books.addBook.authorLabel", "Author")}
          required
        />
        <Controller
          control={control}
          name="author"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              style={[
                s.input,
                {
                  backgroundColor: inputBg,
                  borderColor: errors.author ? c.status.error : inputBorder,
                  color: c.text.primary,
                },
              ]}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
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
          )}
        />
        {errors.author && (
          <Text style={[s.errorText, { color: c.status.error }]}>
            {errors.author.message}
          </Text>
        )}

        <SectionLabel
          text={t("books.addBook.descriptionLabel", "Description")}
        />
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
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
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
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
          )}
        />

        <SectionLabel
          text={t("books.addBook.conditionLabel", "Condition")}
          required
        />
        <Controller
          control={control}
          name="condition"
          render={({ field: { onChange, value } }) => (
            <ChipPicker
              options={conditionOptions}
              value={value}
              onChange={onChange}
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
          )}
        />
        {errors.condition && (
          <Text style={[s.errorText, { color: c.status.error }]}>
            {errors.condition.message}
          </Text>
        )}

        <SectionLabel
          text={t("books.addBook.languageLabel", "Language")}
          required
        />
        <Controller
          control={control}
          name="language"
          render={({ field: { onChange, value } }) => (
            <ChipPicker
              options={languageOptions}
              value={value}
              onChange={onChange}
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
          )}
        />
        {errors.language && (
          <Text style={[s.errorText, { color: c.status.error }]}>
            {errors.language.message}
          </Text>
        )}

        <SectionLabel
          text={t("books.addBook.swapTypeLabel", "Swap Type")}
          required
        />
        <Controller
          control={control}
          name="swap_type"
          render={({ field: { onChange, value } }) => (
            <ChipPicker
              options={swapTypeOptions}
              value={value}
              onChange={onChange}
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
          )}
        />

        <SectionLabel
          text={`${t("books.addBook.genresLabel", "Genres")} (${genresValue.length}/${MAX_GENRES})`}
        />
        <GenreGrid
          selected={genresValue}
          onToggle={toggleGenre}
          cardBg={cardBg}
          cardBorder={cardBorder}
          accent={accent}
        />

        <SectionLabel
          text={t("books.addBook.notesLabel", "Notes for swappers")}
        />
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
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
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
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
          )}
        />

        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || createBook.isPending}
          accessibilityRole="button"
          accessibilityLabel={t(
            "books.addBook.accessibility.listBook",
            "List book",
          )}
          style={({ pressed }) => [
            s.primaryBtn,
            {
              backgroundColor: accent,
              opacity: !isValid ? 0.5 : pressed ? 0.9 : 1,
            },
          ]}
        >
          {createBook.isPending ? (
            <ActivityIndicator size="small" color={c.text.inverse} />
          ) : (
            <BookOpen size={18} color="#152018" />
          )}
          <Text style={s.primaryBtnText}>
            {createBook.isPending
              ? t("books.addBook.submitting", "Listing...")
              : t("books.addBook.submit", "List Book")}
          </Text>
        </Pressable>
      </ScrollView>
      <SuccessCheckmark visible={showCheck} onDone={handleCheckDone} />
    </KeyboardAvoidingView>
  );
}
