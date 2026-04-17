import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@/navigation/types';
import { HomeScreen } from '@/features/books/screens/HomeScreen';
import { BookDetailScreen } from '@/features/books/screens/BookDetailScreen';
import { UserProfileScreen } from '@/features/profile/screens/UserProfileScreen';
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
      <Stack.Screen name="RequestSwap" component={RequestSwapScreen} options={{ ...child, headerTitle: 'Request Swap' }} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ ...child, headerTitle: 'Profile' }} />
      <Stack.Screen name="Notifications" component={NotificationListScreen} options={{ ...child, headerTitle: 'Notifications' }} />
    </Stack.Navigator>
  );
}
