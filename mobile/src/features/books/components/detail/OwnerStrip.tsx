import { useNavigation } from "@react-navigation/native";
import { ChevronRight, MapPin, Repeat2 } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import { useColors } from "@/hooks/useColors";

import { bookDetailStyles as s } from "./styles";
import type { BookOwner } from "./types";

interface OwnerStripProps {
  owner: BookOwner;
  isOwnBook: boolean;
  cardBorderColor: string;
}

export function OwnerStrip({
  owner,
  isOwnBook,
  cardBorderColor,
}: OwnerStripProps) {
  const c = useColors();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const ownerName = owner.username ?? t("common.unknownUser", "Unknown");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isOwnBook
          ? t("books.listedByYouA11y", "Listed by you")
          : t("books.viewOwnerProfileA11y", "View {{name}}'s profile", {
              name: ownerName,
            })
      }
      accessibilityState={{ disabled: isOwnBook }}
      onPress={() => {
        if (!isOwnBook) navigation.navigate("UserProfile", { userId: owner.id });
      }}
      disabled={isOwnBook}
      style={({ pressed }) => [
        s.ownerStrip,
        { borderTopColor: cardBorderColor },
        !isOwnBook && pressed && { opacity: 0.7 },
      ]}
    >
      <Avatar uri={owner.avatar} name={ownerName} size={38} />
      <View style={s.ownerInfo}>
        <Text style={[s.ownerName, { color: c.text.primary }]}>{ownerName}</Text>
        <View style={s.ownerStatsRow}>
          {owner.neighborhood ? (
            <>
              <MapPin size={12} color={c.text.placeholder} />
              <Text style={[s.ownerStat, { color: c.text.secondary }]}>
                {owner.neighborhood}
              </Text>
              <Text style={[s.ownerDot, { color: c.text.placeholder }]}>·</Text>
            </>
          ) : null}
          <Repeat2 size={12} color={c.text.placeholder} />
          <Text style={[s.ownerStat, { color: c.text.secondary }]}>
            {t("books.rating", "{{rating}}★", {
              rating: owner.avg_rating ?? "0",
            })}
          </Text>
        </View>
      </View>
      {!isOwnBook && <ChevronRight size={18} color={c.text.placeholder} />}
    </Pressable>
  );
}
