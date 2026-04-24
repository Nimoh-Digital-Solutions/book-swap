import React from "react";
import { Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

import { editProfileStyles as s } from "./styles";

interface SectionLabelProps {
  text: string;
  required?: boolean;
}

export function SectionLabel({ text, required }: SectionLabelProps) {
  const c = useColors();
  return (
    <View style={s.labelRow}>
      <Text style={[s.label, { color: c.text.primary }]}>{text}</Text>
      {required && (
        <Text style={[s.required, { color: c.auth.golden }]}>*</Text>
      )}
    </View>
  );
}
