import { Check, Globe } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { showSuccessToast } from "@/components/Toast";
import { radius, spacing } from "@/constants/theme";
import { useColors, useIsDark } from "@/hooks/useColors";
import { setLanguage } from "@/lib/i18n";

const LANGUAGES = [
  { code: "en", labelKey: "language.english", flag: "🇬🇧", native: "English" },
  { code: "fr", labelKey: "language.french", flag: "🇫🇷", native: "Français" },
  { code: "nl", labelKey: "language.dutch", flag: "🇳🇱", native: "Nederlands" },
] as const;

export function LanguageScreen() {
  const c = useColors();
  const isDark = useIsDark();
  const { t, i18n } = useTranslation();
  const accent = c.auth.golden;

  const currentLang = i18n.language?.startsWith("fr")
    ? "fr"
    : i18n.language?.startsWith("nl")
      ? "nl"
      : "en";

  const handleSelect = (code: string) => {
    if (code === currentLang) return;
    setLanguage(code);
    showSuccessToast(t("language.saved", "Language updated"));
  };

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const divider = isDark ? c.auth.cardBorder + "50" : c.neutral[100];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={["bottom"]}>
      <View style={s.scroll}>
        <View style={[s.iconWrap, { backgroundColor: accent + "14" }]}>
          <Globe size={28} color={accent} />
        </View>
        <Text style={[s.heading, { color: c.text.primary }]}>
          {t("language.title", "Language")}
        </Text>
        <Text style={[s.subtitle, { color: c.text.secondary }]}>
          {t(
            "language.subtitle",
            "Choose your preferred language for the app.",
          )}
        </Text>

        <View
          style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
        >
          <Text style={[s.sectionLabel, { color: c.text.secondary }]}>
            {t("language.sectionLabel", "LANGUAGE")}
          </Text>
          {LANGUAGES.map((lang, idx) => {
            const selected = lang.code === currentLang;
            return (
              <React.Fragment key={lang.code}>
                {idx > 0 && (
                  <View style={[s.divider, { backgroundColor: divider }]} />
                )}
                <Pressable
                  onPress={() => handleSelect(lang.code)}
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
                    <Text style={s.flag}>{lang.flag}</Text>
                    <View style={s.rowTextWrap}>
                      <Text
                        style={[
                          s.rowLabel,
                          { color: selected ? accent : c.text.primary },
                          selected && { fontWeight: "700" },
                        ]}
                      >
                        {t(lang.labelKey)}
                      </Text>
                      <Text style={[s.rowNative, { color: c.text.secondary }]}>
                        {lang.native}
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
            "language.info",
            "The app will update immediately. Some content may still appear in the original language.",
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
  flag: { fontSize: 28 },
  rowTextWrap: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: "600" },
  rowNative: { fontSize: 12, marginTop: 2 },
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
