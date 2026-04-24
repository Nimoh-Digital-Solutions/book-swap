import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

export interface PickedAvatar {
  uri: string;
  type: string;
  name: string;
}

export function useAvatarPicker() {
  const { t } = useTranslation();
  const [avatarLocal, setAvatarLocal] = useState<PickedAvatar | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  const setFromAsset = useCallback((asset: ImagePicker.ImagePickerAsset) => {
    setAvatarLocal({
      uri: asset.uri,
      type: asset.mimeType ?? "image/jpeg",
      name: asset.fileName ?? "avatar.jpg",
    });
    setAvatarRemoved(false);
  }, []);

  const promptPick = useCallback(
    (hasExistingAvatar: boolean) => {
      Alert.alert(
        t("profile.edit.avatarTitle", "Change Photo"),
        undefined,
        [
          {
            text: t("profile.edit.takePhoto", "Take Photo"),
            onPress: async () => {
              const perm = await ImagePicker.requestCameraPermissionsAsync();
              if (!perm.granted) {
                Alert.alert(
                  t("common.permissionDenied", "Permission Denied"),
                  t(
                    "profile.edit.cameraPermMsg",
                    "Camera access is needed to take a photo.",
                  ),
                );
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) {
                setFromAsset(result.assets[0]);
              }
            },
          },
          {
            text: t("profile.edit.chooseGallery", "Choose from Gallery"),
            onPress: async () => {
              const perm =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!perm.granted) {
                Alert.alert(
                  t("common.permissionDenied", "Permission Denied"),
                  t(
                    "profile.edit.galleryPermMsg",
                    "Gallery access is needed to choose a photo.",
                  ),
                );
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) {
                setFromAsset(result.assets[0]);
              }
            },
          },
          ...(hasExistingAvatar
            ? [
                {
                  text: t("profile.edit.removePhoto", "Remove Photo"),
                  style: "destructive" as const,
                  onPress: () => {
                    setAvatarLocal(null);
                    setAvatarRemoved(true);
                  },
                },
              ]
            : []),
          { text: t("common.cancel", "Cancel"), style: "cancel" as const },
        ],
      );
    },
    [setFromAsset, t],
  );

  return {
    avatarLocal,
    avatarRemoved,
    promptPick,
  };
}
