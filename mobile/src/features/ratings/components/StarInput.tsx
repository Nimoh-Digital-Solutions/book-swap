import React, { memo, useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Star } from "lucide-react-native";
import { useColors } from "@/hooks/useColors";
import { ANIMATION } from "@/constants/animation";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  value: number;
  onChange: (score: number) => void;
  disabled?: boolean;
  size?: number;
}

function StarButton({
  star,
  filled,
  size,
  disabled,
  onSelect,
  accentColor,
  emptyColor,
}: {
  star: number;
  filled: boolean;
  size: number;
  disabled: boolean;
  onSelect: (star: number) => void;
  accentColor: string;
  emptyColor: string;
}) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    if (!disabled) {
      scale.value = withSpring(1.15, ANIMATION.spring.bounce);
    }
  }, [disabled, scale]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, ANIMATION.spring.snappy);
  }, [scale]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={star === 1 ? "Rate 1 star" : `Rate ${star} stars`}
      accessibilityState={{ disabled }}
      onPress={() => !disabled && onSelect(star)}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      hitSlop={6}
      style={animStyle}
    >
      <Star
        size={size}
        color={filled ? accentColor : emptyColor}
        fill={filled ? accentColor : "transparent"}
        strokeWidth={1.5}
      />
    </AnimatedPressable>
  );
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
        <StarButton
          key={star}
          star={star}
          filled={star <= value}
          size={size}
          disabled={disabled}
          onSelect={onChange}
          accentColor={accent}
          emptyColor={empty}
        />
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
});
