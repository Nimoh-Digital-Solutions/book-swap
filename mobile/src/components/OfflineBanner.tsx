import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useIsServerDegraded } from '@/hooks/useIsServerDegraded';
import { ANIMATION } from '@/constants/animation';

export function OfflineBanner() {
  const { t } = useTranslation();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { isOffline } = useNetworkStatus();
  const degraded = useIsServerDegraded();

  const showBanner = isOffline || degraded;
  const progress = useSharedValue(showBanner ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(showBanner ? 1 : 0, ANIMATION.spring.default);
  }, [showBanner, progress]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -80 * (1 - progress.value) }],
    opacity: progress.value,
  }));

  const label = isOffline ? t('network.offline') : t('network.degraded');

  return (
    <View pointerEvents="none" style={styles.outer}>
      <Animated.View
        style={[
          styles.wrap,
          { paddingTop: Platform.OS === 'web' ? 8 : insets.top },
          animStyle,
        ]}
      >
        <View
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
          accessibilityLabel={label}
          style={[
            styles.banner,
            {
              backgroundColor: isOffline ? c.status.error : c.status.warning,
            },
          ]}
        >
          <Text style={[styles.text, { color: c.text.inverse }]}>{label}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  wrap: {},
  banner: {
    marginHorizontal: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
