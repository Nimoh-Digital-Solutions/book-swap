import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, type ViewStyle } from "react-native";
import { useColors, useIsDark } from "@/hooks/useColors";

interface SkeletonProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
  const c = useColors();
  const isDark = useIsDark();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const bg = isDark ? c.auth.card : c.neutral[200];

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: bg, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  const c = useColors();
  const isDark = useIsDark();

  return (
    <Animated.View
      style={[
        s.card,
        {
          backgroundColor: isDark ? c.auth.card : c.surface.white,
          borderColor: isDark ? c.auth.cardBorder : c.border.default,
        },
      ]}
    >
      <Skeleton width={80} height={112} borderRadius={4} />
      <Animated.View style={s.cardInfo}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
        <Skeleton width="30%" height={10} style={{ marginTop: 12 }} />
      </Animated.View>
    </Animated.View>
  );
}

export function SkeletonBookDetail() {
  return (
    <Animated.View style={s.detailWrap}>
      <Skeleton width="100%" height={280} borderRadius={12} />
      <Animated.View style={s.detailInfo}>
        <Skeleton width="70%" height={22} />
        <Skeleton width="40%" height={16} style={{ marginTop: 8 }} />
        <Animated.View style={s.detailPills}>
          <Skeleton width={80} height={32} borderRadius={16} />
          <Skeleton width={90} height={32} borderRadius={16} />
          <Skeleton width={60} height={32} borderRadius={16} />
        </Animated.View>
        <Skeleton width="100%" height={14} style={{ marginTop: 16 }} />
        <Skeleton width="90%" height={14} style={{ marginTop: 6 }} />
        <Skeleton width="70%" height={14} style={{ marginTop: 6 }} />
      </Animated.View>
    </Animated.View>
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
