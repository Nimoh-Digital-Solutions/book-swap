import { Navigation } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { browseMapStyles as s } from "./styles";

interface MapControlsProps {
  cardBg: string;
  cardBorderColor: string;
  accent: string;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRecenter: () => void;
}

export function MapControls({
  cardBg,
  cardBorderColor,
  accent,
  onZoomIn,
  onZoomOut,
  onRecenter,
}: MapControlsProps) {
  const { t } = useTranslation();

  return (
    <View
      style={[
        s.mapControls,
        { backgroundColor: cardBg, borderColor: cardBorderColor },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("browse.mapZoomInA11y", "Zoom in map")}
        style={s.mapControlBtn}
        onPress={onZoomIn}
        hitSlop={4}
      >
        <Text style={[s.mapControlIcon, { color: accent }]}>+</Text>
      </Pressable>
      <View style={[s.mapControlDivider, { backgroundColor: cardBorderColor }]} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("browse.mapZoomOutA11y", "Zoom out map")}
        style={s.mapControlBtn}
        onPress={onZoomOut}
        hitSlop={4}
      >
        <Text style={[s.mapControlIcon, { color: accent }]}>{"\u2212"}</Text>
      </Pressable>
      <View style={[s.mapControlDivider, { backgroundColor: cardBorderColor }]} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(
          "browse.mapRecenterA11y",
          "Center map on my location",
        )}
        style={s.mapControlBtn}
        onPress={onRecenter}
        hitSlop={4}
      >
        <Navigation size={18} color={accent} />
      </Pressable>
    </View>
  );
}
