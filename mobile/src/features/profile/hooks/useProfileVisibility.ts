import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

import { API } from "@/configs/apiEndpoints";
import { http } from "@/services/http";
import { useAuthStore } from "@/stores/authStore";
import type { User } from "@/types";

export function useProfileVisibility() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [profilePublic, setProfilePublic] = useState(user?.profile_public ?? true);

  const mutation = useMutation({
    mutationFn: async (val: boolean) => {
      const { data } = await http.patch<User>(API.users.me, {
        profile_public: val,
      });
      return data;
    },
    onMutate: (val) => setProfilePublic(val),
    onSuccess: (data) => setUser(data),
    onError: () => {
      setProfilePublic(user?.profile_public ?? true);
      Alert.alert(
        t("common.error", "Error"),
        t("settings.profileVisibilityError", "Failed to update profile visibility."),
      );
    },
  });

  const toggle = useCallback(
    (val: boolean) => mutation.mutate(val),
    [mutation],
  );

  return {
    profilePublic,
    isPending: mutation.isPending,
    toggle,
  };
}
