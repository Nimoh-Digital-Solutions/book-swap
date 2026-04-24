import React from "react";
import { Text, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import { useColors } from "@/hooks/useColors";
import type { User } from "@/types";

import { settingsStyles as s } from "./styles";

interface SettingsHeroProps {
  user: User;
}

export function SettingsHero({ user }: SettingsHeroProps) {
  const c = useColors();
  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username;

  return (
    <View style={s.hero}>
      <Avatar
        uri={user.avatar}
        name={fullName}
        size={72}
        borderColor={c.auth.golden}
      />
      <View style={s.heroInfo}>
        <Text style={[s.heroName, { color: c.text.primary }]}>{fullName}</Text>
        <Text
          style={[s.heroSubtitle, { color: c.text.secondary }]}
          numberOfLines={1}
        >
          {user.email}
        </Text>
      </View>
    </View>
  );
}
