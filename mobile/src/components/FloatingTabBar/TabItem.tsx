import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ANIMATION } from '@/constants/animation';
import { useColors } from '@/hooks/useColors';
import { hapticSelection } from '@/lib/haptics';

const ICON_SIZE = 20;
const ICON_SPRING = ANIMATION.spring.snappy;

export interface TabItemProps {
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

export function TabItem({
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

  const handlePress = useCallback(() => {
    void hapticSelection();
    onPress();
  }, [onPress]);

  return (
    <Pressable
      style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
      onPress={handlePress}
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
