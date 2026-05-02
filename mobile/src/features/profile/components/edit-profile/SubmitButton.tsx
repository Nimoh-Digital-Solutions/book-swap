import { Save } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text } from "react-native";

import { useColors } from "@/hooks/useColors";
import { editProfileStyles as s } from "./styles";

interface SubmitButtonProps {
  hasChanges: boolean;
  isPending: boolean;
  onPress: () => void;
  accent: string;
}

export function SubmitButton({
  hasChanges,
  isPending,
  onPress,
  accent,
}: SubmitButtonProps) {
  const { t } = useTranslation();
  const c = useColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={!hasChanges || isPending}
      style={({ pressed }) => [
        s.submitBtn,
        {
          backgroundColor: accent,
          opacity: !hasChanges ? 0.5 : pressed ? 0.9 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={
        isPending
          ? t("profile.edit.a11y.saving", "Saving profile changes")
          : t("profile.edit.a11y.save", "Save profile changes")
      }
    >
      {isPending ? (
        <ActivityIndicator size="small" color={c.auth.bgDeep} />
      ) : (
        <Save size={18} color={c.auth.bgDeep} />
      )}
      <Text style={s.submitBtnText}>
        {isPending
          ? t("profile.edit.saving", "Saving…")
          : t("profile.edit.save", "Save Changes")}
      </Text>
    </Pressable>
  );
}
