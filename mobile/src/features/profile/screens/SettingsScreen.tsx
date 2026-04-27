import React, { useCallback, useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useBiometric } from "@/hooks/useBiometric";
import { useColors, useIsDark } from "@/hooks/useColors";
import { isOptedOut, optIn, optOut } from "@/lib/analytics";
import { tokenStorage } from "@/lib/storage";
import { markBiometricAuthCompleted } from "@/services/BiometricGate";
import { useAuthStore } from "@/stores/authStore";

import { useLogout } from "@/features/auth/hooks/useLogout";

import {
  AccountSection,
  GeneralSection,
  LocationSection,
  ManualLocationSheet,
  PrivacySection,
  SecuritySection,
  SettingsFooter,
  SettingsHero,
  settingsStyles as s,
} from "../components/settings";
import { DeleteAccountSheet } from "../components/DeleteAccountSheet";
import { useDataExport } from "../hooks/useDataExport";
import { useLocationManager } from "../hooks/useLocationManager";
import { useProfileVisibility } from "../hooks/useProfileVisibility";
import { useSearchRadius } from "../hooks/useSearchRadius";

export function SettingsScreen() {
  const c = useColors();
  const isDark = useIsDark();
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const { isBiometricAvailable, authenticate } = useBiometric();

  const [biometricEnabled, setBiometricEnabled] = useState(
    tokenStorage.getBiometricEnabled(),
  );
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
  const [analyticsOptedOut, setAnalyticsOptedOut] = useState(isOptedOut());
  const [manualSheetVisible, setManualSheetVisible] = useState(false);

  const dataExport = useDataExport();
  const visibility = useProfileVisibility();
  const radius = useSearchRadius();
  const locationManager = useLocationManager();

  const toggleBiometric = useCallback(
    async (val: boolean) => {
      if (val) {
        const result = await authenticate();
        if (!result.success) return;
        markBiometricAuthCompleted();
      }
      tokenStorage.setBiometricEnabled(val);
      setBiometricEnabled(val);
    },
    [authenticate],
  );

  const toggleAnalytics = useCallback((val: boolean) => {
    if (val) {
      optOut();
      setAnalyticsOptedOut(true);
    } else {
      optIn();
      setAnalyticsOptedOut(false);
    }
  }, []);

  if (!user) return null;

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorderColor = isDark ? c.auth.cardBorder : c.border.default;
  const iconCircleBg = isDark ? c.auth.golden + "14" : c.neutral[50];
  const dividerColor = isDark ? c.auth.cardBorder + "50" : c.neutral[100];

  const cardStyle = [
    s.card,
    { backgroundColor: cardBg },
    { borderWidth: 1, borderColor: cardBorderColor },
  ];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <SettingsHero user={user} />

        <AccountSection cardStyle={cardStyle} dividerColor={dividerColor} />

        <PrivacySection
          cardStyle={cardStyle}
          dividerColor={dividerColor}
          iconCircleBg={iconCircleBg}
          profilePublic={visibility.profilePublic}
          profilePublicPending={visibility.isPending}
          onToggleProfilePublic={visibility.toggle}
          analyticsOptedOut={analyticsOptedOut}
          onToggleAnalytics={toggleAnalytics}
        />

        <LocationSection
          user={user}
          cardStyle={cardStyle}
          dividerColor={dividerColor}
          iconCircleBg={iconCircleBg}
          gpsUpdating={locationManager.gpsUpdating}
          onUpdateGps={locationManager.updateFromGps}
          onOpenManual={() => setManualSheetVisible(true)}
          currentRadius={radius.currentRadius}
          radiusUpdating={radius.isPending}
          onUpdateRadius={radius.update}
        />

        <SecuritySection
          user={user}
          cardStyle={cardStyle}
          dividerColor={dividerColor}
          iconCircleBg={iconCircleBg}
          isBiometricAvailable={isBiometricAvailable}
          biometricEnabled={biometricEnabled}
          onToggleBiometric={toggleBiometric}
        />

        <GeneralSection cardStyle={cardStyle} dividerColor={dividerColor} />

        <SettingsFooter
          onLogout={() => logout.mutate()}
          onExport={dataExport.exportData}
          exportPending={dataExport.isPending}
          onDelete={() => setDeleteSheetVisible(true)}
        />
      </ScrollView>

      <DeleteAccountSheet
        visible={deleteSheetVisible}
        onClose={() => setDeleteSheetVisible(false)}
      />

      <ManualLocationSheet
        visible={manualSheetVisible}
        onClose={() => setManualSheetVisible(false)}
        onSubmit={locationManager.updateFromPostcode}
        onUseGps={locationManager.updateFromGps}
      />
    </SafeAreaView>
  );
}
