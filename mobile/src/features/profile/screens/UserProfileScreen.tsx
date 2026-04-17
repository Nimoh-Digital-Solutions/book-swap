import { useRoute, type RouteProp } from "@react-navigation/native";
import { User } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { useColors, useIsDark } from "@/hooks/useColors";
import type { HomeStackParamList } from "@/navigation/types";

type Route = RouteProp<HomeStackParamList, "UserProfile">;

export function UserProfileScreen() {
  const { params } = useRoute<Route>();
  const c = useColors();
  const isDark = useIsDark();
  const bg = isDark ? c.auth.bg : c.neutral[50];

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <EmptyState
        icon={User}
        title="User Profile"
        subtitle="User profiles are coming soon."
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: "center" },
});
