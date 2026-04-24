import React from "react";
import { useTranslation } from "react-i18next";
import { Text, TextInput } from "react-native";
import { Controller, type Control, type FieldErrors } from "react-hook-form";

import { useColors } from "@/hooks/useColors";

import { SectionLabel } from "./SectionLabel";
import type { EditProfileFormValues } from "./schema";
import { editProfileStyles as s } from "./styles";

interface BasicInfoFieldsProps {
  control: Control<EditProfileFormValues>;
  errors: FieldErrors<EditProfileFormValues>;
  bioValue: string;
  inputBg: string;
  inputBorder: string;
}

export function BasicInfoFields({
  control,
  errors,
  bioValue,
  inputBg,
  inputBorder,
}: BasicInfoFieldsProps) {
  const c = useColors();
  const { t } = useTranslation();

  return (
    <>
      <SectionLabel
        text={t("profile.edit.firstNameLabel", "First Name")}
        required
      />
      <Controller
        control={control}
        name="first_name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[
              s.input,
              {
                backgroundColor: inputBg,
                borderColor: errors.first_name ? c.status.error : inputBorder,
                color: c.text.primary,
              },
            ]}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholderTextColor={c.text.placeholder}
            accessibilityLabel={t("profile.edit.a11y.firstName", "First name")}
          />
        )}
      />
      {errors.first_name && (
        <Text style={[s.errorText, { color: c.status.error }]}>
          {errors.first_name.message}
        </Text>
      )}

      <SectionLabel
        text={t("profile.edit.lastNameLabel", "Last Name")}
        required
      />
      <Controller
        control={control}
        name="last_name"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[
              s.input,
              {
                backgroundColor: inputBg,
                borderColor: errors.last_name ? c.status.error : inputBorder,
                color: c.text.primary,
              },
            ]}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholderTextColor={c.text.placeholder}
            accessibilityLabel={t("profile.edit.a11y.lastName", "Last name")}
          />
        )}
      />
      {errors.last_name && (
        <Text style={[s.errorText, { color: c.status.error }]}>
          {errors.last_name.message}
        </Text>
      )}

      <SectionLabel
        text={`${t("profile.edit.bioLabel", "Bio")} (${bioValue.length}/300)`}
      />
      <Controller
        control={control}
        name="bio"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[
              s.input,
              s.multiline,
              {
                backgroundColor: inputBg,
                borderColor: errors.bio ? c.status.error : inputBorder,
                color: c.text.primary,
              },
            ]}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={t(
              "profile.edit.bioPlaceholder",
              "Tell others about your reading interests…",
            )}
            placeholderTextColor={c.text.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={300}
            accessibilityLabel={t("profile.edit.a11y.bio", "Bio")}
          />
        )}
      />
      {errors.bio && (
        <Text style={[s.errorText, { color: c.status.error }]}>
          {errors.bio.message}
        </Text>
      )}
    </>
  );
}
