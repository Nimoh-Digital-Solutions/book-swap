import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import DraggableFlatList, {
  type RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { Camera, X, GripVertical } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/theme';
import { showErrorToast } from '@/components/Toast';
import {
  useUploadBookPhoto,
  useDeleteBookPhoto,
  useReorderBookPhotos,
} from '@/features/books/hooks/useBooks';

const MAX_PHOTOS = 3;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

interface Photo {
  id: string;
  image: string;
  position: number;
}

interface BookPhotoManagerProps {
  bookId: string;
  photos: Photo[];
}

export function BookPhotoManager({ bookId, photos }: BookPhotoManagerProps) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const upload = useUploadBookPhoto(bookId);
  const remove = useDeleteBookPhoto(bookId);
  const reorder = useReorderBookPhotos(bookId);
  const isPickingRef = useRef(false);

  const accent = c.auth.golden;
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;

  const sorted = [...photos].sort((a, b) => a.position - b.position);

  const pickImage = useCallback(
    async (source: 'camera' | 'library') => {
      if (isPickingRef.current) return;
      isPickingRef.current = true;

      try {
        if (source === 'camera') {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) {
            Alert.alert(
              t('common.permissionDenied', 'Permission Denied'),
              t('books.photo.cameraPermission', 'Camera access is required to take photos.'),
            );
            return;
          }
        } else {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            Alert.alert(
              t('common.permissionDenied', 'Permission Denied'),
              t('books.photo.galleryPermission', 'Gallery access is required to select photos.'),
            );
            return;
          }
        }

        const launcher =
          source === 'camera'
            ? ImagePicker.launchCameraAsync
            : ImagePicker.launchImageLibraryAsync;

        const result = await launcher({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [3, 4],
          quality: 0.8,
        });

        if (result.canceled || !result.assets?.[0]) return;

        const asset = result.assets[0];

        if (asset.fileSize && asset.fileSize > MAX_SIZE_BYTES) {
          showErrorToast(
            t('books.photo.sizeError', 'Image must be smaller than 5 MB.'),
          );
          return;
        }

        upload.mutate(asset.uri);
      } finally {
        isPickingRef.current = false;
      }
    },
    [upload, t],
  );

  const showPicker = useCallback(() => {
    if (photos.length >= MAX_PHOTOS) {
      showErrorToast(
        t('books.photo.maxReached', 'Maximum {{max}} photos reached.', {
          max: MAX_PHOTOS,
        }),
      );
      return;
    }

    const options = [
      t('books.photo.takePhoto', 'Take Photo'),
      t('books.photo.chooseGallery', 'Choose from Gallery'),
      t('common.cancel', 'Cancel'),
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: 2 },
        (idx) => {
          if (idx === 0) pickImage('camera');
          else if (idx === 1) pickImage('library');
        },
      );
    } else {
      Alert.alert(
        t('books.photo.addPhoto', 'Add Photo'),
        undefined,
        [
          { text: options[0], onPress: () => pickImage('camera') },
          { text: options[1], onPress: () => pickImage('library') },
          { text: options[2], style: 'cancel' },
        ],
      );
    }
  }, [photos.length, pickImage, t]);

  const handleDelete = useCallback(
    (photoId: string) => {
      Alert.alert(
        t('books.photo.deleteTitle', 'Delete photo?'),
        t('books.photo.deleteMsg', 'This photo will be permanently removed.'),
        [
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
          {
            text: t('common.delete', 'Delete'),
            style: 'destructive',
            onPress: () => remove.mutate(photoId),
          },
        ],
      );
    },
    [remove, t],
  );

  const handleDragEnd = useCallback(
    ({ data }: { data: Photo[] }) => {
      const ids = data.map((p) => p.id);
      reorder.mutate(ids);
    },
    [reorder],
  );

  const renderItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<Photo>) => {
      const idx = getIndex() ?? 0;
      return (
        <ScaleDecorator>
          <Pressable
            onLongPress={drag}
            disabled={isActive}
            style={[
              s.photoItem,
              {
                backgroundColor: cardBg,
                borderColor: isActive ? accent : cardBorder,
                borderWidth: isActive ? 2 : 1,
              },
            ]}
          >
            <Image
              source={{ uri: item.image }}
              style={s.photoImage}
              contentFit="cover"
              transition={200}
            />
            {idx === 0 && (
              <View style={[s.coverBadge, { backgroundColor: accent }]}>
                <Text style={s.coverBadgeText}>
                  {t('books.photo.cover', 'Cover')}
                </Text>
              </View>
            )}
            <Pressable
              onPress={() => handleDelete(item.id)}
              style={s.deleteBtn}
              hitSlop={8}
            >
              <X size={14} color="#fff" />
            </Pressable>
            <View style={s.dragHandle}>
              <GripVertical size={16} color={c.text.placeholder} />
            </View>
          </Pressable>
        </ScaleDecorator>
      );
    },
    [accent, cardBg, cardBorder, c.text.placeholder, handleDelete, t],
  );

  return (
    <View style={s.container}>
      <Text style={[s.hint, { color: c.text.secondary }]}>
        {t(
          'books.photo.hint',
          'Add up to {{max}} photos. Long-press to drag and reorder. First photo is the cover.',
          { max: MAX_PHOTOS },
        )}
      </Text>

      <View style={s.listWrap}>
        <DraggableFlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onDragEnd={handleDragEnd}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.listContent}
        />

        {photos.length < MAX_PHOTOS && (
          <Pressable
            onPress={showPicker}
            disabled={upload.isPending}
            style={({ pressed }) => [
              s.addBtn,
              {
                borderColor: pressed ? accent : cardBorder,
                opacity: upload.isPending ? 0.5 : 1,
              },
            ]}
          >
            {upload.isPending ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <>
                <Camera size={22} color={c.text.placeholder} />
                <Text style={[s.addBtnText, { color: c.text.placeholder }]}>
                  {t('books.photo.addPhoto', 'Add Photo')}
                </Text>
              </>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const PHOTO_SIZE = 100;

const s = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  hint: {
    fontSize: 13,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  listWrap: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  listContent: {
    gap: spacing.sm,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.33,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  coverBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  coverBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#152018',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandle: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.33,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
