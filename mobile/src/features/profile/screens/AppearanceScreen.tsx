import { Check, Moon, Smartphone, Sun } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showSuccessToast } from "@/components/Toast";
import { radius, spacing } from "@/constants/theme";
import { useColors, useIsDark } from "@/hooks/useColors";
import { useThemeStore, type AppearanceMode } from "@/stores/themeStore";

const OPTIONS: {
  mode: AppearanceMode;
  icon: typeof Sun;
  labelKey: string;
  descKey: string;
}[] = [
  {
    mode: "system",
    icon: Smartphone,
    labelKey: "appearance.system",
    descKey: "appearance.systemDesc",
  },
  {
    mode: "light",
    icon: Sun,
    labelKey: "appearance.light",
    descKey: "appearance.lightDesc",
  },
  {
    mode: "dark",
    icon: Moon,
    labelKey: "appearance.dark",
    descKey: "appearance.darkDesc",
  },
];

export function AppearanceScreen() {
  const c = useColors();
  const isDark = useIsDark();
  const { t } = useTranslation();
  const accent = c.auth.golden;
  const currentMode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const handleSelect = (mode: AppearanceMode) => {
    if (mode === currentMode) return;
    setMode(mode);
    showSuccessToast(t("appearance.saved", "Appearance updated"));
  };

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const divider = isDark ? c.auth.cardBorder + "50" : c.neutral[100];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={["bottom"]}>
      <View style={s.scroll}>
        <View style={[s.iconWrap, { backgroundColor: accent + "14" }]}>
          <Sun size={28} color={accent} />
        </View>
        <Text style={[s.heading, { color: c.text.primary }]}>
          {t("appearance.title", "Appearance")}
        </Text>
        <Text style={[s.subtitle, { color: c.text.secondary }]}>
          {t("appearance.subtitle", "Choose how the app looks on your device.")}
        </Text>

        <View
          style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
        >
          <Text style={[s.sectionLabel, { color: c.text.secondary }]}>
            {t("appearance.themeLabel", "THEME")}
          </Text>
          {OPTIONS.map((opt, idx) => {
            const selected = opt.mode === currentMode;
            const Icon = opt.icon;
            return (
              <React.Fragment key={opt.mode}>
                {idx > 0 && (
                  <View style={[s.divider, { backgroundColor: divider }]} />
                )}
                <Pressable
                  onPress={() => handleSelect(opt.mode)}
                  style={({ pressed }) => [
                    s.row,
                    pressed && {
                      backgroundColor: isDark
                        ? c.auth.cardBorder + "20"
                        : c.neutral[50],
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <View style={s.rowLeft}>
                    <View
                      style={[
                        s.optionIcon,
                        {
                          backgroundColor: isDark
                            ? c.auth.golden + "14"
                            : c.neutral[50],
                        },
                      ]}
                    >
                      <Icon
                        size={22}
                        color={selected ? accent : c.text.secondary}
                      />
                    </View>
                    <View style={s.rowTextWrap}>
                      <Text
                        style={[
                          s.rowLabel,
                          { color: selected ? accent : c.text.primary },
                          selected && { fontWeight: "700" },
                        ]}
                      >
                        {t(opt.labelKey)}
                      </Text>
                      <Text style={[s.rowDesc, { color: c.text.secondary }]}>
                        {t(opt.descKey)}
                      </Text>
                    </View>
                  </View>
                  {selected ? (
                    <View style={[s.checkCircle, { backgroundColor: accent }]}>
                      <Check size={16} color="#152018" />
                    </View>
                  ) : (
                    <View
                      style={[
                        s.uncheckCircle,
                        {
                          borderColor: isDark
                            ? c.auth.cardBorder
                            : c.neutral[200],
                        },
                      ]}
                    />
                  )}
                </Pressable>
              </React.Fragment>
            );
          })}
        </View>

        <Text style={[s.infoText, { color: c.text.subtle }]}>
          {t(
            "appearance.info",
            "System mode automatically switches between light and dark based on your device settings.",
          )}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.md + 4,
    paddingTop: spacing.lg,
    paddingBottom: 20,
  },

  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },

  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: spacing.md + 4,
    opacity: 0.8,
  },
  divider: { height: 1, marginVertical: spacing.xs },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTextWrap: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: "600" },
  rowDesc: { fontSize: 12, marginTop: 2 },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  uncheckCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },

  infoText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
});
