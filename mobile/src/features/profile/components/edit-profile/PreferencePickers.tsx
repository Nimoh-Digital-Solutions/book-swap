import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Controller, type Control } from "react-hook-form";

import { useColors } from "@/hooks/useColors";

import { SectionLabel } from "./SectionLabel";
import {
  LANGUAGE_OPTION_KEYS,
  RADIUS_VALUES,
  type EditProfileFormValues,
} from "./schema";
import { editProfileStyles as s } from "./styles";

interface PreferencePickersProps {
  control: Control<EditProfileFormValues>;
  cardBg: string;
  cardBorder: string;
  accent: string;
}

export function PreferencePickers({
  control,
  cardBg,
  cardBorder,
  accent,
}: PreferencePickersProps) {
  const c = useColors();
  const { t } = useTranslation();

  return (
    <>
      <SectionLabel
        text={t("profile.edit.languageLabel", "Preferred Language")}
      />
      <Controller
        control={control}
        name="preferred_language"
        render={({ field: { onChange, value } }) => (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.chipScroll}
          >
            <View style={s.chipRow}>
              {LANGUAGE_OPTION_KEYS.map((key) => {
                const selected = value === key;
                const label =
                  key === "en"
                    ? t("profile.edit.languagePrefEn", "English")
                    : key === "nl"
                      ? t("profile.edit.languagePrefNl", "Dutch")
                      : t("profile.edit.languagePrefBoth", "Both / Beide");
                return (
                  <Pressable
                    key={key}
                    onPress={() => onChange(key)}
                    style={[
                      s.chip,
                      {
                        backgroundColor: selected ? accent : cardBg,
                        borderColor: selected ? accent : cardBorder,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={t(
                      "profile.edit.a11y.languageOption",
                      "Preferred language: {{label}}",
                      { label },
                    )}
                  >
                    <Text
                      style={[
                        s.chipText,
                        { color: selected ? "#152018" : c.text.secondary },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}
      />

      <SectionLabel text={t("profile.edit.radiusLabel", "Search Radius")} />
      <Controller
        control={control}
        name="preferred_radius"
        render={({ field: { onChange, value } }) => (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.chipScroll}
          >
            <View style={s.chipRow}>
              {RADIUS_VALUES.map((radiusValue) => {
                const selected = value === radiusValue;
                const km = radiusValue / 1000;
                const label = t("browse.distanceKm", "{{count}} km", {
                  count: km,
                });
                return (
                  <Pressable
                    key={radiusValue}
                    onPress={() => onChange(radiusValue)}
                    style={[
                      s.chip,
                      {
                        backgroundColor: selected ? accent : cardBg,
                        borderColor: selected ? accent : cardBorder,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={t(
                      "profile.edit.a11y.radiusOption",
                      "Search radius: {{distance}}",
                      { distance: label },
                    )}
                  >
                    <Text
                      style={[
                        s.chipText,
                        { color: selected ? "#152018" : c.text.secondary },
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}
      />
    </>
  );
}
