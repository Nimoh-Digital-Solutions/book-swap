import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ToastMessage from 'react-native-toast-message';
import type { ToastConfigParams } from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

interface BannerToastProps {
  text1?: string;
  text2?: string;
  backgroundColor: string;
  textColor: string;
}

function BannerToast({ text1, text2, backgroundColor, textColor }: BannerToastProps) {
  return (
    <View style={[styles.banner, { backgroundColor }]}>
      {text1 ? <Text style={[styles.title, { color: textColor }]}>{text1}</Text> : null}
      {text2 ? (
        <Text style={[styles.description, { color: `${textColor}CC` }]}>{text2}</Text>
      ) : null}
    </View>
  );
}

export function ToastRoot() {
  const c = useColors();
  const insets = useSafeAreaInsets();

  const toastConfig = useMemo(
    () => ({
      success: ({ text1, text2 }: ToastConfigParams<unknown>) => (
        <BannerToast
          text1={text1}
          text2={text2}
          backgroundColor={c.status.success}
          textColor={c.text.inverse}
        />
      ),
      error: ({ text1, text2 }: ToastConfigParams<unknown>) => (
        <BannerToast
          text1={text1}
          text2={text2}
          backgroundColor={c.status.error}
          textColor={c.text.inverse}
        />
      ),
      info: ({ text1, text2 }: ToastConfigParams<unknown>) => (
        <BannerToast
          text1={text1}
          text2={text2}
          backgroundColor={c.status.info}
          textColor={c.text.inverse}
        />
      ),
    }),
    [c],
  );
  return <ToastMessage config={toastConfig} position="top" topOffset={insets.top + 10} />;
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 2,
  },
});

export function showSuccessToast(message: string, description?: string) {
  ToastMessage.show({ type: 'success', text1: message, text2: description, visibilityTime: 3000 });
}
export function showErrorToast(message: string, description?: string) {
  ToastMessage.show({ type: 'error', text1: message, text2: description, visibilityTime: 5000 });
}
export function showInfoToast(message: string, description?: string) {
  ToastMessage.show({ type: 'info', text1: message, text2: description, visibilityTime: 3000 });
}
