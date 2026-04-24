import React from "react";
import { useTranslation } from "react-i18next";
import { Text, TextInput, View } from "react-native";

import { useColors } from "@/hooks/useColors";

import { SectionLabel } from "./SectionLabel";
import { editProfileStyles as s } from "./styles";

interface UsernameFieldProps {
  username: string;
  inputBg: string;
  inputBorder: string;
}

export function UsernameField({
  username,
  inputBg,
  inputBorder,
}: UsernameFieldProps) {
  const c = useColors();
  const { t } = useTranslation();

  return (
    <>
      <SectionLabel text={t("profile.edit.usernameLabel", "Username")} />
      <View
        style={[
          s.inputWrap,
          {
            backgroundColor: inputBg,
            borderColor: inputBorder,
            opacity: 0.6,
          },
        ]}
      >
        <Text style={[s.atPrefix, { color: c.text.secondary }]}>@</Text>
        <TextInput
          style={[s.inputFlex, { color: c.text.secondary }]}
          value={username}
          editable={false}
          selectTextOnFocus={false}
          accessibilityLabel={t("profile.edit.a11y.username", "Username")}
        />
      </View>
      <Text style={[s.hintText, { color: c.text.subtle }]}>
        {t(
          "profile.edit.usernameHint",
          "Username changes are not yet supported.",
        )}
      </Text>
    </>
  );
}
