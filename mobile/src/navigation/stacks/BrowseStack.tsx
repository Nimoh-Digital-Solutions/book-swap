import React from 'react';
import { useTranslation } from 'react-i18next';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { BrowseStackParamList } from '@/navigation/types';
import { BrowseMapScreen } from '@/features/books/screens/BrowseMapScreen';
import { BookDetailScreen } from '@/features/books/screens/BookDetailScreen';
import { EditBookScreen } from '@/features/books/screens/EditBookScreen';
import { RequestSwapScreen } from '@/features/exchanges/screens/RequestSwapScreen';
import { UserProfileScreen } from '@/features/profile/screens/UserProfileScreen';
import { UserReviewsScreen } from '@/features/ratings/screens/UserReviewsScreen';
import { useSharedHeaderOptions, useChildHeaderOptions, HeaderHomeButton, NotificationBell } from '@/navigation/headerOptions';

const Stack = createNativeStackNavigator<BrowseStackParamList>();

export function BrowseStack() {
  const { t } = useTranslation();
  const shared = useSharedHeaderOptions();
  const child = useChildHeaderOptions();

  const browseOptions = {
    ...shared,
    headerTitle: t('navigation.browse', 'Browse'),
    headerLeft: () => <HeaderHomeButton />,
    headerRight: () => <NotificationBell />,
  };

  return (
    <Stack.Navigator>
      <Stack.Screen name="BrowseMap" component={BrowseMapScreen} options={browseOptions} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ ...child, headerTitle: '' }} />
      <Stack.Screen
        name="EditBook"
        component={EditBookScreen}
        options={{ ...child, headerTitle: t('navigation.editBook', 'Edit Book') }}
      />
      <Stack.Screen
        name="RequestSwap"
        component={RequestSwapScreen}
        options={{ ...child, headerTitle: t('navigation.requestSwap', 'Request Swap') }}
      />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ ...child, headerTitle: t('navigation.profile', 'Profile') }} />
      <Stack.Screen name="UserReviews" component={UserReviewsScreen} options={{ ...child, headerTitle: t('navigation.reviews', 'Reviews') }} />
    </Stack.Navigator>
  );
}
