import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useIsServerDegraded } from '@/hooks/useIsServerDegraded';

export function OfflineBanner() {
  const { t } = useTranslation();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { isOffline } = useNetworkStatus();
  const degraded = useIsServerDegraded();

  const slide = useRef(new Animated.Value(0)).current;

  const showBanner = isOffline || degraded;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: showBanner ? 1 : 0,
      friction: 12,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [showBanner, slide]);

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 0],
  });

  const label = isOffline ? t('network.offline') : t('network.degraded');

  return (
    <View pointerEvents="none" style={styles.outer}>
      <Animated.View
        style={[
          styles.wrap,
          {
            paddingTop: Platform.OS === 'web' ? 8 : insets.top,
            transform: [{ translateY }],
            opacity: showBanner ? 1 : 0,
          },
        ]}
      >
        <View
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
