import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useColors } from '@/hooks/useColors';

interface Props {
  uri?: string | null;
  name: string;
  size?: number;
  borderColor?: string;
}

export function Avatar({ uri, name, size = 48, borderColor }: Props) {
  const c = useColors();
  const [loadFailed, setLoadFailed] = useState(false);
  const prevUri = useRef(uri);

  useEffect(() => {
    if (uri !== prevUri.current) {
      setLoadFailed(false);
      prevUri.current = uri;
    }
  }, [uri]);

  const onError = useCallback(() => setLoadFailed(true), []);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const borderRadius = size / 2;
  const resolvedBorder = borderColor ?? c.auth.golden;

  if (uri && !loadFailed) {
    return (
      <Image
        source={{ uri }}
        cachePolicy="memory-disk"
        contentFit="cover"
        transition={200}
        recyclingKey={uri}
        style={[
          s.image,
          {
            width: size,
            height: size,
            borderRadius,
            borderColor: resolvedBorder,
            backgroundColor: c.border.default,
          },
        ]}
        accessibilityLabel={name}
        onError={onError}
      />
    );
  }

  return (
    <View
      style={[
        s.fallback,
        {
          width: size,
          height: size,
          borderRadius,
          borderColor: resolvedBorder,
          backgroundColor: c.auth.bg,
        },
      ]}
      accessibilityLabel={name}
    >
      <Text style={[s.initials, { fontSize: size * 0.38, color: c.auth.cream }]}>
        {initials || '?'}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  image: { borderWidth: 2 },
  fallback: {
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: { fontWeight: '700' },
});
