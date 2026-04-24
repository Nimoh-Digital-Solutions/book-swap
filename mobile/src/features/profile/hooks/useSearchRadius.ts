import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { API } from "@/configs/apiEndpoints";
import { http } from "@/services/http";
import { useAuthStore } from "@/stores/authStore";
import type { User } from "@/types";

export const RADIUS_OPTIONS = [
  { value: 1000, label: "1 km" },
  { value: 2000, label: "2 km" },
  { value: 5000, label: "5 km" },
  { value: 10000, label: "10 km" },
  { value: 25000, label: "25 km" },
  { value: 50000, label: "50 km" },
] as const;

export function useSearchRadius() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const currentRadius = user?.preferred_radius ?? 5000;

  const mutation = useMutation({
    mutationFn: async (newRadius: number) => {
      const { data } = await http.patch<User>(API.users.me, {
        preferred_radius: newRadius,
      });
      return data;
    },
    onSuccess: (data) => setUser(data),
    onError: () => {
      Alert.alert(
        t("common.error", "Error"),
        t("settings.radiusError", "Failed to update search radius."),
      );
    },
  });

  return {
    currentRadius,
    isPending: mutation.isPending,
    update: (val: number) => mutation.mutate(val),
  };
}
