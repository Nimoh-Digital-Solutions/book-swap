import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { BrowseStackParamList } from '@/navigation/types';
import { BrowseMapScreen } from '@/features/books/screens/BrowseMapScreen';
import { BookDetailScreen } from '@/features/books/screens/BookDetailScreen';
import { RequestSwapScreen } from '@/features/exchanges/screens/RequestSwapScreen';
import { useSharedHeaderOptions } from '@/navigation/headerOptions';

const Stack = createNativeStackNavigator<BrowseStackParamList>();

export function BrowseStack() {
  const shared = useSharedHeaderOptions();

  return (
    <Stack.Navigator>
      <Stack.Screen name="BrowseMap" component={BrowseMapScreen} options={{ ...shared, headerTitle: 'Browse' }} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ ...shared, headerTitle: '' }} />
      <Stack.Screen name="RequestSwap" component={RequestSwapScreen} options={{ ...shared, headerTitle: 'Request Swap' }} />
    </Stack.Navigator>
  );
}
