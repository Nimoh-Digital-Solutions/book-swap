import React, { useCallback, useRef } from 'react';
import { View, Pressable, Text, StyleSheet, Platform, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useColors, useIsDark } from '@/hooks/useColors';
import { ANIMATION } from '@/constants/animation';

const ICON_SIZE = 20;

const HIDDEN_CHILD_ROUTES = new Set([
  'Chat',
  'BookDetail',
  'ExchangeDetail',
  'UserProfile',
  'UserReviews',
  'AddBook',
  'ScanResult',
  'RequestSwap',
  'CounterOffer',
  'EditBook',
  'Notifications',
]);

function computeVisibility(state: BottomTabBarProps['state']): boolean {
  const activeRoute = state.routes[state.index];
  if (!activeRoute) return false;
  if (activeRoute.name === 'ProfileTab') return false;
  if (activeRoute.name === 'BrowseTab') return false;
  const focusedChild = getFocusedRouteNameFromRoute(activeRoute);
  if (focusedChild && HIDDEN_CHILD_ROUTES.has(focusedChild)) return false;
  return true;
}

const INDICATOR_SPRING = { damping: 18, stiffness: 180 };
const ICON_SPRING = ANIMATION.spring.snappy;

interface TabLayout {
  x: number;
  width: number;
}

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const c = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();

  const shouldShow = computeVisibility(state);

  const visibleProgress = useSharedValue(shouldShow ? 1 : 0);
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const tabLayouts = useRef<Map<number, TabLayout>>(new Map());
  const hasInitialLayout = useRef(false);

  const visibleRouteIndices: number[] = [];
  state.routes.forEach((route, index) => {
    if (route.name !== 'ProfileTab') {
      visibleRouteIndices.push(index);
    }
  });

  const activeVisibleIndex = visibleRouteIndices.indexOf(state.index);

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

  const updateIndicator = useCallback((index: number, animate: boolean) => {
    const layout = tabLayouts.current.get(index);
    if (!layout) return;
    if (animate) {
      indicatorX.value = withSpring(layout.x, INDICATOR_SPRING);
      indicatorWidth.value = withSpring(layout.width, INDICATOR_SPRING);
    } else {
      indicatorX.value = layout.x;
      indicatorWidth.value = layout.width;
    }
  }, [indicatorX, indicatorWidth]);

  const onTabLayout = useCallback((visibleIndex: number, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    tabLayouts.current.set(visibleIndex, { x, width });

    if (visibleIndex === activeVisibleIndex) {
      const animate = hasInitialLayout.current;
      hasInitialLayout.current = true;
      updateIndicator(visibleIndex, animate);
    }
  }, [activeVisibleIndex, updateIndicator]);

  React.useEffect(() => {
    if (activeVisibleIndex >= 0) {
      updateIndicator(activeVisibleIndex, hasInitialLayout.current);
    }
  }, [activeVisibleIndex, updateIndicator]);

  const indicatorAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  const pillBg = isDark ? 'rgba(15, 26, 20, 0.95)' : 'rgba(255, 255, 255, 0.92)';
  const activeTint = isDark ? c.auth.golden : c.brand.primary;

  return (
    <Animated.View
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) }, wrapperAnimStyle]}
      pointerEvents={shouldShow ? 'box-none' : 'none'}
    >
      <View style={[styles.pill, { backgroundColor: pillBg }]}>
        <View style={[styles.inner, { borderColor: isDark ? c.auth.cardBorder + '60' : c.border.default + '60' }]}>
          <Animated.View
            style={[
              styles.indicator,
              { backgroundColor: activeTint + '12' },
              indicatorAnimStyle,
            ]}
          />

          {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key];
            if (!descriptor) return null;
            const { options } = descriptor;
            if (route.name === 'ProfileTab') return null;
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

interface TabItemProps {
  visibleIndex: number;
  isFocused: boolean;
  label: string;
  badge: number | string | undefined;
  color: string;
  options: Record<string, any>;
  onPress: () => void;
  onLongPress: () => void;
  onLayout: (visibleIndex: number, event: LayoutChangeEvent) => void;
}

function TabItem({
  visibleIndex,
  isFocused,
  label,
  badge,
  color,
  options,
  onPress,
  onLongPress,
  onLayout,
}: TabItemProps) {
  const c = useColors();
  const iconScale = useSharedValue(isFocused ? ANIMATION.scale.active : 1);

  React.useEffect(() => {
    iconScale.value = withSpring(
      isFocused ? ANIMATION.scale.active : 1,
      ICON_SPRING,
    );
  }, [isFocused, iconScale]);

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => onLayout(visibleIndex, e),
    [visibleIndex, onLayout],
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.tab,
        pressed && styles.tabPressed,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      onLayout={handleLayout}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
    >
      <Animated.View style={[styles.iconContainer, iconAnimStyle]}>
        {options.tabBarIcon?.({ focused: isFocused, color, size: ICON_SIZE })}
        {badge != null && (
          <View style={[styles.badge, { backgroundColor: c.status.error }]}>
            <Text style={styles.badgeText} maxFontSizeMultiplier={1}>
              {typeof badge === 'number' && badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </Animated.View>
      <Text style={[styles.label, { color }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
        {label}
      </Text>
    </Pressable>
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
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 22,
    gap: 2,
  },
  tabPressed: {
    opacity: 0.6,
  },
  iconContainer: {
    position: 'relative',
    width: ICON_SIZE + 8,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
