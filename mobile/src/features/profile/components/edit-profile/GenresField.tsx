import { ChevronRight } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { Controller, type Control } from "react-hook-form";

import {
  GENRE_VALUE_TO_I18N_KEY,
  type GenreValue,
} from "@/features/books/constants";
import { GenrePickerSheet } from "@/features/profile/components/GenrePickerSheet";
import { useColors, useIsDark } from "@/hooks/useColors";

import { SectionLabel } from "./SectionLabel";
import type { EditProfileFormValues } from "./schema";
import { editProfileStyles as s } from "./styles";

interface GenresFieldProps {
  control: Control<EditProfileFormValues>;
  count: number;
  cardBg: string;
  cardBorder: string;
  accent: string;
}

export function GenresField({
  control,
  count,
  cardBg,
  cardBorder,
  accent,
}: GenresFieldProps) {
  const c = useColors();
  const isDark = useIsDark();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <SectionLabel
        text={`${t("profile.edit.genresLabel", "Preferred Genres")} (${count}/5)`}
      />
      <Controller
        control={control}
        name="preferred_genres"
        render={({ field: { onChange, value } }) => (
          <>
            <Pressable
              onPress={() => setOpen(true)}
              style={[
                s.pickerBtn,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t(
                "profile.edit.a11y.selectGenres",
                "Select preferred genres",
              )}
            >
              <Text
                style={[
                  s.pickerBtnText,
                  {
                    color:
                      value && value.length > 0
                        ? c.text.primary
                        : c.text.placeholder,
                  },
                ]}
                numberOfLines={1}
              >
                {value && value.length > 0
                  ? value
                      .map((g) => {
                        const slug = GENRE_VALUE_TO_I18N_KEY[g as GenreValue];
                        return slug ? t(`books.genres.${slug}`, g) : g;
                      })
                      .join(", ")
                  : t("profile.edit.selectGenres", "Select genres…")}
              </Text>
              <ChevronRight size={18} color={c.text.placeholder} />
            </Pressable>

            {value && value.length > 0 && (
              <View style={s.genreChipRow}>
                {value.map((g) => (
                  <View
                    key={g}
                    style={[
                      s.genreChip,
                      { backgroundColor: accent + "18", borderColor: accent },
                    ]}
                  >
                    <Text
                      style={[
                        s.genreChipText,
                        { color: isDark ? accent : "#152018" },
                      ]}
                    >
                      {GENRE_VALUE_TO_I18N_KEY[g as GenreValue]
                        ? t(
                            `books.genres.${GENRE_VALUE_TO_I18N_KEY[g as GenreValue]}`,
                            g,
                          )
                        : g}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <GenrePickerSheet
              value={value ?? []}
              onChange={onChange}
              open={open}
              onClose={() => setOpen(false)}
            />
          </>
        )}
      />
    </>
  );
}
