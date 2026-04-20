import Constants from "expo-constants";
import {
  ChevronRight,
  FileText,
  Heart,
  Info,
  Mail,
  Shield,
} from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { radius, spacing } from "@/constants/theme";
import { useColors, useIsDark } from "@/hooks/useColors";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const SUPPORT_EMAIL = "support@bookswap.app";
const PRIVACY_URL = "https://bookswap.app/en/privacy-policy";
const TERMS_URL = "https://bookswap.app/en/terms-of-service";

function LinkRow({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  onPress: () => void;
}) {
  const c = useColors();
  const isDark = useIsDark();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.row, pressed && { opacity: 0.7 }]}
      accessibilityRole="link"
    >
      <View style={s.rowLeft}>
        <View
          style={[
            s.rowIconCircle,
            { backgroundColor: isDark ? c.auth.golden + "14" : c.neutral[50] },
          ]}
        >
          {icon}
        </View>
        <View style={s.rowTextWrap}>
          <Text style={[s.rowLabel, { color: c.text.primary }]}>{label}</Text>
          <Text style={[s.rowSubtitle, { color: c.text.secondary }]}>
            {subtitle}
          </Text>
        </View>
      </View>
      <ChevronRight size={20} color={c.neutral[400]} />
    </Pressable>
  );
}

export function AboutScreen() {
  const c = useColors();
  const isDark = useIsDark();
  const { t } = useTranslation();
  const accent = c.auth.golden;

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const divider = isDark ? c.auth.cardBorder + "50" : c.neutral[100];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={["bottom"]}>
      <View style={s.scroll}>
        <View style={[s.iconWrap, { backgroundColor: accent + "14" }]}>
          <Info size={28} color={accent} />
        </View>
        <Text style={[s.heading, { color: c.text.primary }]}>BookSwap</Text>
        <Text style={[s.version, { color: c.text.secondary }]}>
          {t("about.version", "Version {{version}}", { version: APP_VERSION })}
        </Text>
        <Text style={[s.description, { color: c.text.secondary }]}>
          {t(
            "about.description",
            "Swap books with people in your neighbourhood. Discover new reads, meet fellow book lovers, and give your books a second life.",
          )}
        </Text>

        <View
          style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
        >
          <Text style={[s.sectionLabel, { color: c.text.secondary }]}>
            {t("about.resources", "RESOURCES")}
          </Text>
          <LinkRow
            icon={<Mail size={20} color={isDark ? accent : c.text.secondary} />}
            label={t("about.support", "Contact Support")}
            subtitle={SUPPORT_EMAIL}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          />
          <View style={[s.divider, { backgroundColor: divider }]} />
          <LinkRow
            icon={
              <Shield size={20} color={isDark ? accent : c.text.secondary} />
            }
            label={t("about.privacyPolicy", "Privacy Policy")}
            subtitle="bookswap.app/privacy-policy"
            onPress={() => Linking.openURL(PRIVACY_URL)}
          />
          <View style={[s.divider, { backgroundColor: divider }]} />
          <LinkRow
            icon={
              <FileText size={20} color={isDark ? accent : c.text.secondary} />
            }
            label={t("about.termsOfService", "Terms of Service")}
            subtitle="bookswap.app/terms-of-service"
            onPress={() => Linking.openURL(TERMS_URL)}
          />
        </View>

        <View style={s.footer}>
          <Heart size={14} color={c.status.error} />
          <Text style={[s.footerText, { color: c.text.subtle }]}>
            {t("about.madeWith", "Made with love for book lovers")}
          </Text>
        </View>
        <Text style={[s.footerBrand, { color: c.neutral[400] }]}>BookSwap</Text>
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
  version: {
    fontSize: 13,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
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
    paddingVertical: spacing.sm + 2,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  rowIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTextWrap: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: "600" },
  rowSubtitle: { fontSize: 12, marginTop: 2 },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.lg,
  },
  footerText: { fontSize: 13 },
  footerBrand: {
    textAlign: "center",
    marginTop: spacing.md,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
