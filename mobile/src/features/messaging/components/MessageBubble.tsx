import { Check, CheckCheck } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { radius, spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import type { Message } from '@/types';

interface Props {
  message: Message;
  isOwn: boolean;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, isOwn }: Props) {
  const c = useColors();
  const isDark = useIsDark();
  const accent = c.auth.golden;

  const ownBg = accent;
  const ownText = '#152018';
  const otherBg = isDark ? c.auth.card : c.neutral[100];
  const otherText = c.text.primary;
  const timeColor = isOwn ? 'rgba(21,32,24,0.55)' : c.text.secondary;

  return (
    <View
      style={[
        s.bubble,
        isOwn
          ? [s.bubbleOwn, { backgroundColor: ownBg }]
          : [s.bubbleTheirs, { backgroundColor: otherBg }],
      ]}
    >
      {message.image && (
        <Image
          source={{ uri: message.image }}
          style={s.image}
          contentFit="cover"
        />
      )}
      <View style={s.messageRow}>
        {!!message.content && (
          <Text
            style={[
              s.messageText,
              { color: isOwn ? ownText : otherText },
            ]}
          >
            {message.content}
          </Text>
        )}
        <View style={s.timeRow}>
          <Text style={[s.time, { color: timeColor }]}>
            {formatTime(message.created_at)}
          </Text>
          {isOwn &&
            (message.read_at ? (
              <CheckCheck size={14} color={c.auth.bg} />
            ) : (
              <Check size={14} color={timeColor} />
            ))}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 4,
    borderRadius: radius.lg + 2,
    marginBottom: spacing.xs + 2,
  },
  bubbleOwn: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: radius.sm,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: radius.sm,
  },
  messageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    flexShrink: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  time: {
    fontSize: 11,
    lineHeight: 16,
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: radius.lg,
    marginBottom: 4,
  },
});
