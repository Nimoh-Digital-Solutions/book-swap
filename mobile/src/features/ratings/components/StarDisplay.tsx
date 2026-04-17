import React, { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Star } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  score: number;
  size?: number;
}

export const StarDisplay = memo(function StarDisplay({
  score,
  size = 14,
}: Props) {
  const c = useColors();
  const accent = c.auth.golden;
  const empty = c.auth.textDimmed;

  return (
    <View style={s.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          color={star <= score ? accent : empty}
          fill={star <= score ? accent : "transparent"}
          strokeWidth={1.5}
        />
      ))}
    </View>
  );
});

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
});
