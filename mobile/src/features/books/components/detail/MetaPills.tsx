import { Globe, Sparkles, Tag } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";

import { GENRE_VALUE_TO_I18N_KEY, type GenreValue } from "../../constants";
import { bookDetailStyles as s } from "./styles";

interface MetaPillsProps {
  genres: string[];
  condition: string;
  language?: string | null;
  cardBg: string;
  cardBorderColor: string;
  accent: string;
}

export function MetaPills({
  genres,
  condition,
  language,
  cardBg,
  cardBorderColor,
  accent,
}: MetaPillsProps) {
  const c = useColors();
  const { t } = useTranslation();
  const firstGenre = genres[0];
  const genreLabel =
    firstGenre && GENRE_VALUE_TO_I18N_KEY[firstGenre as GenreValue]
      ? t(`books.genres.${GENRE_VALUE_TO_I18N_KEY[firstGenre as GenreValue]}`, {
          defaultValue: firstGenre,
        })
      : firstGenre;

  return (
    <Animated.View entering={FadeInUp.duration(250).delay(100)} style={s.metaRow}>
      {firstGenre && (
        <View
          style={[
            s.metaPill,
            { backgroundColor: cardBg, borderColor: cardBorderColor },
          ]}
        >
          <Tag size={14} color={accent} />
          <Text style={[s.metaText, { color: c.text.primary }]}>
            {genreLabel}
          </Text>
        </View>
      )}
      <View
        style={[
          s.metaPill,
          { backgroundColor: cardBg, borderColor: cardBorderColor },
        ]}
      >
        <Sparkles size={14} color={accent} />
        <Text style={[s.metaText, { color: c.text.primary }]}>
          {t(`books.conditions.${condition}`, { defaultValue: condition })}
        </Text>
      </View>
      {language && (
        <View
          style={[
            s.metaPill,
            { backgroundColor: cardBg, borderColor: cardBorderColor },
          ]}
        >
          <Globe size={14} color={accent} />
          <Text style={[s.metaText, { color: c.text.primary }]}>
            {language.toUpperCase()}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
