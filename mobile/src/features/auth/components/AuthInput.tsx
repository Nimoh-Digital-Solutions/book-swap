import React, { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useColors } from '@/hooks/useColors';
import { typography, spacing, radius } from '@/constants/theme';

type AuthInputProps = TextInputProps & {
  label?: string;
  icon?: LucideIcon;
  error?: string;
  rightAction?: {
    label: string;
    onPress: () => void;
  };
};

export const AuthInput = forwardRef<TextInput, AuthInputProps>(
  ({ label, icon: Icon, error, rightAction, style, onFocus, onBlur, ...rest }, ref) => {
    const c = useColors();
    const [focused, setFocused] = useState(false);

    const borderColor = error
      ? c.status.error
      : focused
        ? c.auth.borderGlassFocus
        : c.auth.borderGlass;

    return (
      <View style={s.field}>
        {label && <Text style={[s.label, { color: c.auth.textMuted }]}>{label}</Text>}
        <View
          style={[
            s.inputRow,
            { backgroundColor: c.auth.bgGlass, borderColor },
          ]}
        >
          {Icon && (
            <View style={s.iconWrap}>
              <Icon size={18} color={focused ? c.auth.golden : c.auth.textMuted} />
            </View>
          )}
          <TextInput
            ref={ref}
            style={[
              s.input,
              { color: c.auth.textOnDark },
              Icon && s.inputWithIcon,
              rightAction && s.inputWithRight,
              style,
            ]}
            placeholderTextColor={c.auth.textMuted}
            selectionColor={c.auth.golden}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...rest}
          />
          {rightAction && (
            <Pressable
              onPress={rightAction.onPress}
              style={s.rightAction}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={rightAction.label}
            >
              <Text style={[s.rightActionText, { color: c.auth.golden }]}>
                {rightAction.label}
              </Text>
            </Pressable>
          )}
        </View>
        {error && <Text style={[s.error, { color: c.status.error }]}>{error}</Text>}
      </View>
    );
  },
);

AuthInput.displayName = 'AuthInput';

const s = StyleSheet.create({
  field: { marginBottom: spacing.md },
  label: {
    ...typography.label,
    marginBottom: spacing.xs + 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.lg,
    minHeight: 52,
    overflow: 'hidden',
  },
  iconWrap: {
    paddingLeft: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...typography.input,
  },
  inputWithIcon: {
    paddingLeft: spacing.sm,
  },
  inputWithRight: {
    paddingRight: 60,
  },
  rightAction: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  rightActionText: {
    ...typography.small,
    fontWeight: '600',
  },
  error: {
    ...typography.small,
    marginTop: spacing.xs,
  },
});
