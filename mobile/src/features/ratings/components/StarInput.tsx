import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Star } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  value: number;
  onChange: (score: number) => void;
  disabled?: boolean;
  size?: number;
}

export const StarInput = memo(function StarInput({
  value,
  onChange,
  disabled = false,
  size = 36,
}: Props) {
  const c = useColors();
  const accent = c.auth.golden;
  const empty = c.auth.textDimmed;

  return (
    <View style={s.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          accessibilityRole="button"
          accessibilityLabel={
            star === 1 ? "Rate 1 star" : `Rate ${star} stars`
          }
          accessibilityState={{ disabled }}
          onPress={() => !disabled && onChange(star)}
          hitSlop={6}
          style={({ pressed }) => [
            s.star,
            pressed && !disabled && { transform: [{ scale: 1.15 }] },
          ]}
        >
          <Star
            size={size}
            color={star <= value ? accent : empty}
            fill={star <= value ? accent : "transparent"}
            strokeWidth={1.5}
          />
        </Pressable>
      ))}
    </View>
  );
});

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  star: {},
});
