import { Easing } from 'react-native-reanimated';

export const ANIMATION = {
  spring: {
    default: { damping: 18, stiffness: 180 },
    snappy: { damping: 14, stiffness: 200 },
    gentle: { damping: 22, stiffness: 150 },
    bounce: { damping: 10, stiffness: 300 },
  },

  timing: {
    fast: { duration: 150, easing: Easing.out(Easing.quad) },
    normal: { duration: 250, easing: Easing.out(Easing.cubic) },
    slow: { duration: 400, easing: Easing.out(Easing.cubic) },
    exit: { duration: 200, easing: Easing.in(Easing.cubic) },
  },

  stagger: {
    fast: 40,
    normal: 60,
    slow: 80,
  },

  scale: {
    pressed: 0.97,
    active: 1.08,
    badge: 1.3,
  },

  skeleton: {
    opacityRange: [0.3, 0.65] as const,
    halfCycleDuration: 750,
  },
} as const;
