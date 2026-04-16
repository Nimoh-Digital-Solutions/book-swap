import { Check } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors, useIsDark } from '@/hooks/useColors';
import { spacing } from '@/constants/theme';
import type { ExchangeStatus } from '@/types';
import { TIMELINE_STATUSES, STATUS_LABELS } from '../constants';

interface Props {
  status: ExchangeStatus;
}

export function ExchangeTimeline({ status }: Props) {
  const c = useColors();
  const isDark = useIsDark();
  const accent = c.auth.golden;

  const currentIdx = TIMELINE_STATUSES.indexOf(status);

  return (
    <View style={s.wrap}>
      {TIMELINE_STATUSES.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const isLast = i === TIMELINE_STATUSES.length - 1;

        return (
          <View key={step} style={s.stepRow}>
            {/* Dot / check */}
            <View style={s.dotCol}>
              <View
                style={[
                  s.dot,
                  done && { backgroundColor: accent },
                  active && { backgroundColor: accent, borderColor: accent + '40', borderWidth: 3 },
                  !done && !active && {
                    backgroundColor: 'transparent',
                    borderColor: isDark ? c.auth.cardBorder : c.border.default,
                    borderWidth: 2,
                  },
                ]}
              >
                {done && <Check size={10} color="#fff" strokeWidth={3} />}
              </View>
              {!isLast && (
                <View
                  style={[
                    s.line,
                    { backgroundColor: done ? accent : isDark ? c.auth.cardBorder : c.border.default },
                  ]}
                />
              )}
            </View>

            {/* Label */}
            <Text
              style={[
                s.label,
                {
                  color: done || active ? c.text.primary : c.text.placeholder,
                  fontWeight: active ? '700' : '500',
                },
              ]}
            >
              {STATUS_LABELS[step]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingVertical: spacing.sm },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start' },
  dotCol: { alignItems: 'center', width: 28 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: { width: 2, height: 24 },
  label: { fontSize: 13, marginLeft: spacing.sm, paddingTop: 1, marginBottom: 4 },
});
