import { Image } from "expo-image";
import { Camera } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import { useColors } from "@/hooks/useColors";

import { editProfileStyles as s } from "./styles";

interface AvatarPickerSectionProps {
  displayAvatar: string | null;
  fullName: string;
  bg: string;
  accent: string;
  onPress: () => void;
}

export function AvatarPickerSection({
  displayAvatar,
  fullName,
  bg,
  accent,
  onPress,
}: AvatarPickerSectionProps) {
  const c = useColors();
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      style={s.avatarSection}
      accessibilityRole="button"
      accessibilityLabel={t(
        "profile.edit.a11y.changePhoto",
        "Change profile photo",
      )}
    >
      <View style={s.avatarWrap}>
        {displayAvatar ? (
          <Image
            source={{ uri: displayAvatar }}
            style={[s.avatarImage, { borderColor: accent }]}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <Avatar uri={null} name={fullName} size={100} borderColor={accent} />
        )}
        <View
          style={[
            s.avatarBadge,
            { backgroundColor: accent, borderColor: bg },
          ]}
        >
          <Camera size={14} color="#152018" strokeWidth={2.5} />
        </View>
      </View>
      <Text style={[s.avatarHint, { color: c.text.secondary }]}>
        {t("profile.edit.changePhoto", "Tap to change photo")}
      </Text>
    </Pressable>
  );
}
