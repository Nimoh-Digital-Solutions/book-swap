import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MapPin, ScanBarcode, MessageCircle, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { MainTabParamList } from '@/navigation/types';
import { HomeStack } from '@/navigation/stacks/HomeStack';
import { BrowseStack } from '@/navigation/stacks/BrowseStack';
import { ScanStack } from '@/navigation/stacks/ScanStack';
import { MessagesStack } from '@/navigation/stacks/MessagesStack';
import { ProfileStack } from '@/navigation/stacks/ProfileStack';
import { FloatingTabBar } from '@/components/FloatingTabBar';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="BrowseTab"
        component={BrowseStack}
        options={{
          title: t('tabs.browse'),
          tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ScanTab"
        component={ScanStack}
        options={{
          title: t('tabs.scan'),
          tabBarIcon: ({ color, size }) => <ScanBarcode size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesStack}
        options={{
          title: t('tabs.messages'),
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          tabBarButton: () => null,
        }}
      />
    </Tab.Navigator>
  );
}
