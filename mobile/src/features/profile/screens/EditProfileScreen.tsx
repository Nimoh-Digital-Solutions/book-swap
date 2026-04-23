import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { AxiosError } from 'axios';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Camera,
  Save,
  ChevronRight,
} from 'lucide-react-native';

import { useAuthStore } from '@/stores/authStore';
import { Avatar } from '@/components/Avatar';
import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/theme';
import { useUpdateProfile } from '@/features/profile/hooks/useProfile';
import { GenrePickerSheet } from '@/features/profile/components/GenrePickerSheet';
import { GENRE_VALUE_TO_I18N_KEY, type GenreValue } from '@/features/books/constants';
import type { ProfileStackParamList } from '@/navigation/types';

// ── Schema ───────────────────────────────────────────────────────────

function createProfileEditSchema(t: TFunction) {
  return z.object({
    first_name: z
      .string()
      .min(1, t('profile.edit.validation.firstNameRequired', 'First name is required'))
      .max(50),
    last_name: z
      .string()
      .min(1, t('profile.edit.validation.lastNameRequired', 'Last name is required'))
      .max(50),
    bio: z.string().max(300, t('profile.edit.validation.bioMax', 'Bio must be 300 characters or fewer')),
    preferred_genres: z
      .array(z.string())
      .max(5, t('profile.edit.validation.genresMax', 'You can select up to 5 genres')),
    preferred_language: z.enum(['en', 'nl', 'both']),
    preferred_radius: z.number().min(500).max(50_000),
  });
}

type FormValues = z.infer<ReturnType<typeof createProfileEditSchema>>;

// ── Constants ────────────────────────────────────────────────────────

const LANGUAGE_OPTION_KEYS = ['en', 'nl', 'both'] as const satisfies readonly FormValues['preferred_language'][];

const RADIUS_VALUES = [1000, 2000, 5000, 10000, 25000, 50000] as const;

// ── Component ────────────────────────────────────────────────────────

export function EditProfileScreen() {
  const { t } = useTranslation();
  const profileEditSchema = useMemo(() => createProfileEditSchema(t), [t]);
  const c = useColors();
  const isDark = useIsDark();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>>();
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const inputBg = isDark ? c.auth.card : c.surface.white;
  const inputBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;

  // Avatar local state (not part of RHF — handled via mutation payload)
  const [avatarLocal, setAvatarLocal] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  // Genre picker sheet visibility
  const [genreSheetOpen, setGenreSheetOpen] = useState(false);

  // Form setup
  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(profileEditSchema),
    mode: 'onTouched',
    defaultValues: {
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      bio: user?.bio ?? '',
      preferred_genres: user?.preferred_genres ?? [],
      preferred_language: (user?.preferred_language as 'en' | 'nl' | 'both') ?? 'en',
      preferred_radius: user?.preferred_radius ?? 5000,
    },
  });

  const bioValue = watch('bio') ?? '';
  const genresValue = watch('preferred_genres') ?? [];

  const displayAvatar = avatarRemoved
    ? null
    : avatarLocal?.uri ?? user?.avatar ?? null;
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || '';

  const hasChanges = isDirty || !!avatarLocal || avatarRemoved;

  // ── Avatar picker ──────────────────────────────────────────────────

  const pickAvatar = useCallback(() => {
    Alert.alert(
      t('profile.edit.avatarTitle', 'Change Photo'),
      undefined,
      [
        {
          text: t('profile.edit.takePhoto', 'Take Photo'),
          onPress: async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
              Alert.alert(
                t('common.permissionDenied', 'Permission Denied'),
                t('profile.edit.cameraPermMsg', 'Camera access is needed to take a photo.'),
              );
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              setAvatarLocal({
                uri: asset.uri,
                type: asset.mimeType ?? 'image/jpeg',
                name: asset.fileName ?? 'avatar.jpg',
              });
              setAvatarRemoved(false);
            }
          },
        },
        {
          text: t('profile.edit.chooseGallery', 'Choose from Gallery'),
          onPress: async () => {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
              Alert.alert(
                t('common.permissionDenied', 'Permission Denied'),
                t('profile.edit.galleryPermMsg', 'Gallery access is needed to choose a photo.'),
              );
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              setAvatarLocal({
                uri: asset.uri,
                type: asset.mimeType ?? 'image/jpeg',
                name: asset.fileName ?? 'avatar.jpg',
              });
              setAvatarRemoved(false);
            }
          },
        },
        ...(displayAvatar
          ? [
              {
                text: t('profile.edit.removePhoto', 'Remove Photo'),
                style: 'destructive' as const,
                onPress: () => {
                  setAvatarLocal(null);
                  setAvatarRemoved(true);
                },
              },
            ]
          : []),
        { text: t('common.cancel', 'Cancel'), style: 'cancel' as const },
      ],
    );
  }, [displayAvatar, t]);

  // ── Submit ─────────────────────────────────────────────────────────

  const onSubmit = useCallback(
    (values: FormValues) => {
      const payload: Parameters<typeof updateProfile.mutate>[0] = {
        first_name: values.first_name,
        last_name: values.last_name,
        bio: values.bio,
        preferred_genres: values.preferred_genres,
        preferred_language: values.preferred_language,
        preferred_radius: values.preferred_radius,
      };

      if (avatarLocal) {
        payload.avatar = avatarLocal;
      } else if (avatarRemoved) {
        payload.avatar_removed = true;
      }

      updateProfile.mutate(payload, {
        onSuccess: () => {
          Alert.alert(
            t('profile.edit.successTitle', 'Profile Updated'),
            t('profile.edit.successMsg', 'Your profile has been saved.'),
            [{ text: t('common.ok', 'OK'), onPress: () => navigation.goBack() }],
          );
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<Record<string, string | string[]>>;
          const fieldErrors = axiosErr.response?.data;
          if (fieldErrors && typeof fieldErrors === 'object') {
            const fieldKeys: (keyof FormValues)[] = [
              'first_name', 'last_name', 'bio',
              'preferred_genres', 'preferred_language', 'preferred_radius',
            ];
            let mapped = false;
            for (const key of fieldKeys) {
              const msg = fieldErrors[key];
              if (msg) {
                setError(key, { message: Array.isArray(msg) ? msg[0] : String(msg) });
                mapped = true;
              }
            }
            if (mapped) return;
          }
          Alert.alert(
            t('common.error', 'Error'),
            t('profile.edit.errorMsg', 'Failed to update profile. Please try again.'),
          );
        },
      });
    },
    [avatarLocal, avatarRemoved, updateProfile, navigation, t],
  );

  if (!user) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Avatar ── */}
        <Pressable
          onPress={pickAvatar}
          style={s.avatarSection}
          accessibilityRole="button"
          accessibilityLabel={t('profile.edit.a11y.changePhoto', 'Change profile photo')}
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
            <View style={[s.avatarBadge, { backgroundColor: accent, borderColor: bg }]}>
              <Camera size={14} color="#152018" strokeWidth={2.5} />
            </View>
          </View>
          <Text style={[s.avatarHint, { color: c.text.secondary }]}>
            {t('profile.edit.changePhoto', 'Tap to change photo')}
          </Text>
        </Pressable>

        {/* ── Username (display + availability check) ── */}
        <SectionLabel
          text={t('profile.edit.usernameLabel', 'Username')}
          c={c}
        />
        <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder, opacity: 0.6 }]}>
          <Text style={[s.atPrefix, { color: c.text.secondary }]}>@</Text>
          <TextInput
            style={[s.inputFlex, { color: c.text.secondary }]}
            value={user?.username ?? ''}
            editable={false}
            selectTextOnFocus={false}
            accessibilityLabel={t('profile.edit.a11y.username', 'Username')}
          />
        </View>
        <Text style={[s.hintText, { color: c.text.subtle }]}>
          {t('profile.edit.usernameHint', 'Username changes are not yet supported.')}
        </Text>

        {/* ── First Name ── */}
        <SectionLabel
          text={t('profile.edit.firstNameLabel', 'First Name')}
          required
          c={c}
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
              accessibilityLabel={t('profile.edit.a11y.firstName', 'First name')}
            />
          )}
        />
        {errors.first_name && (
          <Text style={[s.errorText, { color: c.status.error }]}>
            {errors.first_name.message}
          </Text>
        )}

        {/* ── Last Name ── */}
        <SectionLabel
          text={t('profile.edit.lastNameLabel', 'Last Name')}
          required
          c={c}
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
              accessibilityLabel={t('profile.edit.a11y.lastName', 'Last name')}
            />
          )}
        />
        {errors.last_name && (
          <Text style={[s.errorText, { color: c.status.error }]}>
            {errors.last_name.message}
          </Text>
        )}

        {/* ── Bio ── */}
        <SectionLabel
          text={`${t('profile.edit.bioLabel', 'Bio')} (${bioValue.length}/300)`}
          c={c}
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
              placeholder={t('profile.edit.bioPlaceholder', 'Tell others about your reading interests…')}
              placeholderTextColor={c.text.placeholder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={300}
              accessibilityLabel={t('profile.edit.a11y.bio', 'Bio')}
            />
          )}
        />
        {errors.bio && (
          <Text style={[s.errorText, { color: c.status.error }]}>
            {errors.bio.message}
          </Text>
        )}

        {/* ── Genres ── */}
        <SectionLabel
          text={`${t('profile.edit.genresLabel', 'Preferred Genres')} (${genresValue.length}/5)`}
          c={c}
        />
        <Controller
          control={control}
          name="preferred_genres"
          render={({ field: { onChange, value } }) => (
            <>
              <Pressable
                onPress={() => setGenreSheetOpen(true)}
                style={[
                  s.pickerBtn,
                  {
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('profile.edit.a11y.selectGenres', 'Select preferred genres')}
              >
                <Text
                  style={[
                    s.pickerBtnText,
                    {
                      color: value && value.length > 0
                        ? c.text.primary
                        : c.text.placeholder,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {value && value.length > 0
                    ? value
                        .map((g) => {
                          const slug = GENRE_VALUE_TO_I18N_KEY[g as GenreValue];
                          return slug
                            ? t(`books.genres.${slug}`, g)
                            : g;
                        })
                        .join(', ')
                    : t('profile.edit.selectGenres', 'Select genres…')}
                </Text>
                <ChevronRight size={18} color={c.text.placeholder} />
              </Pressable>

              {/* Selected genre chips */}
              {value && value.length > 0 && (
                <View style={s.genreChipRow}>
                  {value.map((g) => (
                    <View
                      key={g}
                      style={[s.genreChip, { backgroundColor: accent + '18', borderColor: accent }]}
                    >
                      <Text style={[s.genreChipText, { color: isDark ? accent : '#152018' }]}>
                        {GENRE_VALUE_TO_I18N_KEY[g as GenreValue]
                          ? t(`books.genres.${GENRE_VALUE_TO_I18N_KEY[g as GenreValue]}`, g)
                          : g}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              <GenrePickerSheet
                value={value ?? []}
                onChange={onChange}
                open={genreSheetOpen}
                onClose={() => setGenreSheetOpen(false)}
              />
            </>
          )}
        />

        {/* ── Preferred Language ── */}
        <SectionLabel
          text={t('profile.edit.languageLabel', 'Preferred Language')}
          c={c}
        />
        <Controller
          control={control}
          name="preferred_language"
          render={({ field: { onChange, value } }) => (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.chipScroll}
            >
              <View style={s.chipRow}>
                {LANGUAGE_OPTION_KEYS.map((key) => {
                  const selected = value === key;
                  const label =
                    key === 'en'
                      ? t('profile.edit.languagePrefEn', 'English')
                      : key === 'nl'
                        ? t('profile.edit.languagePrefNl', 'Dutch')
                        : t('profile.edit.languagePrefBoth', 'Both / Beide');
                  return (
                    <Pressable
                      key={key}
                      onPress={() => onChange(key)}
                      style={[
                        s.chip,
                        {
                          backgroundColor: selected ? accent : cardBg,
                          borderColor: selected ? accent : cardBorder,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={t('profile.edit.a11y.languageOption', 'Preferred language: {{label}}', {
                        label,
                      })}
                    >
                      <Text
                        style={[
                          s.chipText,
                          { color: selected ? '#152018' : c.text.secondary },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}
        />

        {/* ── Preferred Radius ── */}
        <SectionLabel
          text={t('profile.edit.radiusLabel', 'Search Radius')}
          c={c}
        />
        <Controller
          control={control}
          name="preferred_radius"
          render={({ field: { onChange, value } }) => (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.chipScroll}
            >
              <View style={s.chipRow}>
                {RADIUS_VALUES.map((radiusValue) => {
                  const selected = value === radiusValue;
                  const km = radiusValue / 1000;
                  const label = t('browse.distanceKm', '{{count}} km', { count: km });
                  return (
                    <Pressable
                      key={radiusValue}
                      onPress={() => onChange(radiusValue)}
                      style={[
                        s.chip,
                        {
                          backgroundColor: selected ? accent : cardBg,
                          borderColor: selected ? accent : cardBorder,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={t('profile.edit.a11y.radiusOption', 'Search radius: {{distance}}', {
                        distance: label,
                      })}
                    >
                      <Text
                        style={[
                          s.chipText,
                          { color: selected ? '#152018' : c.text.secondary },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          )}
        />

        {/* ── Submit ── */}
        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={!hasChanges || updateProfile.isPending}
          style={({ pressed }) => [
            s.submitBtn,
            {
              backgroundColor: accent,
              opacity: !hasChanges ? 0.5 : pressed ? 0.9 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            updateProfile.isPending
              ? t('profile.edit.a11y.saving', 'Saving profile changes')
              : t('profile.edit.a11y.save', 'Save profile changes')
          }
        >
          {updateProfile.isPending ? (
            <ActivityIndicator size="small" color="#152018" />
          ) : (
            <Save size={18} color="#152018" />
          )}
          <Text style={s.submitBtnText}>
            {updateProfile.isPending
              ? t('profile.edit.saving', 'Saving…')
              : t('profile.edit.save', 'Save Changes')}
          </Text>
        </Pressable>

        {updateProfile.isError && (
          <Text style={[s.errorBanner, { color: c.status.error }]}>
            {t('profile.edit.errorMsg', 'Failed to update profile. Please try again.')}
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Shared sub-component ─────────────────────────────────────────────

function SectionLabel({
  text,
  required,
  c,
}: {
  text: string;
  required?: boolean;
  c: ReturnType<typeof useColors>;
}) {
  return (
    <View style={s.labelRow}>
      <Text style={[s.label, { color: c.text.primary }]}>{text}</Text>
      {required && <Text style={[s.required, { color: c.auth.golden }]}>*</Text>}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────

const s = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 20,
  },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatarWrap: { position: 'relative' },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  avatarHint: { fontSize: 13, fontWeight: '500', marginTop: spacing.sm },

  // Labels
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md + 4,
    marginBottom: spacing.xs,
  },
  label: { fontSize: 14, fontWeight: '600' },
  required: { fontSize: 14, fontWeight: '700' },

  // Inputs
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multiline: {
    minHeight: 80,
    paddingTop: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
  },
  inputFlex: { flex: 1, fontSize: 15, paddingVertical: 12 },
  atPrefix: { fontSize: 15, fontWeight: '600', marginRight: 2 },

  // Errors / hints
  errorText: { fontSize: 12, marginTop: 4 },
  hintText: { fontSize: 12, marginTop: 4 },
  errorBanner: { fontSize: 14, textAlign: 'center', marginTop: spacing.md },

  // Picker button (genres)
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  pickerBtnText: { flex: 1, fontSize: 15 },

  // Genre chips
  genreChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  genreChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  genreChipText: { fontSize: 12, fontWeight: '600' },

  // Chip selectors (language, radius)
  chipScroll: { marginTop: 4 },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '600' },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: radius.xl,
    marginTop: spacing.xl + 8,
  },
  submitBtnText: { color: '#152018', fontWeight: '700', fontSize: 16 },
});
