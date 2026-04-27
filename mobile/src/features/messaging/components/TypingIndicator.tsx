import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

interface Props {
  username: string;
}

const DOT_SIZE = 4;
const BOUNCE_HEIGHT = -3;
const DURATION = 300;
const DOT_DELAYS = [0, 150, 300];

function BouncingDot({ delay, color }: { delay: number; color: string }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(BOUNCE_HEIGHT, { duration: DURATION, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: DURATION, easing: Easing.in(Easing.quad) }),
        ),
        -1,
      ),
    );
  }, [delay, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        s.dot,
        { backgroundColor: color },
        style,
      ]}
    />
  );
}

export function TypingIndicator({ username }: Props) {
  const { t } = useTranslation();
  const c = useColors();

  return (
    <View style={s.container}>
      <View style={s.row}>
        <Text style={[s.text, { color: c.text.secondary }]}>
          {t('messaging.typing', { defaultValue: '{{name}} is typing', name: username })}
        </Text>
        <View style={s.dots}>
          {DOT_DELAYS.map((delay) => (
            <BouncingDot key={delay} delay={delay} color={c.text.secondary} />
          ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 2,
    height: DOT_SIZE + 6,
    paddingTop: 3,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
