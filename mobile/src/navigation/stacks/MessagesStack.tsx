import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MessagesStackParamList } from '@/navigation/types';
import { ExchangeListScreen } from '@/features/exchanges/screens/ExchangeListScreen';
import { ChatScreen } from '@/features/messaging/screens/ChatScreen';
import { ExchangeDetailScreen } from '@/features/exchanges/screens/ExchangeDetailScreen';
import { useSharedHeaderOptions } from '@/navigation/headerOptions';

const Stack = createNativeStackNavigator<MessagesStackParamList>();

export function MessagesStack() {
  const shared = useSharedHeaderOptions();

  return (
    <Stack.Navigator>
      <Stack.Screen name="ExchangeList" component={ExchangeListScreen} options={{ ...shared, headerTitle: 'Messages' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
      <Stack.Screen name="ExchangeDetail" component={ExchangeDetailScreen} options={{ title: 'Exchange' }} />
    </Stack.Navigator>
  );
}
