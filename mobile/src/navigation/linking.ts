import type { LinkingOptions, NavigationState, PartialState } from '@react-navigation/native';
import { getStateFromPath as getStateFromPathInternal } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import type { RootStackParamList } from '@/navigation/types';

const prefix = Linking.createURL('/');

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): boolean {
  return typeof value === 'string' && UUID_RE.test(value);
}

function validateDeepLinkState(state: PartialState<NavigationState> | undefined): boolean {
  if (!state?.routes?.length) return true;
  for (const route of state.routes) {
    const params = route.params as Record<string, unknown> | undefined;
    if (params) {
      if ('bookId' in params && params.bookId !== undefined && !isUuid(params.bookId)) {
        return false;
      }
      if ('userId' in params && params.userId !== undefined && !isUuid(params.userId)) {
        return false;
      }
      if ('exchangeId' in params && params.exchangeId !== undefined && !isUuid(params.exchangeId)) {
        return false;
      }
    }
    if (route.state && !validateDeepLinkState(route.state as PartialState<NavigationState>)) {
      return false;
    }
  }
  return true;
}

const config: LinkingOptions<RootStackParamList>['config'] = {
  screens: {
    Main: {
      screens: {
        HomeTab: {
          screens: {
            BookDetail: 'book/:bookId',
            UserProfile: 'user/:userId',
          },
        },
        BrowseTab: {
          screens: {
            BrowseMap: 'browse',
          },
        },
        MessagesTab: {
          screens: {
            Chat: 'chat/:exchangeId',
          },
        },
        ProfileTab: {
          screens: {
            MyProfile: 'profile',
          },
        },
      },
    },
    Auth: {
      screens: {
        Login: 'login',
        Register: 'register',
        PasswordResetConfirm: {
          path: 'auth/password/reset/confirm',
          parse: {
            uid: (value: string) => value,
            token: (value: string) => value,
          },
        },
        EmailVerifyPending: 'auth/email/verify-pending',
        EmailVerifyConfirm: 'auth/email/verify/:token',
      },
    },
  },
};

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'bookswap://'],
  config,
  getStateFromPath(path, options) {
    const state = getStateFromPathInternal(path, {
      initialRouteName: options?.initialRouteName,
      screens: config.screens!,
    });
    if (!state) return undefined;
    return validateDeepLinkState(state) ? state : undefined;
  },
};
