import { Check } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import {
  GENRE_VALUES,
  GENRE_VALUE_TO_I18N_KEY,
  type GenreValue,
} from "@/features/books/constants";
import { useColors } from "@/hooks/useColors";

import { MAX_GENRES } from "./constants";
import { bookFormStyles as s } from "./styles";

interface GenreGridProps {
  selected: string[];
  onToggle: (genre: string) => void;
  cardBg: string;
  cardBorder: string;
  accent: string;
  max?: number;
}

export function GenreGrid({
  selected,
  onToggle,
  cardBg,
  cardBorder,
  accent,
  max = MAX_GENRES,
}: GenreGridProps) {
  const c = useColors();
  const { t } = useTranslation();

  return (
    <View style={s.genreGrid}>
      {GENRE_VALUES.map((g) => {
        const isSelected = selected.includes(g);
        const disabled = !isSelected && selected.length >= max;
        const slug = GENRE_VALUE_TO_I18N_KEY[g as GenreValue];
        const label = t(`books.genres.${slug}`, g);
        return (
          <Pressable
            key={g}
            onPress={() => !disabled && onToggle(g)}
            accessibilityRole="button"
            accessibilityLabel={t(
              "books.addBook.accessibility.toggleGenre",
              "Toggle genre: {{genre}}",
              { genre: label },
            )}
            style={[
              s.genreChip,
              {
                backgroundColor: isSelected ? accent : cardBg,
                borderColor: isSelected ? accent : cardBorder,
                opacity: disabled ? 0.4 : 1,
              },
            ]}
          >
            {isSelected && (
              <Check size={12} color="#152018" strokeWidth={3} />
            )}
            <Text
              style={[
                s.genreChipText,
                { color: isSelected ? "#152018" : c.text.secondary },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
