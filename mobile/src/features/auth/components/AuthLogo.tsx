import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { spacing, radius } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

const logoSource = require('../../../../assets/icon.png');

type AuthLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
};

const dims = { sm: 56, md: 80, lg: 104 } as const;

export function AuthLogo({ size = 'md', showName = false }: AuthLogoProps) {
  const c = useColors();
  const d = dims[size];

  return (
    <View style={s.wrap}>
      <View
        style={[
          s.ring,
          {
            width: d + 16,
            height: d + 16,
            borderRadius: radius['2xl'],
            borderColor: c.auth.borderGlass,
          },
        ]}
      >
        <Image
          source={logoSource}
          style={{ width: d, height: d, borderRadius: radius.xl }}
          resizeMode="contain"
          accessibilityLabel="BookSwap logo"
        />
      </View>
      {showName && (
        <Text style={[s.appName, { color: c.auth.cream }]}>
          Book<Text style={{ color: c.auth.golden }}>Swap</Text>
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center' },
  ring: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: spacing.md,
  },
});
