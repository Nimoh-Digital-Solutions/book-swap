import React, { useEffect } from 'react';
import { registerRootComponent } from 'expo';
import { View, ActivityIndicator, StyleSheet, Text, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { queryClient, queryPersister, CACHE_BUSTER } from '@/lib/queryClient';
import { initSentry, reactNavigationIntegration, wrapRootComponent } from '@/lib/sentry';
import '@/lib/i18n';
import { RootNavigator, navigationRef, linking } from '@/navigation';
import { ToastRoot } from '@/components/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OfflineBanner } from '@/components/OfflineBanner';
import { WebSocketGate } from '@/services/WebSocketGate';
import { BiometricGate } from '@/services/BiometricGate';
import { ThemeGate } from '@/services/ThemeGate';
import { initNotificationHandlers } from '@/services/notificationHandler';
import { useThemeStore } from '@/stores/themeStore';

if ((Text as { defaultProps?: { maxFontSizeMultiplier?: number } }).defaultProps == null) {
  (Text as { defaultProps?: { maxFontSizeMultiplier?: number } }).defaultProps = {};
}
(Text as { defaultProps?: { maxFontSizeMultiplier?: number } }).defaultProps!.maxFontSizeMultiplier = 1.5;
if ((TextInput as { defaultProps?: { maxFontSizeMultiplier?: number } }).defaultProps == null) {
  (TextInput as { defaultProps?: { maxFontSizeMultiplier?: number } }).defaultProps = {};
}
(TextInput as { defaultProps?: { maxFontSizeMultiplier?: number } }).defaultProps!.maxFontSizeMultiplier =
  1.5;

initSentry();

function LoadingFallback() {
  return (
    <View style={styles.fallback}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}

const BookSwapLight = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2563EB',
    background: '#F9FAFB',
    card: '#ffffff',
    text: '#111827',
    border: '#E5E7EB',
    notification: '#F59E0B',
  },
};

const BookSwapDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#60A5FA',
    background: '#111827',
    card: '#1F2937',
    text: '#F9FAFB',
    border: '#374151',
    notification: '#FBBF24',
  },
};

function App() {
  const isDark = useThemeStore((s) => s.isDark);

  useEffect(() => {
    initNotificationHandlers();
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
              persister: queryPersister,
              maxAge: 24 * 60 * 60 * 1000,
              buster: CACHE_BUSTER,
              dehydrateOptions: {
                shouldDehydrateQuery: (query) => {
                  const key = query.queryKey[0] as string;
                  const sensitive = ['messages', 'notifications', 'exchanges'];
                  return query.state.status === 'success' && !sensitive.includes(key);
                },
              },
            }}
          >
            <NavigationContainer
              ref={navigationRef}
              linking={linking}
              fallback={<LoadingFallback />}
              theme={isDark ? BookSwapDark : BookSwapLight}
              onReady={() =>
                reactNavigationIntegration.registerNavigationContainer(navigationRef)
              }
            >
              <StatusBar style={isDark ? 'light' : 'dark'} />
              <ThemeGate />
              <OfflineBanner />
              <BiometricGate>
                <WebSocketGate />
                <RootNavigator />
                <ToastRoot />
              </BiometricGate>
            </NavigationContainer>
          </PersistQueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

registerRootComponent(wrapRootComponent(App));

const styles = StyleSheet.create({
  root: { flex: 1 },
  fallback: { flex: 1, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
});
