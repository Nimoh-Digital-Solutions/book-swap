import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  BrowseTab: undefined;
  ScanTab: undefined;
  MessagesTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  BookDetail: { bookId: string };
  UserProfile: { userId: string };
};

export type BrowseStackParamList = {
  BrowseMap: undefined;
  BookDetail: { bookId: string };
  RequestSwap: { bookId: string };
};

export type ScanStackParamList = {
  Scanner: undefined;
  ScanResult: { isbn: string };
  AddBook: { isbn?: string; title?: string; author?: string };
};

export type MessagesStackParamList = {
  ExchangeList: undefined;
  Chat: { exchangeId: string };
  ExchangeDetail: { exchangeId: string };
};

export type ProfileStackParamList = {
  MyProfile: undefined;
  EditProfile: undefined;
  MyBooks: undefined;
  AddBook: undefined;
  EditBook: { bookId: string };
  Wishlist: undefined;
  Settings: undefined;
  NotificationPreferences: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
