import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

import { bookFormStyles as s } from "./styles";

interface ChipOption<T extends string> {
  key: T;
  label: string;
}

interface ChipPickerProps<T extends string> {
  options: ChipOption<T>[];
  value: T | null | undefined;
  onChange: (value: T) => void;
  cardBg: string;
  cardBorder: string;
  accent: string;
  /** Optional callback to derive the accessibility label per option. */
  accessibilityLabelFor?: (option: ChipOption<T>) => string;
}

export function ChipPicker<T extends string>({
  options,
  value,
  onChange,
  cardBg,
  cardBorder,
  accent,
  accessibilityLabelFor,
}: ChipPickerProps<T>) {
  const c = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.chipScroll}
    >
      <View style={s.chipRow}>
        {options.map((item) => {
          const selected = value === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => onChange(item.key)}
              accessibilityRole="button"
              accessibilityLabel={
                accessibilityLabelFor?.(item) ?? item.label
              }
              style={[
                s.chip,
                {
                  backgroundColor: selected ? accent : cardBg,
                  borderColor: selected ? accent : cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  s.chipText,
                  { color: selected ? "#152018" : c.text.secondary },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
