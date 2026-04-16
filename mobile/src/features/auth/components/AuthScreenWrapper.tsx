import React from 'react';
import { StyleSheet, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { OfflineBanner } from '@/components/OfflineBanner';
import { spacing } from '@/constants/theme';

type AuthScreenWrapperProps = {
  children: React.ReactNode;
  scrollable?: boolean;
  centered?: boolean;
};

export function AuthScreenWrapper({
  children,
  scrollable = true,
  centered = false,
}: AuthScreenWrapperProps) {
  const c = useColors();

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[s.scroll, centered && s.centered]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <View style={[s.flex, { backgroundColor: c.auth.bg }]}>
      <SafeAreaView style={s.flex}>
        <OfflineBanner />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.flex}
        >
          {content}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  centered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
