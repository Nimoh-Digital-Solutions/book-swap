import React, { useMemo } from 'react';
import ToastMessage, { BaseToast, ErrorToast } from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors, useIsDark } from '@/hooks/useColors';

export function ToastRoot() {
  const c = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();

  const toastConfig = useMemo(
    () => ({
      success: (props: React.ComponentProps<typeof BaseToast>) => (
        <BaseToast
          {...props}
          style={{
            backgroundColor: c.surface.white,
            borderLeftColor: c.status.success,
            borderLeftWidth: 4,
            borderColor: isDark ? `${c.neutral[200]}60` : 'transparent',
            borderWidth: isDark ? 1 : 0,
          }}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          text1Style={{ fontSize: 15, fontWeight: '600', color: c.text.primary }}
          text2Style={{ fontSize: 13, color: c.text.secondary }}
        />
      ),
      error: (props: React.ComponentProps<typeof ErrorToast>) => (
        <ErrorToast
          {...props}
          style={{
            backgroundColor: c.surface.white,
            borderLeftColor: c.status.error,
            borderLeftWidth: 4,
            borderColor: isDark ? `${c.neutral[200]}60` : 'transparent',
            borderWidth: isDark ? 1 : 0,
          }}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          text1Style={{ fontSize: 15, fontWeight: '600', color: c.text.primary }}
          text2Style={{ fontSize: 13, color: c.text.secondary }}
        />
      ),
      info: (props: React.ComponentProps<typeof BaseToast>) => (
        <BaseToast
          {...props}
          style={{
            backgroundColor: c.surface.white,
            borderLeftColor: c.status.info,
            borderLeftWidth: 4,
            borderColor: isDark ? `${c.neutral[200]}60` : 'transparent',
            borderWidth: isDark ? 1 : 0,
          }}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          text1Style={{ fontSize: 15, fontWeight: '600', color: c.text.primary }}
          text2Style={{ fontSize: 13, color: c.text.secondary }}
        />
      ),
    }),
    [c, isDark],
  );
  return <ToastMessage config={toastConfig} position="top" topOffset={insets.top + 10} />;
}

export function showSuccessToast(message: string, description?: string) {
  ToastMessage.show({ type: 'success', text1: message, text2: description, visibilityTime: 3000 });
}
export function showErrorToast(message: string, description?: string) {
  ToastMessage.show({ type: 'error', text1: message, text2: description, visibilityTime: 5000 });
}
export function showInfoToast(message: string, description?: string) {
  ToastMessage.show({ type: 'info', text1: message, text2: description, visibilityTime: 3000 });
}
