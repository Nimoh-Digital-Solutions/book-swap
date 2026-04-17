import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MessagesStackParamList } from '@/navigation/types';
import { ExchangeListScreen } from '@/features/exchanges/screens/ExchangeListScreen';
import { ExchangeDetailScreen } from '@/features/exchanges/screens/ExchangeDetailScreen';
import { IncomingRequestsScreen } from '@/features/exchanges/screens/IncomingRequestsScreen';
import { CounterOfferScreen } from '@/features/exchanges/screens/CounterOfferScreen';
import { ChatScreen } from '@/features/messaging/screens/ChatScreen';
import { useSharedHeaderOptions, useChildHeaderOptions } from '@/navigation/headerOptions';

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export function MessagesStack() {
  const shared = useSharedHeaderOptions();
  const child = useChildHeaderOptions();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ExchangeList"
        component={ExchangeListScreen}
        options={{ ...shared, headerTitle: 'Exchanges' }}
      />
      <Stack.Screen
        name="IncomingRequests"
        component={IncomingRequestsScreen}
        options={{ ...child, headerTitle: 'Incoming Requests' }}
      />
      <Stack.Screen
        name="ExchangeDetail"
        component={ExchangeDetailScreen}
        options={{ ...child, headerTitle: '' }}
      />
      <Stack.Screen
        name="CounterOffer"
        component={CounterOfferScreen}
        options={{ ...child, headerTitle: 'Counter Offer' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
