import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '@/navigation/types';
import { MyProfileScreen } from '@/features/profile/screens/MyProfileScreen';
import { EditProfileScreen } from '@/features/profile/screens/EditProfileScreen';
import { MyBooksScreen } from '@/features/books/screens/MyBooksScreen';
import { BookDetailScreen } from '@/features/books/screens/BookDetailScreen';
import { AddBookScreen } from '@/features/books/screens/AddBookScreen';
import { EditBookScreen } from '@/features/books/screens/EditBookScreen';
import { WishlistScreen } from '@/features/books/screens/WishlistScreen';
import { SettingsScreen } from '@/features/profile/screens/SettingsScreen';
import { NotificationPreferencesScreen } from '@/features/notifications/screens/NotificationPreferencesScreen';
import { BlockedUsersScreen } from '@/features/trust-safety/screens/BlockedUsersScreen';
import { useProfileHeaderOptions, useChildHeaderOptions } from '@/navigation/headerOptions';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  const profile = useProfileHeaderOptions();
  const child = useChildHeaderOptions();

  return (
    <Stack.Navigator>
      <Stack.Screen name="MyProfile" component={MyProfileScreen} options={{ ...profile, headerTitle: 'Profile' }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ ...child, headerTitle: 'Edit profile' }} />
      <Stack.Screen name="MyBooks" component={MyBooksScreen} options={{ ...child, headerTitle: 'My books' }} />
      <Stack.Screen name="BookDetail" component={BookDetailScreen} options={{ ...child, headerTitle: '' }} />
      <Stack.Screen name="AddBook" component={AddBookScreen} options={{ ...child, headerTitle: 'Add book' }} />
      <Stack.Screen name="EditBook" component={EditBookScreen} options={{ ...child, headerTitle: 'Edit book' }} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ ...child, headerTitle: 'Wishlist' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ ...child, headerTitle: 'Settings' }} />
      <Stack.Screen
        name="NotificationPreferences"
        component={NotificationPreferencesScreen}
        options={{ ...child, headerTitle: 'Notifications' }}
      />
      <Stack.Screen
        name="BlockedUsers"
        component={BlockedUsersScreen}
        options={{ ...child, headerTitle: 'Blocked Users' }}
      />
    </Stack.Navigator>
  );
}
