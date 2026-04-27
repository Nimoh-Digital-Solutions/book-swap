import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/types';
import { HomeScreen } from '@/features/books/screens/HomeScreen';
import { BookDetailScreen } from '@/features/books/screens/BookDetailScreen';
import { UserProfileScreen } from '@/features/profile/screens/UserProfileScreen';
import { UserReviewsScreen } from '@/features/ratings/screens/UserReviewsScreen';
import { EditBookScreen } from '@/features/books/screens/EditBookScreen';
import { RequestSwapScreen } from '@/features/exchanges/screens/RequestSwapScreen';
import { NotificationListScreen } from '@/features/notifications/screens/NotificationListScreen';
import { useSharedHeaderOptions, useChildHeaderOptions } from '@/navigation/headerOptions';
import { useAuthStore } from '@/stores/authStore';
import { useColors } from '@/hooks/useColors';

const Stack = createNativeStackNavigator<HomeStackParamList>();

function HomeHeaderTitle() {
  const user = useAuthStore((s) => s.user);
  const c = useColors();
  const { t } = useTranslation();
  const name = user?.first_name || user?.username || '';

  return (
    <Text style={[s.title, { color: c.text.primary }]} numberOfLines={1}>
      {name
        ? t('home.greeting', 'Hi, {{name}}', { name })
        : t('home.greetingDefault', 'Welcome back!')}
    </Text>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700' },
});

export function HomeStack() {
  const { t } = useTranslation();
  const shared = useSharedHeaderOptions();
  const child = useChildHeaderOptions();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ ...shared, headerTitle: () => <HomeHeaderTitle /> }}
      />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ ...child, headerTitle: '' }} />
      <Stack.Screen
        name="EditBook"
        component={EditBookScreen}
        options={{ ...child, headerTitle: t('navigation.editBook', 'Edit Book') }}
      />
      <Stack.Screen
        name="RequestSwap"
        component={RequestSwapScreen}
        options={{ ...child, headerTitle: t('navigation.requestSwap', 'Request Swap'), animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ ...child, headerTitle: t('navigation.profile', 'Profile') }} />
      <Stack.Screen name="UserReviews" component={UserReviewsScreen} options={{ ...child, headerTitle: t('navigation.reviews', 'Reviews') }} />
      <Stack.Screen
        name="Notifications"
        component={NotificationListScreen}
        options={{ ...child, headerTitle: t('navigation.notifications', 'Notifications') }}
      />
    </Stack.Navigator>
  );
}
