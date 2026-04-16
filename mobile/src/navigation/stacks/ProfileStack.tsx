import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/navigation/types';
import { MyProfileScreen } from '@/features/profile/screens/MyProfileScreen';
import { EditProfileScreen } from '@/features/profile/screens/EditProfileScreen';
import { MyBooksScreen } from '@/features/books/screens/MyBooksScreen';
import { AddBookScreen } from '@/features/books/screens/AddBookScreen';
import { EditBookScreen } from '@/features/books/screens/EditBookScreen';
import { WishlistScreen } from '@/features/books/screens/WishlistScreen';
import { SettingsScreen } from '@/features/profile/screens/SettingsScreen';
import { NotificationPreferencesScreen } from '@/features/notifications/screens/NotificationPreferencesScreen';
import { useSharedHeaderOptions } from '@/navigation/headerOptions';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  const shared = useSharedHeaderOptions();

  return (
    <Stack.Navigator>
      <Stack.Screen name="MyProfile" component={MyProfileScreen} options={{ ...shared, headerTitle: 'Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit profile' }} />
      <Stack.Screen name="MyBooks" component={MyBooksScreen} options={{ title: 'My books' }} />
      <Stack.Screen name="AddBook" component={AddBookScreen} options={{ title: 'Add book' }} />
      <Stack.Screen name="EditBook" component={EditBookScreen} options={{ title: 'Edit book' }} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ title: 'Wishlist' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen
        name="NotificationPreferences"
        component={NotificationPreferencesScreen}
        options={{ title: 'Notifications' }}
      />
    </Stack.Navigator>
  );
}
