import { useNavigation } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as Location from "expo-location";
import {
  Bell,
  ChevronRight,
  Download,
  Fingerprint,
  Globe,
  Info,
  Lock,
  LogOut,
  MapPin,
  Navigation,
  Radar,
  ShieldOff,
  Sun,
  Trash2,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Avatar } from "@/components/Avatar";
import { API } from "@/configs/apiEndpoints";
import { radius, spacing } from "@/constants/theme";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { useBiometric } from "@/hooks/useBiometric";
import { useColors, useIsDark } from "@/hooks/useColors";
import { tokenStorage } from "@/lib/storage";
import { markBiometricAuthCompleted } from "@/services/BiometricGate";
import { http } from "@/services/http";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import type { User } from "@/types";
import { DeleteAccountSheet } from "../components/DeleteAccountSheet";
import { useDataExport } from "../hooks/useDataExport";

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function SettingsRow({ icon, title, subtitle, onPress }: SettingsRowProps) {
  const c = useColors();
  const isDark = useIsDark();
  return (
    <Pressable
      style={({ pressed }) => [
        s.row,
        pressed && {
          backgroundColor: isDark ? c.auth.cardBorder + "20" : c.neutral[50],
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
    >
      <View style={s.rowLeft}>
        <View
          style={[
            s.iconCircle,
            { backgroundColor: isDark ? c.auth.golden + "14" : c.neutral[50] },
          ]}
        >
          {icon}
        </View>
        <View style={s.rowTextWrap}>
          <Text style={[s.rowTitle, { color: c.text.primary }]}>{title}</Text>
          <Text style={[s.rowSubtitle, { color: c.text.secondary }]}>
            {subtitle}
          </Text>
        </View>
      </View>
      <ChevronRight size={20} color={c.text.placeholder} />
    </Pressable>
  );
}

export function SettingsScreen() {
  const c = useColors();
  const isDark = useIsDark();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { isBiometricAvailable, authenticate } = useBiometric();

  const [biometricEnabled, setBiometricEnabled] = useState(
    tokenStorage.getBiometricEnabled(),
  );
  const [deleteSheetVisible, setDeleteSheetVisible] = useState(false);
  const dataExport = useDataExport();

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

  const setUser = useAuthStore((s) => s.setUser);
  const appearanceMode = useThemeStore((s) => s.mode);

  const RADIUS_OPTIONS = [
    { value: 1000, label: "1 km" },
    { value: 2000, label: "2 km" },
    { value: 5000, label: "5 km" },
    { value: 10000, label: "10 km" },
    { value: 25000, label: "25 km" },
    { value: 50000, label: "50 km" },
  ];

  const currentRadius = user?.preferred_radius ?? 5000;

  const updateRadius = useMutation({
    mutationFn: async (newRadius: number) => {
      const { data } = await http.patch<User>(API.users.me, {
        preferred_radius: newRadius,
      });
      return data;
    },
    onSuccess: (data) => {
      setUser(data);
    },
    onError: () => {
      Alert.alert(
        t("common.error", "Error"),
        t("settings.radiusError", "Failed to update search radius."),
      );
    },
  });

  const [locationUpdating, setLocationUpdating] = useState(false);

  const updateLocation = useCallback(async () => {
    setLocationUpdating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("settings.locationDenied", "Location access denied"),
          t(
            "settings.locationDeniedMsg",
            "Please enable location access in your device settings.",
          ),
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { data } = await http.post<User>(API.users.meLocation, {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      await setUser(data);
      Alert.alert(
        t("settings.locationUpdated", "Location updated"),
        data.neighborhood
          ? t("settings.locationUpdatedMsg", "Set to {{neighborhood}}", {
              neighborhood: data.neighborhood,
            })
          : t(
              "settings.locationUpdatedGeneric",
              "Your location has been updated.",
            ),
      );
    } catch {
      Alert.alert(
        t("common.error", "Error"),
        t("settings.locationError", "Failed to update location."),
      );
    } finally {
      setLocationUpdating(false);
    }
  }, [setUser, t]);

  const fullName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      user.username
    : "";

  const currentLang = i18n.language?.startsWith("fr")
    ? "Français"
    : i18n.language?.startsWith("nl")
      ? "Nederlands"
      : "English";

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorderColor = isDark ? c.auth.cardBorder : c.border.default;
  const cardBorder = { borderWidth: 1, borderColor: cardBorderColor };
  const iconCircleBg = isDark ? c.auth.golden + "14" : c.neutral[50];
  const dividerColor = isDark ? c.auth.cardBorder + "50" : c.neutral[100];

  if (!user) return null;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={s.hero}>
          <Avatar
            uri={user.avatar}
            name={fullName}
            size={72}
            borderColor={c.auth.golden}
          />
          <View style={s.heroInfo}>
            <Text style={[s.heroName, { color: c.text.primary }]}>
              {fullName}
            </Text>
            <Text
              style={[s.heroSubtitle, { color: c.text.secondary }]}
              numberOfLines={1}
            >
              {user.email}
            </Text>
          </View>
        </View>

        {/* ── Account ── */}
        <Text style={[s.sectionHeading, { color: c.text.secondary }]}>
          {t("settings.account", "Account")}
        </Text>
        <View style={[s.card, { backgroundColor: cardBg }, cardBorder]}>
          <SettingsRow
            icon={
              <Bell
                size={20}
                color={isDark ? c.auth.golden : c.text.secondary}
              />
            }
            title={t("settings.notifications", "Notifications")}
            subtitle={t(
              "settings.notificationsSubtitle",
              "Swap alerts and messages",
            )}
            onPress={() => navigation.navigate("NotificationPreferences")}
          />
          <View style={[s.divider, { backgroundColor: dividerColor }]} />
          <SettingsRow
            icon={
              <ShieldOff
                size={20}
                color={isDark ? c.auth.golden : c.text.secondary}
              />
            }
            title={t("settings.blockedUsers", "Blocked Users")}
            subtitle={t(
              "settings.blockedUsersSubtitle",
              "Manage blocked accounts",
            )}
            onPress={() => navigation.navigate("BlockedUsers")}
          />
        </View>

        {/* ── Location & Search ── */}
        <Text style={[s.sectionHeading, { color: c.text.secondary }]}>
          {t("settings.locationSearch", "Location & Search")}
        </Text>
        <View style={[s.card, { backgroundColor: cardBg }, cardBorder]}>
          {/* Current location */}
          <View style={s.locationRow}>
            <View style={s.rowLeft}>
              <View style={[s.iconCircle, { backgroundColor: iconCircleBg }]}>
                <MapPin
                  size={20}
                  color={isDark ? c.auth.golden : c.text.secondary}
                />
              </View>
              <View style={s.rowTextWrap}>
                <Text style={[s.rowTitle, { color: c.text.primary }]}>
                  {t("settings.currentLocation", "Current location")}
                </Text>
                <Text style={[s.rowSubtitle, { color: c.text.secondary }]}>
                  {user.neighborhood || t("settings.noLocation", "Not set")}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={updateLocation}
              disabled={locationUpdating}
              style={({ pressed }) => [
                s.locationBtn,
                {
                  backgroundColor: isDark ? c.auth.card : c.neutral[50],
                  borderColor: isDark ? c.auth.cardBorder : c.border.default,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              {locationUpdating ? (
                <ActivityIndicator size="small" color={c.auth.golden} />
              ) : (
                <Navigation size={14} color={c.auth.golden} />
              )}
              <Text style={[s.locationBtnText, { color: c.text.primary }]}>
                {t("settings.update", "Update")}
              </Text>
            </Pressable>
          </View>

          <View style={[s.divider, { backgroundColor: dividerColor }]} />

          {/* Search radius */}
          <View style={s.radiusSection}>
            <View style={s.rowLeft}>
              <View style={[s.iconCircle, { backgroundColor: iconCircleBg }]}>
                <Radar
                  size={20}
                  color={isDark ? c.auth.golden : c.text.secondary}
                />
              </View>
              <View style={s.rowTextWrap}>
                <Text style={[s.rowTitle, { color: c.text.primary }]}>
                  {t("settings.searchRadius", "Search radius")}
                </Text>
                <Text style={[s.rowSubtitle, { color: c.text.secondary }]}>
                  {t("settings.searchRadiusSub", "{{km}} km", {
                    km: currentRadius / 1000,
                  })}
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.radiusScroll}
              contentContainerStyle={s.radiusChips}
            >
              {RADIUS_OPTIONS.map((opt) => {
                const selected = currentRadius === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => updateRadius.mutate(opt.value)}
                    disabled={updateRadius.isPending}
                    style={[
                      s.radiusChip,
                      {
                        backgroundColor: selected
                          ? c.auth.golden
                          : isDark
                            ? c.auth.card
                            : c.neutral[50],
                        borderColor: selected
                          ? c.auth.golden
                          : isDark
                            ? c.auth.cardBorder
                            : c.border.default,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.radiusChipText,
                        { color: selected ? "#152018" : c.text.secondary },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* ── Security ── */}
        <Text style={[s.sectionHeading, { color: c.text.secondary }]}>
          {t("settings.security", "Security")}
        </Text>
        <View style={[s.card, { backgroundColor: cardBg }, cardBorder]}>
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
                  onValueChange={toggleBiometric}
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

        {/* ── General ── */}
        <Text style={[s.sectionHeading, { color: c.text.secondary }]}>
          {t("settings.general", "General")}
        </Text>
        <View style={[s.card, { backgroundColor: cardBg }, cardBorder]}>
          <SettingsRow
            icon={
              <Sun
                size={20}
                color={isDark ? c.auth.golden : c.text.secondary}
              />
            }
            title={t("settings.appearance", "Appearance")}
            subtitle={t(
              `settings.appearance.${appearanceMode}`,
              appearanceMode.charAt(0).toUpperCase() + appearanceMode.slice(1),
            )}
            onPress={() => navigation.navigate("Appearance")}
          />
          <View style={[s.divider, { backgroundColor: dividerColor }]} />
          <SettingsRow
            icon={
              <Globe
                size={20}
                color={isDark ? c.auth.golden : c.text.secondary}
              />
            }
            title={t("settings.language", "Language")}
            subtitle={currentLang}
            onPress={() => navigation.navigate("Language")}
          />
          <View style={[s.divider, { backgroundColor: dividerColor }]} />
          <SettingsRow
            icon={
              <Info
                size={20}
                color={isDark ? c.auth.golden : c.text.secondary}
              />
            }
            title={t("settings.about", "About")}
            subtitle={`v${Constants.expoConfig?.version ?? "1.0.0"}`}
            onPress={() => navigation.navigate("About")}
          />
        </View>

        {/* ── Logout ── */}
        <Pressable
          style={({ pressed }) => [
            s.logoutBtn,
            {
              backgroundColor: isDark ? c.auth.card : c.neutral[100],
              borderWidth: 1,
              borderColor: isDark ? c.status.error + "40" : c.neutral[200],
            },
            pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
          ]}
          onPress={() => logout.mutate()}
          accessibilityRole="button"
          accessibilityLabel={t("settings.logout", "Log out")}
        >
          <LogOut size={20} color={c.status.error} />
          <Text style={[s.logoutText, { color: c.status.error }]}>
            {t("settings.logout", "Log out")}
          </Text>
        </Pressable>

        {/* ── Data Export & Delete Account ── */}
        <View style={s.bottomLinks}>
          <Pressable
            style={({ pressed }) => [s.bottomLink, pressed && { opacity: 0.6 }]}
            onPress={dataExport.exportData}
            disabled={dataExport.isPending}
            accessibilityRole="button"
            accessibilityLabel={t("dataExport.button")}
          >
            {dataExport.isPending ? (
              <ActivityIndicator size={13} color={c.text.subtle} />
            ) : (
              <Download size={13} color={c.text.subtle} />
            )}
            <Text style={[s.bottomLinkText, { color: c.text.subtle }]}>
              {dataExport.isPending
                ? t("dataExport.loading")
                : t("dataExport.button")}
            </Text>
          </Pressable>

          <View style={[s.bottomDot, { backgroundColor: c.neutral[300] }]} />

          <Pressable
            style={({ pressed }) => [s.bottomLink, pressed && { opacity: 0.6 }]}
            onPress={() => setDeleteSheetVisible(true)}
            accessibilityRole="button"
          >
            <Trash2 size={13} color={c.text.subtle} />
            <Text style={[s.bottomLinkText, { color: c.text.subtle }]}>
              {t("settings.deleteAccount", "Delete account")}
            </Text>
          </Pressable>
        </View>

        {/* ── Footer ── */}
        <Text style={[s.footer, { color: c.neutral[400] }]}>BookSwap</Text>
      </ScrollView>

      <DeleteAccountSheet
        visible={deleteSheetVisible}
        onClose={() => setDeleteSheetVisible(false)}
      />
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

  // Hero
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md + 4,
    paddingVertical: spacing.lg,
  },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 22, fontWeight: "800", letterSpacing: -0.4 },
  heroSubtitle: { fontSize: 14, fontWeight: "500", marginTop: 2 },

  // Section heading
  sectionHeading: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    paddingLeft: 4,
  },

  // Card
  card: {
    borderRadius: radius.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 20,
    elevation: 1,
  },
  divider: { height: 1, marginHorizontal: spacing.md },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.md + 2,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.md + 2,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTextWrap: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowSubtitle: { fontSize: 12, marginTop: 2 },

  // Location & radius
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.md + 2,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  locationBtnText: { fontSize: 12, fontWeight: "600" },
  radiusSection: {
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.md + 2,
  },
  radiusScroll: { marginTop: spacing.sm + 2 },
  radiusChips: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: 2,
  },
  radiusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  radiusChipText: { fontSize: 13, fontWeight: "600" },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm + 2,
    marginTop: spacing.xl + 8,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.xl,
  },
  logoutText: { fontSize: 16, fontWeight: "700" },

  // Bottom links row
  bottomLinks: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  bottomLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: spacing.sm,
  },
  bottomLinkText: { fontSize: 13, textDecorationLine: "underline" },
  bottomDot: { width: 3, height: 3, borderRadius: 1.5 },

  // Footer
  footer: {
    textAlign: "center",
    marginTop: spacing.xl,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
