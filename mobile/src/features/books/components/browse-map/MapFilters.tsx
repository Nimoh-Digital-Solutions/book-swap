import { MapPin, SlidersHorizontal, X } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

import {
  DISTANCE_OPTIONS,
  GENRE_VALUE_TO_I18N_KEY,
  GENRE_VALUES,
  type GenreValue,
} from "../../constants";
import { browseMapStyles as s } from "./styles";

interface MapFiltersProps {
  selectedRadius: number;
  onSelectRadius: (val: number) => void;
  selectedGenres: string[];
  onToggleGenre: (g: string) => void;
  showGenres: boolean;
  onToggleGenreList: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  radiusCounts: Record<string, number> | undefined;
  cardBg: string;
  cardBorderColor: string;
  accent: string;
}

export function MapFilters({
  selectedRadius,
  onSelectRadius,
  selectedGenres,
  onToggleGenre,
  showGenres,
  onToggleGenreList,
  hasActiveFilters,
  onClearFilters,
  radiusCounts,
  cardBg,
  cardBorderColor,
  accent,
}: MapFiltersProps) {
  const c = useColors();
  const { t } = useTranslation();

  return (
    <View style={s.filtersSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipRow}
      >
        {DISTANCE_OPTIONS.map((opt) => {
          const active = selectedRadius === opt.value;
          const count = radiusCounts?.[String(opt.value)];
          const radiusLabel = t("browse.distanceKm", "{{count}} km", {
            count: opt.km,
          });
          return (
            <Pressable
              key={opt.value}
              accessibilityRole="button"
              accessibilityLabel={
                count != null
                  ? `${radiusLabel} search radius, ${count} books nearby`
                  : `${radiusLabel} search radius`
              }
              accessibilityState={{ selected: active }}
              onPress={() => onSelectRadius(opt.value)}
              style={[
                s.chip,
                {
                  backgroundColor: active ? accent : cardBg,
                  borderColor: active ? accent : cardBorderColor,
                },
              ]}
            >
              <MapPin size={12} color={active ? "#fff" : c.text.secondary} />
              <Text
                style={[
                  s.chipText,
                  { color: active ? "#fff" : c.text.primary },
                ]}
              >
                {radiusLabel}
                {count != null && (
                  <Text
                    style={{
                      color: active
                        ? "rgba(255,255,255,0.7)"
                        : c.text.placeholder,
                      fontSize: 11,
                      fontWeight: "600",
                    }}
                  >
                    {` (${count})`}
                  </Text>
                )}
              </Text>
            </Pressable>
          );
        })}

        <View style={[s.chipDivider, { backgroundColor: cardBorderColor }]} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            showGenres
              ? t("browse.genresFilterCloseA11y", "Hide genre filters")
              : t("browse.genresFilterOpenA11y", "Show genre filters")
          }
          accessibilityState={{ expanded: showGenres }}
          onPress={onToggleGenreList}
          style={[
            s.chip,
            {
              backgroundColor: selectedGenres.length > 0 ? accent : cardBg,
              borderColor:
                selectedGenres.length > 0 ? accent : cardBorderColor,
            },
          ]}
        >
          <SlidersHorizontal
            size={12}
            color={selectedGenres.length > 0 ? "#fff" : c.text.secondary}
          />
          <Text
            style={[
              s.chipText,
              {
                color: selectedGenres.length > 0 ? "#fff" : c.text.primary,
              },
            ]}
          >
            {selectedGenres.length > 0
              ? t("browse.genreFilterSelected", "Genres ({{count}})", {
                  count: selectedGenres.length,
                })
              : t("browse.genreFilter", "Genres")}
          </Text>
        </Pressable>

        {hasActiveFilters && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("browse.clearFiltersA11y", "Clear filters")}
            onPress={onClearFilters}
            style={[s.chip, { borderColor: cardBorderColor }]}
          >
            <X size={12} color={c.text.secondary} />
            <Text style={[s.chipText, { color: c.text.secondary }]}>
              {t("browse.clearFilters", "Clear")}
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {showGenres && (
        <View style={s.genreWrap}>
          {GENRE_VALUES.map((g) => {
            const active = selectedGenres.includes(g);
            const slug = GENRE_VALUE_TO_I18N_KEY[g as GenreValue];
            const genreLabel = t(`books.genres.${slug}`, g);
            return (
              <Pressable
                key={g}
                accessibilityRole="button"
                accessibilityLabel={t(
                  "browse.genreToggleA11y",
                  "Genre {{genre}}",
                  { genre: genreLabel },
                )}
                accessibilityState={{ selected: active }}
                onPress={() => onToggleGenre(g)}
                style={[
                  s.genreChip,
                  {
                    backgroundColor: active ? accent + "20" : cardBg,
                    borderColor: active ? accent : cardBorderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    s.genreChipText,
                    { color: active ? accent : c.text.primary },
                  ]}
                >
                  {genreLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
