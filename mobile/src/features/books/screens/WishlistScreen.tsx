import { Heart } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { useColors, useIsDark } from "@/hooks/useColors";

export function WishlistScreen() {
  const c = useColors();
  const isDark = useIsDark();
  const bg = isDark ? c.auth.bg : c.neutral[50];

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <EmptyState
        icon={Heart}
        title="Wishlist"
        subtitle="Your wishlist is coming soon."
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: "center" },
});
