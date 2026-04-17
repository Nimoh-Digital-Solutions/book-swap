import { BellRing } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

import { EmptyState } from "@/components/EmptyState";
import { useColors, useIsDark } from "@/hooks/useColors";

export function NotificationPreferencesScreen() {
  const c = useColors();
  const isDark = useIsDark();
  const bg = isDark ? c.auth.bg : c.neutral[50];

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <EmptyState
        icon={BellRing}
        title="Notification Preferences"
        subtitle="Notification settings are coming soon."
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: "center" },
});
