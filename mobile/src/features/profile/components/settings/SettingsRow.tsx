import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { useColors, useIsDark } from "@/hooks/useColors";

import { settingsStyles as s } from "./styles";

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}

export function SettingsRow({ icon, title, subtitle, onPress }: SettingsRowProps) {
  const c = useColors();
  const isDark = useIsDark();
  return (
    <Pressable
      style={({ pressed }) => [
        s.row,
        pressed && {
          backgroundColor: isDark ? c.auth.cardBorder + "20" : c.neutral[50],
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
    >
      <View style={s.rowLeft}>
        <View
          style={[
            s.iconCircle,
            { backgroundColor: isDark ? c.auth.golden + "14" : c.neutral[50] },
          ]}
        >
          {icon}
        </View>
        <View style={s.rowTextWrap}>
          <Text style={[s.rowTitle, { color: c.text.primary }]}>{title}</Text>
          <Text style={[s.rowSubtitle, { color: c.text.secondary }]}>
            {subtitle}
          </Text>
        </View>
      </View>
      <ChevronRight size={20} color={c.text.placeholder} />
    </Pressable>
  );
}
