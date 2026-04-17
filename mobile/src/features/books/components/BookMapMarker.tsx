import React, { memo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { BookOpen } from "lucide-react-native";
import { useColors, useIsDark } from "@/hooks/useColors";

interface Props {
  count?: number;
}

/**
 * Custom map marker for a single book or a cluster.
 * Single book: golden circle with book icon.
 * Cluster: larger golden circle with count label.
 */
export const BookMapMarker = memo(function BookMapMarker({ count }: Props) {
  const c = useColors();
  const isDark = useIsDark();
  const isCluster = count != null && count > 1;
  const accent = c.auth.golden;
  const bg = isDark ? c.auth.bg : "#fff";

  if (isCluster) {
    const size = Math.min(56, 36 + Math.log2(count) * 6);
    return (
      <View
        style={[
          s.cluster,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: accent,
            borderColor: bg,
          },
        ]}
      >
        <Text style={s.clusterText}>{count > 99 ? "99+" : count}</Text>
      </View>
    );
  }

  return (
    <View style={[s.pin, { backgroundColor: accent, borderColor: bg }]}>
      <BookOpen size={14} color="#fff" strokeWidth={2.5} />
      <View style={[s.pinTail, { borderTopColor: accent }]} />
    </View>
  );
});

const s = StyleSheet.create({
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: { elevation: 6 },
    }),
  },
  pinTail: {
    position: "absolute",
    bottom: -7,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  cluster: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: { elevation: 8 },
    }),
  },
  clusterText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
});
