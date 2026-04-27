import { BookOpen, FileText, Tag } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";

import { bookDetailStyles as s } from "./styles";

interface DescriptionSectionProps {
  description?: string | null;
  hasGenres: boolean;
  accent: string;
}

export function DescriptionSection({
  description,
  hasGenres,
  accent,
}: DescriptionSectionProps) {
  const c = useColors();
  const { t } = useTranslation();

  return (
    <>
      <Animated.View
        entering={FadeInUp.duration(250).delay(200)}
        style={s.descSection}
      >
        <View style={s.cardHeader}>
          <BookOpen size={16} color={accent} />
          <Text style={[s.cardLabel, { color: c.text.secondary }]}>
            {t("books.description", "Description")}
          </Text>
        </View>
        {description ? (
          <Text style={[s.description, { color: c.text.primary }]}>
            {description}
          </Text>
        ) : (
          <View style={s.inlineEmpty}>
            <FileText size={18} color={c.text.placeholder} />
            <Text style={[s.inlineEmptyText, { color: c.text.placeholder }]}>
              {t("books.noDescription", "No description added yet")}
            </Text>
          </View>
        )}
      </Animated.View>

      {!hasGenres && (
        <View style={[s.descSection, { marginTop: 0 }]}>
          <View style={s.cardHeader}>
            <Tag size={16} color={accent} />
            <Text style={[s.cardLabel, { color: c.text.secondary }]}>
              {t("books.genresHeading", "Genres")}
            </Text>
          </View>
          <View style={s.inlineEmpty}>
            <Text style={[s.inlineEmptyText, { color: c.text.placeholder }]}>
              {t("books.noGenres", "No genres specified")}
            </Text>
          </View>
        </View>
      )}
    </>
  );
}
