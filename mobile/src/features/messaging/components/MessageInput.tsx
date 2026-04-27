import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';
import { ImagePlus, Send, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';

const MAX_CHARS = 2000;
const IMAGE_MAX_MB = 5;

interface Props {
  onSend: (content: string, imageUri?: string) => void;
  onTyping: () => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onTyping, disabled = false }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const accent = c.auth.golden;
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  const canSend = (text.trim().length > 0 || !!imageUri) && !disabled;
  const inputBg = isDark ? c.auth.card : c.neutral[100];
  const borderColor = isDark ? c.auth.cardBorder : c.border.default;

  const handleChange = useCallback(
    (val: string) => {
      if (val.length <= MAX_CHARS) {
        setText(val);
        onTyping();
      }
    },
    [onTyping],
  );

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && !imageUri) return;
    onSend(trimmed, imageUri ?? undefined);
    setText('');
    setImageUri(null);
  }, [text, imageUri, onSend]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > IMAGE_MAX_MB * 1024 * 1024) return;
      setImageUri(asset.uri);
    }
  }, []);

  return (
    <View
      style={[
        s.container,
        {
          borderTopColor: borderColor,
          backgroundColor: isDark ? c.auth.bg : c.neutral[50],
          paddingBottom: Math.max(insets.bottom, spacing.sm + 4),
        },
      ]}
    >
      {imageUri && (
        <View style={s.previewRow}>
          <View style={s.previewWrap}>
            <ExpoImage source={{ uri: imageUri }} style={s.previewImg} contentFit="cover" />
            <Pressable
              onPress={() => setImageUri(null)}
              style={s.previewClose}
              accessibilityLabel={t('common.remove', 'Remove')}
              hitSlop={8}
            >
              <X size={12} color="#fff" />
            </Pressable>
          </View>
        </View>
      )}

      <View style={s.inputRow}>
        <Pressable
          onPress={pickImage}
          disabled={disabled}
          style={({ pressed }) => [s.attachBtn, pressed && { opacity: 0.6 }]}
          accessibilityLabel={t('messaging.attachImage', 'Attach image')}
          accessibilityRole="button"
          hitSlop={8}
        >
          <ImagePlus size={22} color={c.text.secondary} />
        </Pressable>

        <TextInput
          style={[
            s.input,
            {
              backgroundColor: inputBg,
              color: c.text.primary,
            },
          ]}
          value={text}
          onChangeText={handleChange}
          placeholder={t('messaging.placeholder', 'Type a message...')}
          placeholderTextColor={c.text.placeholder}
          multiline
          maxLength={MAX_CHARS}
          returnKeyType="send"
          submitBehavior="submit"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          editable={!disabled}
        />
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          style={[
            s.sendBtn,
            { backgroundColor: canSend ? accent : (isDark ? c.auth.card : c.neutral[200]) },
            !canSend && s.sendBtnDisabled,
          ]}
          accessibilityLabel={t('messaging.send', 'Send')}
          accessibilityRole="button"
          hitSlop={8}
        >
          {disabled ? (
            <ActivityIndicator size="small" color="#152018" />
          ) : (
            <Send size={20} color={canSend ? '#152018' : c.text.placeholder} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  previewRow: {
    marginBottom: spacing.xs,
  },
  previewWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImg: {
    width: 64,
    height: 64,
  },
  previewClose: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  attachBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: radius.lg + 6,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : spacing.xs + 2,
    fontSize: 15,
    lineHeight: 21,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
