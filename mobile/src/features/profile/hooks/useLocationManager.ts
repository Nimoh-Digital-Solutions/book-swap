import * as Location from "expo-location";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { API } from "@/configs/apiEndpoints";
import { http } from "@/services/http";
import { useAuthStore } from "@/stores/authStore";
import type { User } from "@/types";
import { useQueryClient } from "@tanstack/react-query";

export function useLocationManager() {
  const { t } = useTranslation();
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const [gpsUpdating, setGpsUpdating] = useState(false);

  /** Invalidate discovery queries so the homescreen refreshes after a location change. */
  const invalidateDiscovery = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["nearbyCount"] });
    void queryClient.invalidateQueries({ queryKey: ["recentBooks"] });
    void queryClient.invalidateQueries({ queryKey: ["communityStats"] });
  }, [queryClient]);

  const updateFromGps = useCallback(async () => {
    setGpsUpdating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("settings.locationDenied", "Location access denied"),
          t(
            "settings.locationDeniedMsg",
            "Please enable location access in your device settings.",
          ),
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { data } = await http.post<User>(API.users.meLocation, {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      await setUser(data);
      invalidateDiscovery();
      Alert.alert(
        t("settings.locationUpdated", "Location updated"),
        data.neighborhood
          ? t("settings.locationUpdatedMsg", "Set to {{neighborhood}}", {
              neighborhood: data.neighborhood,
            })
          : t(
              "settings.locationUpdatedGeneric",
              "Your location has been updated.",
            ),
      );
    } catch {
      Alert.alert(
        t("common.error", "Error"),
        t("settings.locationError", "Failed to update location."),
      );
    } finally {
      setGpsUpdating(false);
    }
  }, [setUser, invalidateDiscovery, t]);

  const updateFromPostcode = useCallback(
    async (postcode: string) => {
      const { data } = await http.post<User>(API.users.meLocation, {
        postcode,
      });
      await setUser(data);
      invalidateDiscovery();
      return data;
    },
    [setUser, invalidateDiscovery],
  );

  const updateFromQuery = useCallback(
    async (query: string) => {
      const { data } = await http.post<User>(API.users.meLocation, {
        query,
      });
      await setUser(data);
      invalidateDiscovery();
      return data;
    },
    [setUser, invalidateDiscovery],
  );

  return {
    gpsUpdating,
    updateFromGps,
    updateFromPostcode,
    updateFromQuery,
  };
}
