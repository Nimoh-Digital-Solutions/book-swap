import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AxiosError } from "axios";
import React, { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
} from "react-native";

import { useColors, useIsDark } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";

import { useUpdateProfile } from "@/features/profile/hooks/useProfile";
import type { ProfileStackParamList } from "@/navigation/types";

import {
  AvatarPickerSection,
  BasicInfoFields,
  GenresField,
  PROFILE_FORM_FIELDS,
  PreferencePickers,
  SubmitButton,
  UsernameField,
  createProfileEditSchema,
  editProfileStyles as s,
  type EditProfileFormValues,
} from "../components/edit-profile";
import { useAvatarPicker } from "../hooks/useAvatarPicker";

export function EditProfileScreen() {
  const { t } = useTranslation();
  const profileEditSchema = useMemo(
    () => createProfileEditSchema(t),
    [t],
  );
  const c = useColors();
  const isDark = useIsDark();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<ProfileStackParamList, "EditProfile">
    >();
  const user = useAuthStore((state) => state.user);
  const updateProfile = useUpdateProfile();

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const inputBg = isDark ? c.auth.card : c.surface.white;
  const inputBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  const { avatarLocal, avatarRemoved, promptPick } = useAvatarPicker();

  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isDirty },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(profileEditSchema),
    mode: "onTouched",
    defaultValues: {
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      bio: user?.bio ?? "",
      preferred_genres: user?.preferred_genres ?? [],
      preferred_language:
        (user?.preferred_language as "en" | "nl" | "both") ?? "en",
      preferred_radius: user?.preferred_radius ?? 5000,
    },
  });

  const bioValue = watch("bio") ?? "";
  const genresValue = watch("preferred_genres") ?? [];

  const displayAvatar = avatarRemoved
    ? null
    : (avatarLocal?.uri ?? user?.avatar ?? null);
  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.username ||
    "";

  const hasChanges = isDirty || !!avatarLocal || avatarRemoved;

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasChanges) return;
      e.preventDefault();
      Alert.alert(
        t('profile.edit.unsavedTitle', 'Discard changes?'),
        t('profile.edit.unsavedMsg', 'You have unsaved changes. Are you sure you want to leave?'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('common.discard', 'Discard'),
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ],
      );
    });
    return unsubscribe;
  }, [navigation, hasChanges, t]);

  const onSubmit = useCallback(
    (values: EditProfileFormValues) => {
      const payload: Parameters<typeof updateProfile.mutate>[0] = {
        first_name: values.first_name,
        last_name: values.last_name,
        bio: values.bio,
        preferred_genres: values.preferred_genres,
        preferred_language: values.preferred_language,
        preferred_radius: values.preferred_radius,
      };

      if (avatarLocal) {
        payload.avatar = avatarLocal;
      } else if (avatarRemoved) {
        payload.avatar_removed = true;
      }

      updateProfile.mutate(payload, {
        onSuccess: () => {
          Alert.alert(
            t("profile.edit.successTitle", "Profile Updated"),
            t("profile.edit.successMsg", "Your profile has been saved."),
            [
              {
                text: t("common.ok", "OK"),
                onPress: () => navigation.goBack(),
              },
            ],
          );
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<
            Record<string, string | string[]>
          >;
          const fieldErrors = axiosErr.response?.data;
          if (fieldErrors && typeof fieldErrors === "object") {
            let mapped = false;
            for (const key of PROFILE_FORM_FIELDS) {
              const msg = fieldErrors[key];
              if (msg) {
                setError(key, {
                  message: Array.isArray(msg) ? msg[0] : String(msg),
                });
                mapped = true;
              }
            }
            if (mapped) return;
          }
          Alert.alert(
            t("common.error", "Error"),
            t(
              "profile.edit.errorMsg",
              "Failed to update profile. Please try again.",
            ),
          );
        },
      });
    },
    [avatarLocal, avatarRemoved, updateProfile, navigation, t, setError],
  );

  if (!user) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AvatarPickerSection
          displayAvatar={displayAvatar}
          fullName={fullName}
          bg={bg}
          accent={accent}
          onPress={() => promptPick(!!displayAvatar)}
        />

        <UsernameField
          username={user.username ?? ""}
          inputBg={inputBg}
          inputBorder={inputBorder}
        />

        <BasicInfoFields
          control={control}
          errors={errors}
          bioValue={bioValue}
          inputBg={inputBg}
          inputBorder={inputBorder}
        />

        <GenresField
          control={control}
          count={genresValue.length}
          cardBg={cardBg}
          cardBorder={cardBorder}
          accent={accent}
        />

        <PreferencePickers
          control={control}
          cardBg={cardBg}
          cardBorder={cardBorder}
          accent={accent}
        />

        <SubmitButton
          hasChanges={hasChanges}
          isPending={updateProfile.isPending}
          onPress={handleSubmit(onSubmit)}
          accent={accent}
        />

        {updateProfile.isError && (
          <Text style={[s.errorBanner, { color: c.status.error }]}>
            {t(
              "profile.edit.errorMsg",
              "Failed to update profile. Please try again.",
            )}
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
