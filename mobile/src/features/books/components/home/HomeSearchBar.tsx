import { Search } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput, View } from "react-native";

import { radius, shadows, spacing } from "@/constants/theme";
import { useColors, useIsDark } from "@/hooks/useColors";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder: string;
}

export function HomeSearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder,
}: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();

  return (
    <View
      style={[
        s.bar,
        {
          backgroundColor: isDark ? c.auth.card : c.surface.white,
          borderColor: isDark ? c.auth.cardBorder : c.border.default,
        },
      ]}
    >
      <Search size={20} color={c.text.subtle} />
      <TextInput
        accessibilityRole="search"
        accessibilityLabel={t("home.search", "Search books")}
        style={[s.input, { color: c.text.primary }]}
        placeholder={placeholder}
        placeholderTextColor={c.text.placeholder}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
      />
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    ...shadows.card,
  },
  input: { flex: 1, fontSize: 15, padding: 0 },
});
