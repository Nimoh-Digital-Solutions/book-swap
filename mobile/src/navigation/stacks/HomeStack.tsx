import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/types';
import { HomeScreen } from '@/features/books/screens/HomeScreen';
import { BookDetailScreen } from '@/features/books/screens/BookDetailScreen';
import { UserProfileScreen } from '@/features/profile/screens/UserProfileScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ title: 'Book' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
}
