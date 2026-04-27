import { Flag } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

import { bookDetailStyles as s } from "./styles";

interface ReportRowProps {
  onPress: () => void;
}

export function ReportRow({ onPress }: ReportRowProps) {
  const c = useColors();
  const { t } = useTranslation();

  return (
    <View style={s.reportRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("report.button", "Report")}
        onPress={onPress}
        style={({ pressed }) => [s.reportBtn, pressed && { opacity: 0.6 }]}
      >
        <Flag size={14} color={c.text.placeholder} />
        <Text style={[s.reportText, { color: c.text.placeholder }]}>
          {t("report.button", "Report")}
        </Text>
      </Pressable>
    </View>
  );
}
