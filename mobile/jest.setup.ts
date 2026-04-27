/* eslint-disable @typescript-eslint/no-empty-function */

(globalThis as typeof globalThis & { __DEV__: boolean }).__DEV__ = true;

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  withScope: jest.fn((cb) => cb({ setExtras: jest.fn() })),
  mobileReplayIntegration: jest.fn(() => ({})),
  reactNavigationIntegration: jest.fn(() => ({
    registerNavigationContainer: jest.fn(),
  })),
  Scope: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: {} } },
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store[key] ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: jest.fn(async (key: string) => {
        delete store[key];
      }),
      clear: jest.fn(async () => {
        Object.keys(store).forEach((k) => {
          delete store[k];
        });
      }),
    },
  };
});

jest.mock('expo-secure-store', () => ({
  getItem: jest.fn(() => null),
  getItemAsync: jest.fn(async () => null),
  setItem: jest.fn(),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ status: 'undetermined' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'mock-token' })),
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn(async () => null),
  AndroidImportance: { HIGH: 4 },
  AndroidNotificationPriority: { HIGH: 'high' },
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  authenticateAsync: jest.fn(async () => ({ success: true })),
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC: 2 },
}));

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => {
    const store: Record<string, string> = {};
    return {
      getString: jest.fn((key: string) => store[key] ?? undefined),
      set: jest.fn((key: string, value: string) => { store[key] = value; }),
      delete: jest.fn((key: string) => { delete store[key]; }),
      contains: jest.fn((key: string) => key in store),
      getAllKeys: jest.fn(() => Object.keys(store)),
      clearAll: jest.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
    };
  }),
}));

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      createAnimatedComponent: (component: any) => component,
      View,
      Text: View,
      Image: View,
      ScrollView: View,
      FlatList: View,
    },
    useSharedValue: jest.fn((init: any) => ({ value: init })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn((val: any) => val),
    withTiming: jest.fn((val: any) => val),
    withDelay: jest.fn((_delay: any, val: any) => val),
    withSequence: jest.fn((...args: any[]) => args[args.length - 1]),
    useReducedMotion: jest.fn(() => false),
    FadeIn: { duration: jest.fn().mockReturnThis() },
    FadeOut: { duration: jest.fn().mockReturnThis() },
    FadeInDown: { duration: jest.fn().mockReturnThis(), delay: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
    FadeInUp: { duration: jest.fn().mockReturnThis(), delay: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
    FadeOutUp: { duration: jest.fn().mockReturnThis() },
    SlideInRight: { duration: jest.fn().mockReturnThis(), springify: jest.fn().mockReturnThis() },
    SlideOutLeft: { duration: jest.fn().mockReturnThis() },
    ZoomIn: { duration: jest.fn().mockReturnThis() },
    Layout: { springify: jest.fn().mockReturnThis(), duration: jest.fn().mockReturnThis() },
    LinearTransition: { springify: jest.fn().mockReturnThis(), duration: jest.fn().mockReturnThis() },
    Easing: { bezier: jest.fn() },
    createAnimatedComponent: (component: any) => component,
    useAnimatedRef: jest.fn(() => ({ current: null })),
    measure: jest.fn(),
    runOnJS: jest.fn((fn: any) => fn),
    runOnUI: jest.fn((fn: any) => fn),
    interpolate: jest.fn(),
    Extrapolation: { CLAMP: 'clamp' },
  };
});

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children }: any) => children,
  Swipeable: jest.fn(),
  DrawerLayout: jest.fn(),
  State: {},
  PanGestureHandler: jest.fn(),
  BaseButton: jest.fn(),
  Directions: {},
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: jest.fn(), hide: jest.fn() },
}));

jest.mock('@react-native-community/netinfo', () => {
  const addEventListener = jest.fn(() => jest.fn());
  const fetch = jest.fn(async () => ({ isConnected: true, isInternetReachable: true }));
  return {
    __esModule: true,
    default: { addEventListener, fetch },
    addEventListener,
    fetch,
  };
});

jest.mock('i18next', () => ({
  use: jest.fn().mockReturnThis(),
  init: jest.fn().mockReturnThis(),
  t: jest.fn((key: string) => key),
  language: 'en',
  changeLanguage: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en', changeLanguage: jest.fn() } }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  Trans: ({ children }: any) => children,
}));

if (!process.env.JEST_VERBOSE) {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
}
