import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Fingerprint, Lock } from "lucide-react-native";
import React from "react";
import { Switch, Text, View, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";

import { useColors, useIsDark } from "@/hooks/useColors";
import type { ProfileStackParamList } from "@/navigation/types";
import type { User } from "@/types";

import { SettingsRow } from "./SettingsRow";
import { settingsStyles as s } from "./styles";

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

interface SecuritySectionProps {
  user: User;
  cardStyle: ViewStyle | ViewStyle[];
  dividerColor: string;
  iconCircleBg: string;
  isBiometricAvailable: boolean;
  biometricEnabled: boolean;
  onToggleBiometric: (val: boolean) => void;
}

export function SecuritySection({
  user,
  cardStyle,
  dividerColor,
  iconCircleBg,
  isBiometricAvailable,
  biometricEnabled,
  onToggleBiometric,
}: SecuritySectionProps) {
  const c = useColors();
  const isDark = useIsDark();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  return (
    <>
      <Text style={[s.sectionHeading, { color: c.text.secondary }]}>
        {t("settings.security", "Security")}
      </Text>
      <View style={cardStyle}>
        {isBiometricAvailable && (
          <>
            <View style={s.switchRow}>
              <View style={s.rowLeft}>
                <View
                  style={[s.iconCircle, { backgroundColor: iconCircleBg }]}
                >
                  <Fingerprint
                    size={20}
                    color={isDark ? c.auth.golden : c.text.secondary}
                  />
                </View>
                <View style={s.rowTextWrap}>
                  <Text style={[s.rowTitle, { color: c.text.primary }]}>
                    {t("settings.biometric", "Face ID / Fingerprint")}
                  </Text>
                  <Text style={[s.rowSubtitle, { color: c.text.secondary }]}>
                    {t(
                      "settings.biometricSubtitle",
                      "Quick unlock when returning",
                    )}
                  </Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={onToggleBiometric}
                trackColor={{
                  true: c.auth.golden,
                  false: isDark ? c.auth.cardBorder : c.neutral[200],
                }}
                thumbColor="#fff"
              />
            </View>
            <View style={[s.divider, { backgroundColor: dividerColor }]} />
          </>
        )}
        {user.auth_provider === "email" ? (
          <SettingsRow
            icon={
              <Lock
                size={20}
                color={isDark ? c.auth.golden : c.text.secondary}
              />
            }
            title={t("changePassword.row", "Change Password")}
            subtitle={t(
              "changePassword.rowSubtitle",
              "Update your account password",
            )}
            onPress={() => navigation.navigate("ChangePassword")}
          />
        ) : (
          <View style={s.row}>
            <View style={s.rowLeft}>
              <View style={[s.iconCircle, { backgroundColor: iconCircleBg }]}>
                <Lock size={20} color={c.text.placeholder} />
              </View>
              <View style={s.rowTextWrap}>
                <Text style={[s.rowTitle, { color: c.text.placeholder }]}>
                  {t("changePassword.row", "Change Password")}
                </Text>
                <Text style={[s.rowSubtitle, { color: c.text.placeholder }]}>
                  {t(
                    "changePassword.socialHint",
                    "Use forgot password to set one first",
                  )}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </>
  );
}
