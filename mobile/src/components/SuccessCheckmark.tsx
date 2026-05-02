import { Check } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, {
  BounceIn,
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { useColors } from '@/hooks/useColors';

interface SuccessCheckmarkProps {
  visible: boolean;
  onDone: () => void;
  duration?: number;
}

export function SuccessCheckmark({
  visible,
  onDone,
  duration = 1200,
}: SuccessCheckmarkProps) {
  const c = useColors();
  const accent = c.auth.golden;
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (!visible) return;

    opacity.value = 1;
    opacity.value = withDelay(
      duration - 300,
      withTiming(0, { duration: 300 }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
  }, [visible, duration, onDone, opacity]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal transparent statusBarTranslucent animationType="none">
      <Animated.View
        entering={FadeIn.duration(150)}
        exiting={FadeOut.duration(200)}
        style={s.overlay}
      >
        <Animated.View style={[s.circle, { backgroundColor: accent }, containerStyle]}>
          <Animated.View entering={BounceIn.duration(500).delay(100)}>
            <Check size={48} color="#fff" strokeWidth={3} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  circle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
