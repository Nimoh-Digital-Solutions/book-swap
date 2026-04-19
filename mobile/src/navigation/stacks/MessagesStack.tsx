import React from 'react';
import { useTranslation } from 'react-i18next';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MessagesStackParamList } from '@/navigation/types';
import { ExchangeListScreen } from '@/features/exchanges/screens/ExchangeListScreen';
import { ExchangeDetailScreen } from '@/features/exchanges/screens/ExchangeDetailScreen';
import { IncomingRequestsScreen } from '@/features/exchanges/screens/IncomingRequestsScreen';
import { CounterOfferScreen } from '@/features/exchanges/screens/CounterOfferScreen';
import { ChatScreen } from '@/features/messaging/screens/ChatScreen';
import { UserProfileScreen } from '@/features/profile/screens/UserProfileScreen';
import { UserReviewsScreen } from '@/features/ratings/screens/UserReviewsScreen';
import { useSharedHeaderOptions, useChildHeaderOptions } from '@/navigation/headerOptions';

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export function MessagesStack() {
  const { t } = useTranslation();
  const shared = useSharedHeaderOptions();
  const child = useChildHeaderOptions();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ExchangeList"
        component={ExchangeListScreen}
        options={{ ...shared, headerTitle: t('navigation.exchanges', 'Exchanges') }}
      />
      <Stack.Screen
        name="IncomingRequests"
        component={IncomingRequestsScreen}
        options={{ ...child, headerTitle: t('navigation.incomingRequests', 'Incoming Requests') }}
      />
      <Stack.Screen
        name="ExchangeDetail"
        component={ExchangeDetailScreen}
        options={{ ...child, headerTitle: '' }}
      />
      <Stack.Screen
        name="CounterOffer"
        component={CounterOfferScreen}
        options={{ ...child, headerTitle: t('navigation.counterOffer', 'Counter Offer') }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ ...child, headerTitle: t('navigation.profile', 'Profile') }}
      />
      <Stack.Screen
        name="UserReviews"
        component={UserReviewsScreen}
        options={{ ...child, headerTitle: t('navigation.reviews', 'Reviews') }}
      />
    </Stack.Navigator>
  );
}
