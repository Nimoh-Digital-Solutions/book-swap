import React, { useEffect } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useColors, useIsDark } from "@/hooks/useColors";
import { ANIMATION } from "@/constants/animation";

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
  const c = useColors();
  const isDark = useIsDark();
  const opacity = useSharedValue(ANIMATION.skeleton.opacityRange[0] as number);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(ANIMATION.skeleton.opacityRange[1], {
          duration: ANIMATION.skeleton.halfCycleDuration,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(ANIMATION.skeleton.opacityRange[0], {
          duration: ANIMATION.skeleton.halfCycleDuration,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
    );
  }, [opacity]);

  const bg = isDark ? c.auth.card : c.neutral[200];

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: bg },
        animStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const c = useColors();
  const isDark = useIsDark();

  return (
    <View
      style={[
        s.card,
        {
          backgroundColor: isDark ? c.auth.card : c.surface.white,
          borderColor: isDark ? c.auth.cardBorder : c.border.default,
        },
      ]}
    >
      <Skeleton width={80} height={112} borderRadius={4} />
      <View style={s.cardInfo}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
        <Skeleton width="30%" height={10} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

export function SkeletonBookDetail() {
  return (
    <View style={s.detailWrap}>
      <Skeleton width="100%" height={280} borderRadius={12} />
      <View style={s.detailInfo}>
        <Skeleton width="70%" height={22} />
        <Skeleton width="40%" height={16} style={{ marginTop: 8 }} />
        <View style={s.detailPills}>
          <Skeleton width={80} height={32} borderRadius={16} />
          <Skeleton width={90} height={32} borderRadius={16} />
          <Skeleton width={60} height={32} borderRadius={16} />
        </View>
        <Skeleton width="100%" height={14} style={{ marginTop: 16 }} />
        <Skeleton width="90%" height={14} style={{ marginTop: 6 }} />
        <Skeleton width="70%" height={14} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardInfo: { flex: 1 },
  detailWrap: { padding: 8 },
  detailInfo: { paddingHorizontal: 16, paddingTop: 16 },
  detailPills: { flexDirection: "row", gap: 8, marginTop: 16 },
});
