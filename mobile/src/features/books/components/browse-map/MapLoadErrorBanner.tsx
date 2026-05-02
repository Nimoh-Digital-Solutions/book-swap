import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

import { browseMapStyles as s } from "./styles";

interface MapLoadErrorBannerProps {
  cardBg: string;
  accent: string;
  onRetry: () => void;
  busy: boolean;
}

export function MapLoadErrorBanner({
  cardBg,
  accent,
  onRetry,
  busy,
}: MapLoadErrorBannerProps) {
  const c = useColors();
  const { t } = useTranslation();

  return (
    <View
      style={[
        s.loadErrorBanner,
        { backgroundColor: cardBg, borderColor: c.status.error },
      ]}
    >
      <Text style={[s.loadErrorTitle, { color: c.text.primary }]}>
        {t("browse.loadErrorTitle", "Could not load map data")}
      </Text>
      <Text style={[s.loadErrorBody, { color: c.text.secondary }]}>
        {t("browse.loadErrorBody", "Check your connection and try again.")}
      </Text>
      <Pressable
        onPress={onRetry}
        disabled={busy}
        style={({ pressed }) => [
          s.loadErrorRetry,
          {
            backgroundColor: accent,
            opacity: busy || pressed ? 0.85 : 1,
          },
        ]}
      >
        {busy ? (
          <ActivityIndicator color={c.text.inverse} size="small" />
        ) : (
          <Text style={s.loadErrorRetryText}>
            {t("common.retry", "Retry")}
          </Text>
        )}
      </Pressable>
    </View>
  );
}
