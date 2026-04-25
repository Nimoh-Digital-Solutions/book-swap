import React, { useCallback, useRef } from 'react';
import { type LayoutChangeEvent } from 'react-native';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type AnimatedStyle,
} from 'react-native-reanimated';

const INDICATOR_SPRING = { damping: 18, stiffness: 180 };

interface TabLayout {
  x: number;
  width: number;
}

/**
 * Owns the spring-animated highlight that follows the active tab.
 *
 * Returns:
 *  - `indicatorStyle` — bind to the animated indicator <View>
 *  - `onTabLayout`    — call from each <TabItem> with its `visibleIndex`
 *
 * Behaviour:
 *  - First measurement of the active tab snaps the indicator (no animation).
 *  - Subsequent active-tab changes spring the indicator to the new layout.
 */
export function useTabIndicator(activeVisibleIndex: number): {
  indicatorStyle: AnimatedStyle;
  onTabLayout: (visibleIndex: number, event: LayoutChangeEvent) => void;
} {
  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const tabLayouts = useRef<Map<number, TabLayout>>(new Map());
  const hasInitialLayout = useRef(false);

  const updateIndicator = useCallback(
    (index: number, animate: boolean) => {
      const layout = tabLayouts.current.get(index);
      if (!layout) return;
      if (animate) {
        indicatorX.value = withSpring(layout.x, INDICATOR_SPRING);
        indicatorWidth.value = withSpring(layout.width, INDICATOR_SPRING);
      } else {
        indicatorX.value = layout.x;
        indicatorWidth.value = layout.width;
      }
    },
    [indicatorX, indicatorWidth],
  );

  const onTabLayout = useCallback(
    (visibleIndex: number, event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      tabLayouts.current.set(visibleIndex, { x, width });

      if (visibleIndex === activeVisibleIndex) {
        const animate = hasInitialLayout.current;
        hasInitialLayout.current = true;
        updateIndicator(visibleIndex, animate);
      }
    },
    [activeVisibleIndex, updateIndicator],
  );

  React.useEffect(() => {
    if (activeVisibleIndex >= 0) {
      updateIndicator(activeVisibleIndex, hasInitialLayout.current);
    }
  }, [activeVisibleIndex, updateIndicator]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  return { indicatorStyle, onTabLayout };
}
