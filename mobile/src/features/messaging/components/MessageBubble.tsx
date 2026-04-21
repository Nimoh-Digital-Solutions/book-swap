import { Check, CheckCheck, MapPin } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { Image } from 'expo-image';

import { radius, spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import type { Message } from '@/types';

interface Props {
  message: Message;
  isOwn: boolean;
}

const MEETUP_RE = /^\[MEETUP](.+?)(?:\|(.*))?$/;

function parseMeetup(content: string): { name: string; address: string } | null {
  const m = content.match(MEETUP_RE);
  if (!m) return null;
  return { name: m[1] ?? '', address: m[2] ?? '' };
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, isOwn }: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const accent = c.auth.golden;

  const ownBg = accent;
  const ownText = '#152018';
  const otherBg = isDark ? c.auth.card : c.neutral[100];
  const otherText = c.text.primary;
  const timeColor = isOwn ? 'rgba(21,32,24,0.55)' : c.text.secondary;

  const meetup = message.content ? parseMeetup(message.content) : null;

  const entering = isOwn
    ? SlideInRight.duration(200).springify().damping(18)
    : SlideInLeft.duration(200).springify().damping(18);

  return (
    <Animated.View
      entering={entering}
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

      {meetup ? (
        <View>
          <View style={s.meetupRow}>
            <View style={[s.meetupIcon, { backgroundColor: isOwn ? 'rgba(0,0,0,0.1)' : (isDark ? c.auth.cardBorder : c.neutral[200]) }]}>
              <MapPin size={16} color={isOwn ? ownText : accent} />
            </View>
            <View style={s.meetupContent}>
              <Text style={[s.meetupLabel, { color: isOwn ? 'rgba(21,32,24,0.6)' : c.text.secondary }]}>
                {t('messaging.meetupProposal', 'Meetup suggestion')}
              </Text>
              <Text style={[s.meetupName, { color: isOwn ? ownText : otherText }]}>
                {meetup.name}
              </Text>
              {!!meetup.address && (
                <Text
                  style={[s.meetupAddr, { color: isOwn ? 'rgba(21,32,24,0.65)' : c.text.secondary }]}
                  numberOfLines={2}
                >
                  {meetup.address}
                </Text>
              )}
            </View>
          </View>
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
      ) : (
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
      )}
    </Animated.View>
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
    marginTop: 2,
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
  meetupRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: 4,
  },
  meetupIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  meetupContent: {
    flex: 1,
  },
  meetupLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  meetupName: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  meetupAddr: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
});
