import { Search, X } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, Pressable, TextInput, View } from "react-native";

import { useColors } from "@/hooks/useColors";

import { browseMapStyles as s } from "./styles";

interface MapSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  cardBg: string;
  cardBorderColor: string;
}

export function MapSearchBar({
  value,
  onChange,
  cardBg,
  cardBorderColor,
}: MapSearchBarProps) {
  const c = useColors();
  const { t } = useTranslation();

  return (
    <View
      style={[s.searchWrap, { backgroundColor: cardBg, borderColor: cardBorderColor }]}
    >
      <Search size={18} color={c.text.placeholder} />
      <TextInput
        style={[s.searchInput, { color: c.text.primary }]}
        placeholder={t(
          "browse.searchPlaceholder",
          "Search books, authors...",
        )}
        placeholderTextColor={c.text.placeholder}
        value={value}
        onChangeText={onChange}
        returnKeyType="search"
        onSubmitEditing={() => Keyboard.dismiss()}
        accessibilityLabel={t(
          "browse.searchPlaceholder",
          "Search books, authors...",
        )}
      />
      {value.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("browse.clearSearchA11y", "Clear search")}
          onPress={() => onChange("")}
          hitSlop={8}
        >
          <X size={16} color={c.text.placeholder} />
        </Pressable>
      )}
    </View>
  );
}
