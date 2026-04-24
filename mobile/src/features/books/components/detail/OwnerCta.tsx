import { useNavigation } from "@react-navigation/native";
import { Pencil } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useColors, useIsDark } from "@/hooks/useColors";

import { bookDetailStyles as s } from "./styles";

interface OwnerCtaProps {
  bookId: string;
  isAvailable: boolean;
  updatePending: boolean;
  onToggleStatus: () => void;
  accent: string;
  cardBorderColor: string;
}

export function OwnerCta({
  bookId,
  isAvailable,
  updatePending,
  onToggleStatus,
  accent,
  cardBorderColor,
}: OwnerCtaProps) {
  const c = useColors();
  const isDark = useIsDark();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  return (
    <View style={[s.ctaWrap, { borderTopColor: cardBorderColor }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("books.editBook.title", "Edit Book")}
        onPress={() => navigation.navigate("EditBook", { bookId })}
        style={({ pressed }) => [
          s.ctaBtn,
          { backgroundColor: accent, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Pencil size={18} color="#152018" />
        <Text style={[s.ctaBtnText, { color: "#152018" }]}>
          {t("books.editBook.title", "Edit Book")}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={
          isAvailable
            ? t("books.markUnavailableA11y", "Mark as unavailable")
            : t("books.markAvailableA11y", "Mark as available")
        }
        accessibilityState={{ checked: isAvailable }}
        onPress={onToggleStatus}
        disabled={updatePending}
        style={({ pressed }) => [
          s.statusToggle,
          isAvailable
            ? { backgroundColor: "#22C55E", borderColor: "#22C55E" }
            : {
                backgroundColor: isDark ? c.auth.card : c.neutral[200],
                borderColor: cardBorderColor,
              },
          { opacity: pressed || updatePending ? 0.7 : 1 },
        ]}
      >
        {updatePending ? (
          <ActivityIndicator
            size="small"
            color={isAvailable ? "#fff" : c.text.secondary}
          />
        ) : (
          <Text
            style={[
              s.statusToggleText,
              { color: isAvailable ? "#fff" : c.text.secondary },
            ]}
            numberOfLines={1}
          >
            {isAvailable
              ? t("books.statusAvailable", "Available")
              : t("books.statusUnavailable", "Unavailable")}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
