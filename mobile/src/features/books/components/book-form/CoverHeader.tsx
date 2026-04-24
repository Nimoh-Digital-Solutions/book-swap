import { Image } from "expo-image";
import React from "react";
import { Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

import { bookFormStyles as s } from "./styles";

interface CoverHeaderProps {
  coverUrl?: string | null;
  isbn?: string | null;
  cardBg: string;
  cardBorder: string;
}

export function CoverHeader({
  coverUrl,
  isbn,
  cardBg,
  cardBorder,
}: CoverHeaderProps) {
  const c = useColors();

  return (
    <>
      {coverUrl ? (
        <View
          style={[
            s.coverWrap,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <Image
            source={{ uri: coverUrl }}
            style={s.cover}
            contentFit="cover"
            transition={200}
          />
        </View>
      ) : null}

      {isbn ? (
        <View
          style={[
            s.isbnBadge,
            { backgroundColor: cardBg, borderColor: cardBorder },
          ]}
        >
          <Text style={[s.isbnText, { color: c.text.secondary }]}>
            ISBN {isbn}
          </Text>
        </View>
      ) : null}
    </>
  );
}
