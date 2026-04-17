import React from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useColors, useIsDark } from '@/hooks/useColors';

const ICON_SIZE = 20;

const HIDDEN_CHILD_ROUTES = new Set([
  'Chat',
  'BookDetail',
  'ExchangeDetail',
  'UserProfile',
  'AddBook',
  'ScanResult',
  'RequestSwap',
  'CounterOffer',
]);

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const c = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();

  const activeRoute = state.routes[state.index];
  if (!activeRoute) return null;
  if (activeRoute.name === 'ProfileTab') return null;
  if (activeRoute.name === 'BrowseTab') return null;
  const focusedChild = getFocusedRouteNameFromRoute(activeRoute);
  if (focusedChild && HIDDEN_CHILD_ROUTES.has(focusedChild)) return null;

  const pillBg = isDark ? 'rgba(15, 26, 20, 0.95)' : 'rgba(255, 255, 255, 0.92)';

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.pill, { backgroundColor: pillBg }]}>
        <View style={[styles.inner, { borderColor: isDark ? c.auth.cardBorder + '60' : c.border.default + '60' }]}>
          {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key];
            if (!descriptor) return null;
            const { options } = descriptor;
            if (route.name === 'ProfileTab') return null;
            const isFocused = state.index === index;

            const label =
              typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : typeof options.title === 'string'
                  ? options.title
                  : route.name;

            const badge = options.tabBarBadge;
            const color = isFocused
              ? (isDark ? c.auth.golden : c.brand.primary)
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
              <Pressable
                key={route.key}
                style={({ pressed }) => [
                  styles.tab,
                  isFocused && [styles.tabActive, { backgroundColor: (isDark ? c.auth.golden : c.brand.primary) + '12' }],
                  pressed && styles.tabPressed,
                ]}
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              >
                <View style={styles.iconContainer}>
                  {options.tabBarIcon?.({ focused: isFocused, color, size: ICON_SIZE })}
                  {badge != null && (
                    <View style={[styles.badge, { backgroundColor: c.status.error }]}>
                      <Text style={styles.badgeText} maxFontSizeMultiplier={1}>
                        {typeof badge === 'number' && badge > 99 ? '99+' : badge}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.label, { color }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
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
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 22,
    gap: 2,
  },
  tabActive: {
    borderRadius: 22,
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
