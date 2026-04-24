import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

const logoSource = require('../../assets/icon.png');

const SIZES = {
  sm: { logo: 32, ring: 48, label: 12 },
  md: { logo: 56, ring: 80, label: 14 },
  lg: { logo: 80, ring: 112, label: 16 },
} as const;

export type BrandedLoaderSize = keyof typeof SIZES;

export interface BrandedLoaderProps {
  /** Visual size. Defaults to 'md'. */
  size?: BrandedLoaderSize;
  /** Optional copy shown beneath the logo. */
  label?: string;
  /** If true, fills the container (flex: 1). Defaults to true. */
  fill?: boolean;
  /** Optional style overrides for the outer container. */
  style?: ViewStyle;
  /** If true, renders on a dark backdrop (use over content). */
  withBackdrop?: boolean;
}

/**
 * BrandedLoader — branded in-app loading indicator for full-screen and
 * embedded loading states. Uses the BookSwap icon with a soft pulse and
 * an animated gold ring, mirroring the splash screen's brand palette.
 */
export function BrandedLoader({
  size = 'md',
  label,
  fill = true,
  style,
  withBackdrop = false,
}: BrandedLoaderProps) {
  const c = useColors();
  const dims = SIZES[size];

  const pulse = useSharedValue(1);
  const spin = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
    spin.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.linear }), -1);
  }, [pulse, spin]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  return (
    <View
      style={[
        s.root,
        fill && s.fill,
        withBackdrop && { backgroundColor: 'rgba(20, 34, 25, 0.92)' },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
      accessible
    >
      <View style={{ width: dims.ring, height: dims.ring, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View
          pointerEvents="none"
          style={[
            s.ring,
            {
              width: dims.ring,
              height: dims.ring,
              borderRadius: dims.ring / 2,
              borderTopColor: c.auth.golden,
              borderRightColor: 'rgba(228, 182, 67, 0.35)',
            },
            ringStyle,
          ]}
        />
        <Animated.View style={[{ width: dims.logo, height: dims.logo }, logoStyle]}>
          <Image
            source={logoSource}
            style={{ width: dims.logo, height: dims.logo, borderRadius: dims.logo / 5 }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
      {label ? (
        <Text style={[s.label, { color: c.auth.textSage, fontSize: dims.label }]} numberOfLines={2}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  fill: {
    flex: 1,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  label: {
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 240,
    letterSpacing: 0.1,
  },
});
