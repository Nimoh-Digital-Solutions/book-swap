import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MessagesStackParamList } from '@/navigation/types';
import { ExchangeListScreen } from '@/features/exchanges/screens/ExchangeListScreen';
import { ExchangeDetailScreen } from '@/features/exchanges/screens/ExchangeDetailScreen';
import { IncomingRequestsScreen } from '@/features/exchanges/screens/IncomingRequestsScreen';
import { ChatScreen } from '@/features/messaging/screens/ChatScreen';
import { useSharedHeaderOptions } from '@/navigation/headerOptions';

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export function MessagesStack() {
  const shared = useSharedHeaderOptions();

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
        options={{ ...shared, headerTitle: 'Incoming Requests' }}
      />
      <Stack.Screen
        name="ExchangeDetail"
        component={ExchangeDetailScreen}
        options={{ ...shared, headerTitle: '' }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ ...shared, headerTitle: 'Chat' }}
      />
    </Stack.Navigator>
  );
}
