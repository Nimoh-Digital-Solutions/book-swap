import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MapPin, ScanBarcode, ArrowLeftRight, User } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { MainTabParamList } from '@/navigation/types';
import { HomeStack } from '@/navigation/stacks/HomeStack';
import { BrowseStack } from '@/navigation/stacks/BrowseStack';
import { ScanStack } from '@/navigation/stacks/ScanStack';
import { MessagesStack } from '@/navigation/stacks/MessagesStack';
import { ProfileStack } from '@/navigation/stacks/ProfileStack';
import { FloatingTabBar } from '@/components/FloatingTabBar';
import { useIncomingCount } from '@/features/exchanges/hooks/useExchanges';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * MainTabs — bottom tab navigator for the authenticated app.
 *
 * Tab visibility model:
 *   - The default React Navigation tab bar is **replaced** by `FloatingTabBar`
 *     (custom design). React Navigation's per-screen `tabBarButton` option is
 *     therefore ignored at render time — `FloatingTabBar` decides which tabs
 *     to show via its own `computeVisibility` + `route.name === 'ProfileTab'`
 *     guard.
 *   - `ProfileTab` is intentionally hidden from the floating bar (the bar is
 *     designed around the four primary actions: Home / Browse / Scan /
 *     Exchanges). Profile is reached via:
 *       • the avatar tap in `headerOptions` (every screen that uses the app
 *         header)
 *       • Home tile shortcuts (e.g. "My Books")
 *       • post-action redirects from `AddBookScreen`
 *       • deep links registered in `navigation/linking.ts`
 *   - Do NOT add `tabBarButton: () => null` to ProfileTab — it would only
 *     matter if we re-enabled the default tab bar; today it just adds noise.
 */
export function MainTabs() {
  const { t } = useTranslation();
  const { data: incomingCount } = useIncomingCount();
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
          title: t('tabs.exchanges'),
          tabBarIcon: ({ color, size }) => <ArrowLeftRight size={size} color={color} />,
          tabBarBadge: incomingCount ? incomingCount : undefined,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
