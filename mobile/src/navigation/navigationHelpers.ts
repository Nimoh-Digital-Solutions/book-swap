import type { CompositeNavigationProp, NavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type {
  HomeStackParamList,
  MainTabParamList,
  ProfileStackParamList,
} from './types';

/**
 * Composite navigation prop for screens that live INSIDE a stack inside the
 * MainTabs navigator. Use this whenever you need to:
 *  - call `.navigate(...)` to a route INSIDE the same stack, AND
 *  - call `.getParent()?.navigate('SomeOtherTab', ...)` to switch tabs.
 *
 * Generic over the stack the screen belongs to so you keep typed param lists
 * for the local stack (`HomeStack`, `BrowseStack`, etc.).
 *
 * Replaces the previous pattern of `useNavigation<any>()` (AUD-M-407).
 */
export type AnyTabNavProp<TStackParamList extends Record<string, object | undefined>> =
  CompositeNavigationProp<
    NativeStackNavigationProp<TStackParamList>,
    NavigationProp<MainTabParamList>
  >;

/**
 * Convenience aliases for the two stacks where most cross-tab navigation
 * happens (avatar / notification bell / "go to my books" buttons).
 */
export type HomeTabNavProp = AnyTabNavProp<HomeStackParamList>;
export type ProfileTabNavProp = AnyTabNavProp<ProfileStackParamList>;
