import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/types';
import { HomeScreen } from '@/features/books/screens/HomeScreen';
import { BookDetailScreen } from '@/features/books/screens/BookDetailScreen';
import { UserProfileScreen } from '@/features/profile/screens/UserProfileScreen';
import { UserReviewsScreen } from '@/features/ratings/screens/UserReviewsScreen';
import { RequestSwapScreen } from '@/features/exchanges/screens/RequestSwapScreen';
import { NotificationListScreen } from '@/features/notifications/screens/NotificationListScreen';
import { useSharedHeaderOptions, useChildHeaderOptions } from '@/navigation/headerOptions';
import { useAuthStore } from '@/stores/authStore';
import { useColors } from '@/hooks/useColors';

const Stack = createNativeStackNavigator<HomeStackParamList>();

function HomeHeaderTitle() {
  const user = useAuthStore((s) => s.user);
  const c = useColors();
  const name = user?.first_name || user?.username || '';

  return (
    <Text style={[s.title, { color: c.text.primary }]} numberOfLines={1}>
      Hi, {name}
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
        name="RequestSwap"
        component={RequestSwapScreen}
        options={{ ...child, headerTitle: t('navigation.requestSwap', 'Request Swap') }}
      />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ ...child, headerTitle: 'Profile' }} />
      <Stack.Screen name="UserReviews" component={UserReviewsScreen} options={{ ...child, headerTitle: 'Reviews' }} />
      <Stack.Screen
        name="Notifications"
        component={NotificationListScreen}
        options={{ ...child, headerTitle: t('navigation.notifications', 'Notifications') }}
      />
    </Stack.Navigator>
  );
}
