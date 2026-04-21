import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock } from "lucide-react-native";
import React, { useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { showErrorToast, showSuccessToast } from "@/components/Toast";
import { radius, spacing } from "@/constants/theme";
import { useColors, useIsDark } from "@/hooks/useColors";
import { useChangePassword } from "../hooks/useChangePassword";
import { useLogout } from "../hooks/useLogout";

type FormValues = {
  old_password: string;
  new_password1: string;
  new_password2: string;
};

export function ChangePasswordScreen() {
  const c = useColors();
  const isDark = useIsDark();
  const { t } = useTranslation();
  const accent = c.auth.golden;
  const changePassword = useChangePassword();
  const logout = useLogout();

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const newPasswordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const schema = useMemo(
    () =>
      z
        .object({
          old_password: z
            .string()
            .min(1, t("changePassword.oldPasswordRequired", "Current password is required")),
          new_password1: z
            .string()
            .min(8, t("changePassword.newPasswordMin", "New password must be at least 8 characters")),
          new_password2: z
            .string()
            .min(1, t("changePassword.confirmNewRequired", "Please confirm your new password")),
        })
        .refine((d) => d.new_password1 === d.new_password2, {
          message: t("changePassword.passwordsMismatch", "Passwords do not match"),
          path: ["new_password2"],
        }),
    [t],
  );

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const inputBg = isDark ? c.auth.card : c.neutral[50];

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { old_password: "", new_password1: "", new_password2: "" },
  });

  const onSubmit = handleSubmit((data) => {
    changePassword.mutate(data, {
      onSuccess: () => {
        showSuccessToast(
          t("changePassword.success", "Password changed successfully!"),
        );
        logout.mutate();
      },
      onError: (err: any) => {
        const detail =
          err?.response?.data?.old_password?.[0] ??
          err?.response?.data?.new_password1?.[0] ??
          err?.response?.data?.new_password2?.[0] ??
          err?.response?.data?.detail ??
          t(
            "changePassword.error",
            "Failed to change password. Check your current password and try again.",
          );
        showErrorToast(String(detail));
      },
    });
  });

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.flex}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[s.iconWrap, { backgroundColor: accent + "14" }]}>
            <Lock size={28} color={accent} />
          </View>
          <Text style={[s.heading, { color: c.text.primary }]}>
            {t("changePassword.title", "Change Password")}
          </Text>
          <Text style={[s.subtitle, { color: c.text.secondary }]}>
            {t(
              "changePassword.subtitle",
              "You'll be logged out after changing your password.",
            )}
          </Text>

          <View
            style={[
              s.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <Text style={[s.sectionLabel, { color: c.text.secondary }]}>
              {t("changePassword.sectionLabel", "PASSWORD").toUpperCase()}
            </Text>
            <View style={s.fieldGroup}>
              {/* Current password */}
              <View>
                <Text style={[s.fieldLabel, { color: c.text.secondary }]}>
                  {t(
                    "changePassword.currentPassword",
                    "Current password",
                  ).toUpperCase()}
                </Text>
                <View style={s.passwordRow}>
                  <Controller
                    control={control}
                    name="old_password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[
                          s.input,
                          { backgroundColor: inputBg, color: c.text.primary },
                          isDark && { borderWidth: 1, borderColor: cardBorder },
                          s.passwordInput,
                          errors.old_password && {
                            borderWidth: 1,
                            borderColor: c.status.error,
                          },
                        ]}
                        placeholder={t(
                          "changePassword.currentPassword",
                          "Current password",
                        )}
                        placeholderTextColor={c.text.placeholder}
                        secureTextEntry={!showCurrent}
                        returnKeyType="next"
                        onSubmitEditing={() => newPasswordRef.current?.focus()}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        autoComplete="current-password"
                        accessibilityLabel={t(
                          "changePassword.currentPassword",
                          "Current password",
                        )}
                      />
                    )}
                  />
                  <Pressable
                    onPress={() => setShowCurrent(!showCurrent)}
                    style={s.eyeBtn}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showCurrent
                        ? t("changePassword.hidePassword", "Hide password")
                        : t("changePassword.showPassword", "Show password")
                    }
                  >
                    {showCurrent ? (
                      <EyeOff size={18} color={c.text.secondary} />
                    ) : (
                      <Eye size={18} color={c.text.secondary} />
                    )}
                  </Pressable>
                </View>
                {errors.old_password && (
                  <Text style={[s.errorText, { color: c.status.error }]}>
                    {errors.old_password.message}
                  </Text>
                )}
              </View>

              {/* New password */}
              <View>
                <Text style={[s.fieldLabel, { color: c.text.secondary }]}>
                  {t(
                    "changePassword.newPassword",
                    "New password",
                  ).toUpperCase()}
                </Text>
                <View style={s.passwordRow}>
                  <Controller
                    control={control}
                    name="new_password1"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        ref={newPasswordRef}
                        style={[
                          s.input,
                          { backgroundColor: inputBg, color: c.text.primary },
                          isDark && { borderWidth: 1, borderColor: cardBorder },
                          s.passwordInput,
                          errors.new_password1 && {
                            borderWidth: 1,
                            borderColor: c.status.error,
                          },
                        ]}
                        placeholder={t(
                          "changePassword.newPassword",
                          "New password",
                        )}
                        placeholderTextColor={c.text.placeholder}
                        secureTextEntry={!showNew}
                        returnKeyType="next"
                        onSubmitEditing={() => confirmRef.current?.focus()}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        autoComplete="new-password"
                        accessibilityLabel={t(
                          "changePassword.newPassword",
                          "New password",
                        )}
                      />
                    )}
                  />
                  <Pressable
                    onPress={() => setShowNew(!showNew)}
                    style={s.eyeBtn}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showNew
                        ? t("changePassword.hidePassword", "Hide password")
                        : t("changePassword.showPassword", "Show password")
                    }
                  >
                    {showNew ? (
                      <EyeOff size={18} color={c.text.secondary} />
                    ) : (
                      <Eye size={18} color={c.text.secondary} />
                    )}
                  </Pressable>
                </View>
                {errors.new_password1 && (
                  <Text style={[s.errorText, { color: c.status.error }]}>
                    {errors.new_password1.message}
                  </Text>
                )}
              </View>

              {/* Confirm new password */}
              <View>
                <Text style={[s.fieldLabel, { color: c.text.secondary }]}>
                  {t(
                    "changePassword.confirmPassword",
                    "Confirm new password",
                  ).toUpperCase()}
                </Text>
                <View style={s.passwordRow}>
                  <Controller
                    control={control}
                    name="new_password2"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        ref={confirmRef}
                        style={[
                          s.input,
                          { backgroundColor: inputBg, color: c.text.primary },
                          isDark && { borderWidth: 1, borderColor: cardBorder },
                          s.passwordInput,
                          errors.new_password2 && {
                            borderWidth: 1,
                            borderColor: c.status.error,
                          },
                        ]}
                        placeholder={t(
                          "changePassword.confirmPassword",
                          "Confirm new password",
                        )}
                        placeholderTextColor={c.text.placeholder}
                        secureTextEntry={!showConfirm}
                        returnKeyType="done"
                        onSubmitEditing={onSubmit}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value}
                        autoComplete="new-password"
                        accessibilityLabel={t(
                          "changePassword.confirmPassword",
                          "Confirm new password",
                        )}
                      />
                    )}
                  />
                  <Pressable
                    onPress={() => setShowConfirm(!showConfirm)}
                    style={s.eyeBtn}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showConfirm
                        ? t("changePassword.hidePassword", "Hide password")
                        : t("changePassword.showPassword", "Show password")
                    }
                  >
                    {showConfirm ? (
                      <EyeOff size={18} color={c.text.secondary} />
                    ) : (
                      <Eye size={18} color={c.text.secondary} />
                    )}
                  </Pressable>
                </View>
                {errors.new_password2 && (
                  <Text style={[s.errorText, { color: c.status.error }]}>
                    {errors.new_password2.message}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <Pressable
            onPress={onSubmit}
            disabled={changePassword.isPending}
            style={({ pressed }) => [
              s.submitBtn,
              { backgroundColor: accent },
              changePassword.isPending && s.submitBtnDisabled,
              pressed && s.submitBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t("changePassword.submit", "Change Password")}
          >
            {changePassword.isPending ? (
              <ActivityIndicator size="small" color="#152018" />
            ) : (
              <Text style={s.submitBtnText}>
                {t("changePassword.submit", "Change Password")}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
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
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: spacing.md + 4,
    opacity: 0.8,
  },
  fieldGroup: { gap: spacing.md + 4 },

  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    marginLeft: 2,
  },
  input: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    height: 52,
    fontWeight: "500",
  },
  passwordRow: { position: "relative" },
  passwordInput: { paddingRight: 52 },
  eyeBtn: {
    position: "absolute",
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    width: 36,
  },
  errorText: {
    fontSize: 12,
    marginTop: spacing.xs,
    marginLeft: 2,
  },

  submitBtn: {
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  submitBtnText: { color: "#152018", fontSize: 16, fontWeight: "700" },
});
