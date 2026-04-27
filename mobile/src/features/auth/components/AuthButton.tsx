import React from 'react';
import { Platform, Pressable, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { typography, spacing, radius } from '@/constants/theme';

type AuthButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'outline';
};

export function AuthButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
}: AuthButtonProps) {
  const c = useColors();
  const isDisabled = disabled || loading;

  if (variant === 'outline') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          s.btn,
          s.outlineBtn,
          { borderColor: c.auth.borderGlass },
          isDisabled && s.disabled,
          pressed && s.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Text style={[s.outlineBtnText, { color: c.auth.golden }]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        s.btn,
        isDisabled && s.disabled,
        pressed && s.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[s.fill, { backgroundColor: c.auth.golden }]}>
        {loading ? (
          <ActivityIndicator size="small" color={c.auth.bg} />
        ) : (
          <Text style={[s.primaryBtnText, { color: c.auth.bg }]}>{label}</Text>
        )}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: {
    borderRadius: radius.lg,
    ...Platform.select({
      ios: {
        overflow: 'hidden' as const,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
    minHeight: 54,
    marginBottom: spacing.md,
  },
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  primaryBtnText: {
    ...typography.button,
    letterSpacing: 0.3,
  },
  outlineBtn: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0,
    elevation: 0,
  },
  outlineBtnText: {
    ...typography.button,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
});
