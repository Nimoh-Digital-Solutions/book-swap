import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { MapPin, Navigation, Info, BookOpen } from 'lucide-react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useIsDark } from '@/hooks/useColors';
import { ANIMATION } from '@/constants/animation';
import { spacing, radius } from '@/constants/theme';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

export function OnboardingScreen() {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const setUser = useAuthStore((s) => s.setUser);

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const cardBg = isDark ? c.auth.card : c.surface.white;
  const cardBorder = isDark ? c.auth.cardBorder : c.border.default;
  const accent = c.auth.golden;
  const inputBg = isDark ? c.auth.card : c.surface.white;
  const inputBorder = isDark ? c.auth.cardBorder : c.border.default;

  const [postcode, setPostcode] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationSet, setLocationSet] = useState(false);
  const [neighborhood, setNeighborhood] = useState('');

  const isBusy = gpsLoading || submitLoading || skipLoading;

  const completeOnboarding = async () => {
    const { data } = await http.post<User>(API.users.meOnboardingComplete);
    await setUser(data);
  };

  const handleGps = async () => {
    setGpsLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('onboarding.locationDenied', 'Location Access Denied'),
          t(
            'onboarding.locationDeniedMsg',
            'Please enable location access in your device settings, or enter your postcode manually below.',
          ),
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { data } = await http.post<User>(API.users.meLocation, {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      await setUser(data);
      setLocationSet(true);
      setNeighborhood(data.neighborhood ?? '');
    } catch {
      setError(
        t(
          'onboarding.gpsError',
          'Could not detect your location. Try entering your postcode below.',
        ),
      );
    } finally {
      setGpsLoading(false);
    }
  };

  const handlePostcodeSubmit = async () => {
    if (!postcode.trim()) return;
    setSubmitLoading(true);
    setError(null);
    try {
      const { data } = await http.post<User>(API.users.meLocation, {
        postcode: postcode.trim(),
      });
      await setUser(data);
      setLocationSet(true);
      setNeighborhood(data.neighborhood ?? '');
    } catch {
      setError(
        t(
          'onboarding.postcodeError',
          'Could not find that location. Please check and try again.',
        ),
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleComplete = async () => {
    setSubmitLoading(true);
    setError(null);
    try {
      await completeOnboarding();
    } catch {
      setError(
        t('onboarding.completeError', 'Something went wrong. Please try again.'),
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSkip = async () => {
    setSkipLoading(true);
    setError(null);
    try {
      await completeOnboarding();
    } catch {
      setError(
        t('onboarding.skipError', 'Something went wrong. Please try again.'),
      );
    } finally {
      setSkipLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={s.root}
        contentContainerStyle={[s.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <Animated.View entering={FadeIn.duration(400)} style={[s.logoWrap, { backgroundColor: accent + '18' }]}>
          <BookOpen size={32} color={accent} />
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInUp.duration(300).delay(ANIMATION.stagger.normal)}>
          <Text style={[s.step, { color: c.text.placeholder }]}>
            {t('onboarding.step', { current: 2, total: 2 })}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.duration(300).delay(ANIMATION.stagger.normal * 2)}>
          <Text style={[s.title, { color: c.text.primary }]}>
            {t('onboarding.title', 'Welcome to BookSwap')}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInUp.duration(300).delay(ANIMATION.stagger.normal * 3)}>
          <Text style={[s.subtitle, { color: c.text.secondary }]}>
            {t(
              'onboarding.subtitle',
              'This helps us show you the closest available books for swapping.',
            )}
          </Text>
        </Animated.View>

        {locationSet ? (
          /* ── Location confirmed ── */
          <Animated.View entering={FadeIn.duration(300)} style={s.successSection}>
            <View
              style={[
                s.successCard,
                { backgroundColor: cardBg, borderColor: accent + '40' },
              ]}
            >
              <View style={[s.successIcon, { backgroundColor: accent + '18' }]}>
                <MapPin size={24} color={accent} />
              </View>
              <Text style={[s.successLabel, { color: c.text.secondary }]}>
                {t('onboarding.yourLocation', 'Your location')}
              </Text>
              <Text style={[s.successValue, { color: c.text.primary }]}>
                {neighborhood ||
                  t('onboarding.locationSet', 'Location set successfully')}
              </Text>
            </View>

            <Pressable
              onPress={handleComplete}
              disabled={isBusy}
              style={({ pressed }) => [
                s.primaryBtn,
                {
                  backgroundColor: accent,
                  opacity: isBusy ? 0.6 : pressed ? 0.9 : 1,
                },
              ]}
            >
              {submitLoading ? (
                <ActivityIndicator size="small" color="#152018" />
              ) : (
                <Text style={s.primaryBtnText}>
                  {t('onboarding.complete', 'Get Started')}
                </Text>
              )}
            </Pressable>
          </Animated.View>
        ) : (
          /* ── Location input ── */
          <Animated.View entering={FadeInUp.duration(300).delay(ANIMATION.stagger.normal * 4)}>
            {/* GPS button */}
            <Pressable
              onPress={handleGps}
              disabled={isBusy}
              style={({ pressed }) => [
                s.gpsBtn,
                {
                  backgroundColor: accent,
                  opacity: isBusy ? 0.6 : pressed ? 0.9 : 1,
                },
              ]}
            >
              {gpsLoading ? (
                <ActivityIndicator size="small" color="#152018" />
              ) : (
                <Navigation size={18} color="#152018" />
              )}
              <Text style={s.gpsBtnText}>
                {gpsLoading
                  ? t('onboarding.detectingLocation', 'Detecting location...')
                  : t('onboarding.useMyLocation', 'Use My Location')}
              </Text>
            </Pressable>

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={[s.dividerLine, { backgroundColor: cardBorder }]} />
              <Text style={[s.dividerText, { color: c.text.placeholder }]}>
                {t('common.or', 'or')}
              </Text>
              <View style={[s.dividerLine, { backgroundColor: cardBorder }]} />
            </View>

            {/* Postcode input */}
            <Text style={[s.inputLabel, { color: c.text.secondary }]}>
              {t(
                'onboarding.postcodeLabel',
                'City, Neighborhood, or Zip Code',
              )}
            </Text>
            <View
              style={[
                s.inputRow,
                { backgroundColor: inputBg, borderColor: inputBorder },
              ]}
            >
              <MapPin size={18} color={c.text.placeholder} />
              <TextInput
                style={[s.input, { color: c.text.primary }]}
                value={postcode}
                onChangeText={setPostcode}
                placeholder={t(
                  'onboarding.postcodePlaceholder',
                  'e.g. Amsterdam West, 1054',
                )}
                placeholderTextColor={c.text.placeholder}
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={handlePostcodeSubmit}
              />
            </View>

            <Pressable
              onPress={handlePostcodeSubmit}
              disabled={isBusy || !postcode.trim()}
              style={({ pressed }) => [
                s.postcodeBtn,
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  opacity:
                    isBusy || !postcode.trim() ? 0.5 : pressed ? 0.9 : 1,
                },
              ]}
            >
              {submitLoading ? (
                <ActivityIndicator size="small" color={accent} />
              ) : (
                <Text style={[s.postcodeBtnText, { color: c.text.primary }]}>
                  {t('onboarding.setLocation', 'Set Your Location')}
                </Text>
              )}
            </Pressable>
          </Animated.View>
        )}

        {/* Error */}
        {error && (
          <Text style={[s.error, { color: '#EF4444' }]}>{error}</Text>
        )}

        {/* Privacy note */}
        <View
          style={[
            s.privacyCard,
            { backgroundColor: accent + '10', borderColor: accent + '25' },
          ]}
        >
          <Info size={16} color={accent} style={{ marginTop: 1 }} />
          <Text style={[s.privacyText, { color: c.text.secondary }]}>
            {t(
              'onboarding.privacyNote',
              'We only use your location to calculate distances to available books. Your exact address is never shared with other users.',
            )}
          </Text>
        </View>

        {/* Skip */}
        {!locationSet && (
          <Pressable
            onPress={handleSkip}
            disabled={isBusy}
            style={({ pressed }) => [
              s.skipBtn,
              { opacity: isBusy ? 0.4 : pressed ? 0.7 : 1 },
            ]}
          >
            {skipLoading ? (
              <ActivityIndicator size="small" color={c.text.placeholder} />
            ) : (
              <Text style={[s.skipText, { color: c.text.placeholder }]}>
                {t('onboarding.skip', 'Skip')}
              </Text>
            )}
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 80,
    alignItems: 'center',
  },

  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },

  step: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: spacing.xl,
  },

  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    paddingVertical: 16,
    borderRadius: radius.xl,
  },
  gpsBtnText: {
    color: '#152018',
    fontWeight: '700',
    fontSize: 16,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: '600',
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },

  postcodeBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  postcodeBtnText: {
    fontWeight: '600',
    fontSize: 15,
  },

  successSection: {
    width: '100%',
    gap: spacing.lg,
  },
  successCard: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.xs,
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  successLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  successValue: {
    fontSize: 18,
    fontWeight: '700',
  },

  primaryBtn: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: radius.xl,
  },
  primaryBtnText: {
    color: '#152018',
    fontWeight: '700',
    fontSize: 16,
  },

  error: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.md,
  },

  privacyCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.xl,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },

  skipBtn: {
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
