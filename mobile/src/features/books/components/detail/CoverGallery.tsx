import { Image } from "expo-image";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, FlatList, Pressable, Text, View } from "react-native";
import ImageViewing from "react-native-image-viewing";

import { spacing } from "@/constants/theme";

import { COVER_COLORS, bookDetailStyles as s } from "./styles";

interface CoverGalleryProps {
  bookId: string;
  title: string;
  author: string;
  photoUris: string[];
  isAvailable: boolean;
  cardBorderColor: string;
  accent: string;
}

export function CoverGallery({
  bookId,
  title,
  author,
  photoUris,
  isAvailable,
  cardBorderColor,
  accent,
}: CoverGalleryProps) {
  const { t } = useTranslation();
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const lightboxImages = photoUris.map((uri) => ({ uri }));

  const coverUri = photoUris[0] ?? null;
  const hasMultiplePhotos = photoUris.length > 1;
  const coverBg =
    COVER_COLORS[bookId.charCodeAt(0) % COVER_COLORS.length] ?? COVER_COLORS[0];

  if (hasMultiplePhotos) {
    return (
      <>
        <View style={[s.coverHero, { borderColor: cardBorderColor }]}>
          <FlatList
            data={photoUris}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x /
                  (Dimensions.get("window").width - spacing.sm * 2),
              );
              setActivePhotoIdx(idx);
            }}
            renderItem={({ item, index }) => (
              <Pressable
                onPress={() => {
                  setLightboxIndex(index);
                  setLightboxVisible(true);
                }}
                accessibilityRole="button"
                accessibilityLabel={t("books.tapToZoom", "Tap to zoom")}
              >
                <Image
                  source={{ uri: item }}
                  style={[
                    s.coverImage,
                    { width: Dimensions.get("window").width - spacing.sm * 2 },
                  ]}
                  contentFit="cover"
                  transition={200}
                />
              </Pressable>
            )}
          />
          {isAvailable && (
            <View style={[s.availBadge, { backgroundColor: accent }]}>
              <Text style={s.availBadgeText}>
                {t("books.status.available", "Available")}
              </Text>
            </View>
          )}
        </View>
        <View style={s.dotsRow}>
          {photoUris.map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                {
                  backgroundColor: i === activePhotoIdx ? accent : accent + "40",
                },
              ]}
            />
          ))}
        </View>
        <ImageViewing
          images={lightboxImages}
          imageIndex={lightboxIndex}
          visible={lightboxVisible}
          onRequestClose={() => setLightboxVisible(false)}
        />
      </>
    );
  }

  return (
    <>
    <View style={[s.coverHero, { borderColor: cardBorderColor }]}>
      {coverUri ? (
        <Pressable
          onPress={() => {
            setLightboxIndex(0);
            setLightboxVisible(true);
          }}
          accessibilityRole="button"
          accessibilityLabel={t("books.tapToZoom", "Tap to zoom")}
        >
          <Image
            source={{ uri: coverUri }}
            style={s.coverImage}
            contentFit="cover"
            transition={200}
            accessibilityRole="image"
            accessibilityLabel={t(
              "books.coverImageA11y",
              "{{title}} cover image",
              { title },
            )}
          />
        </Pressable>
      ) : (
        <View style={[s.coverPlaceholder, { backgroundColor: coverBg }]}>
          <Text style={s.coverTitle} numberOfLines={3}>
            {title}
          </Text>
          <Text style={s.coverAuthor}>{author}</Text>
        </View>
      )}
      {isAvailable && (
        <View style={[s.availBadge, { backgroundColor: accent }]}>
          <Text style={s.availBadgeText}>
            {t("books.status.available", "Available")}
          </Text>
        </View>
      )}
    </View>
    {coverUri && (
      <ImageViewing
        images={lightboxImages}
        imageIndex={lightboxIndex}
        visible={lightboxVisible}
        onRequestClose={() => setLightboxVisible(false)}
      />
    )}
    </>
  );
}
