import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { BrowseStackParamList } from '@/navigation/types';
import { BrowseMapScreen } from '@/features/books/screens/BrowseMapScreen';
import { BookDetailScreen } from '@/features/books/screens/BookDetailScreen';
import { RequestSwapScreen } from '@/features/exchanges/screens/RequestSwapScreen';

const Stack = createNativeStackNavigator<BrowseStackParamList>();

export function BrowseStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BrowseMap" component={BrowseMapScreen} options={{ title: 'Browse' }} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ title: 'Book' }} />
      <Stack.Screen name="RequestSwap" component={RequestSwapScreen} options={{ title: 'Request swap' }} />
    </Stack.Navigator>
  );
}
