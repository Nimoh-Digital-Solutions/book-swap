import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { BrowseStackParamList } from '@/navigation/types';
import { BrowseMapScreen } from '@/features/books/screens/BrowseMapScreen';
import { BookDetailScreen } from '@/features/books/screens/BookDetailScreen';
import { RequestSwapScreen } from '@/features/exchanges/screens/RequestSwapScreen';
import { useSharedHeaderOptions, useChildHeaderOptions } from '@/navigation/headerOptions';

const Stack = createNativeStackNavigator<BrowseStackParamList>();

export function BrowseStack() {
  const shared = useSharedHeaderOptions();
  const child = useChildHeaderOptions();

  return (
    <Stack.Navigator>
      <Stack.Screen name="BrowseMap" component={BrowseMapScreen} options={{ ...shared, headerTitle: 'Browse' }} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ ...child, headerTitle: '' }} />
      <Stack.Screen name="RequestSwap" component={RequestSwapScreen} options={{ ...child, headerTitle: 'Request Swap' }} />
    </Stack.Navigator>
  );
}
