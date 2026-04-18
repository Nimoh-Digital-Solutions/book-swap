import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  PasswordResetConfirm: { uid: string; token: string };
  EmailVerifyPending: { email?: string };
  EmailVerifyConfirm: { token: string };
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
  UserReviews: { userId: string; username?: string };
  RequestSwap: { bookId: string };
  Notifications: undefined;
};

export type BrowseStackParamList = {
  BrowseMap: { initialSearch?: string } | undefined;
  BookDetail: { bookId: string };
  RequestSwap: { bookId: string };
  UserProfile: { userId: string };
  UserReviews: { userId: string; username?: string };
};

export type ScanStackParamList = {
  Scanner: undefined;
  BookSearch: undefined;
  ScanResult: {
    isbn: string;
    title?: string;
    author?: string;
    cover_url?: string;
    description?: string;
    language?: string;
    page_count?: number | null;
    publish_year?: number | null;
  };
  AddBook: {
    isbn?: string;
    title?: string;
    author?: string;
    cover_url?: string;
    description?: string;
    language?: string;
    page_count?: number | null;
    publish_year?: number | null;
  };
};

export type MessagesStackParamList = {
  ExchangeList: undefined;
  IncomingRequests: undefined;
  Chat: {
    exchangeId: string;
    partnerName?: string;
    partnerAvatar?: string | null;
    exchangeStatus?: string;
  };
  ExchangeDetail: { exchangeId: string };
  CounterOffer: { exchangeId: string; requesterId: string; requesterName: string };
  UserProfile: { userId: string };
  UserReviews: { userId: string; username?: string };
};

export type ProfileStackParamList = {
  MyProfile: undefined;
  EditProfile: undefined;
  MyBooks: undefined;
  BookDetail: { bookId: string };
  AddBook: undefined;
  EditBook: { bookId: string };
  Wishlist: undefined;
  Settings: undefined;
  NotificationPreferences: undefined;
  BlockedUsers: undefined;
  ChangePassword: undefined;
  MyReviews: undefined;
  Appearance: undefined;
  Language: undefined;
  About: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
