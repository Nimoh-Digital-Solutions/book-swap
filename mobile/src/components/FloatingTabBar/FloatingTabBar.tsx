import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS as _runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useColors, useIsDark } from '@/hooks/useColors';

import { ALWAYS_HIDDEN_TABS, computeVisibility } from './computeVisibility';
import { TabItem } from './TabItem';
import { useTabIndicator } from './useTabIndicator';

// Suppress an unused-import warning while keeping the previous public surface
// (some downstream usages may reach for runOnJS via the same module).
void _runOnJS;

/**
 * FloatingTabBar — custom replacement for the default React Navigation tab bar.
 *
 * Composition:
 *  - `computeVisibility` decides whether the bar renders at all based on the
 *    current navigation state (kept pure so it can be unit-tested).
 *  - `useTabIndicator` owns the spring-animated highlight that follows the
 *    active tab.
 *  - `TabItem` renders each visible route with its own micro-animation +
 *    accessibility wiring.
 *
 * `ProfileTab` is intentionally excluded — see `MainTabs.tsx` for the full
 * rationale (reachable via avatar in headerOptions, Home tiles, AddBook return,
 * and deep links).
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const c = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();

  const shouldShow = computeVisibility(state);

  // Mount/unmount animation for the bar itself.
  const visibleProgress = useSharedValue(shouldShow ? 1 : 0);

  useAnimatedReaction(
    () => shouldShow,
    (show) => {
      visibleProgress.value = show
        ? withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) })
        : withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) });
    },
    [shouldShow],
  );

  const wrapperAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - visibleProgress.value) * 80 }],
    opacity: visibleProgress.value,
  }));

  // Map every route to a stable visible-index used by the indicator + TabItem.
  const visibleRouteIndices: number[] = [];
  state.routes.forEach((route, index) => {
    if (!ALWAYS_HIDDEN_TABS.has(route.name)) {
      visibleRouteIndices.push(index);
    }
  });
  const activeVisibleIndex = visibleRouteIndices.indexOf(state.index);

  const { indicatorStyle, onTabLayout } = useTabIndicator(activeVisibleIndex);

  const pillBg = isDark ? 'rgba(15, 26, 20, 0.95)' : 'rgba(255, 255, 255, 0.92)';
  const activeTint = isDark ? c.auth.golden : c.brand.primary;
  const innerBorder = isDark
    ? c.auth.cardBorder + '60'
    : c.border.default + '60';

  return (
    <Animated.View
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) }, wrapperAnimStyle]}
      pointerEvents={shouldShow ? 'box-none' : 'none'}
    >
      <View style={[styles.pill, { backgroundColor: pillBg }]}>
        <View style={[styles.inner, { borderColor: innerBorder }]}>
          <Animated.View
            style={[
              styles.indicator,
              { backgroundColor: activeTint + '12' },
              indicatorStyle,
            ]}
          />

          {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key];
            if (!descriptor) return null;
            if (ALWAYS_HIDDEN_TABS.has(route.name)) return null;

            const { options } = descriptor;
            const isFocused = state.index === index;
            const visibleIndex = visibleRouteIndices.indexOf(index);

            const label =
              typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : typeof options.title === 'string'
                  ? options.title
                  : route.name;

            const badge = options.tabBarBadge;
            const color = isFocused
              ? activeTint
              : (isDark ? c.auth.textMuted : c.text.placeholder);

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: 'tabLongPress', target: route.key });
            };

            return (
              <TabItem
                key={route.key}
                visibleIndex={visibleIndex}
                isFocused={isFocused}
                label={label}
                badge={badge}
                color={color}
                options={options}
                onPress={onPress}
                onLongPress={onLongPress}
                onLayout={onTabLayout}
              />
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  pill: {
    borderRadius: 28,
    overflow: 'hidden',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 28,
    borderWidth: 1,
  },
  indicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    borderRadius: 22,
  },
});
