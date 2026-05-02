/**
 * LocationMismatchBanner — inline, dismissible banner for React Native.
 *
 * Shown when the user's GPS location differs significantly from their stored
 * profile location. Offers "Update location" (calls the existing
 * `useLocationManager.updateFromGps`) and "Dismiss" actions.
 */
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { useColors } from "@/hooks/useColors";

interface LocationMismatchBannerProps {
  profileNeighborhood: string;
  distanceKm: number;
  onUpdate: () => void;
  onDismiss: () => void;
  updating?: boolean;
}

export function LocationMismatchBanner({
  profileNeighborhood,
  distanceKm,
  onUpdate,
  onDismiss,
  updating = false,
}: LocationMismatchBannerProps) {
  const { t } = useTranslation();
  const c = useColors();

  return (
    <View
      style={[styles.container, { borderColor: c.auth.golden + "4D" }]}
      accessibilityRole="alert"
    >
      <Text style={[styles.message, { color: c.text.primary }]}>
        {t(
          "location.mismatchMessage",
          "You're ~{{distanceKm}} km from your profile location ({{profileNeighborhood}}). Books you add won't be visible to nearby users.",
          { distanceKm, profileNeighborhood },
        )}
      </Text>
      <View style={styles.actions}>
        <Pressable
          onPress={onUpdate}
          disabled={updating}
          style={[styles.updateBtn, { backgroundColor: c.auth.golden }]}
          accessibilityRole="button"
          accessibilityLabel={t(
            "location.updateLocation",
            "Update my location",
          )}
        >
          <Text style={[styles.updateText, { color: c.auth.bg }]}>
            {updating
              ? t("common.updating", "Updating…")
              : t("location.updateLocation", "Update my location")}
          </Text>
        </Pressable>
        <Pressable
          onPress={onDismiss}
          style={styles.dismissBtn}
          accessibilityRole="button"
          accessibilityLabel={t("common.dismiss", "Dismiss")}
        >
          <Text style={[styles.dismissText, { color: c.text.secondary }]}>
            {t("common.dismiss", "Dismiss")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "rgba(228, 182, 67, 0.08)",
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  updateBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  updateText: {
    fontSize: 13,
    fontWeight: "600",
  },
  dismissBtn: {
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  dismissText: {
    fontSize: 13,
  },
});
