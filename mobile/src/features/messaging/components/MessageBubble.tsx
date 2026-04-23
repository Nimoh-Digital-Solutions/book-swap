import { Check, CheckCheck, ImageOff, MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { Image } from 'expo-image';

import { radius, spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import { resolveMediaUrl } from '@/lib/resolveMediaUrl';
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

export const MessageBubble = React.memo(function MessageBubble({ message, isOwn }: Props) {
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
  const imageUrl = resolveMediaUrl(message.image);
  const hasImage = !!imageUrl;
  const hasText = !!message.content && !meetup;

  const entering = isOwn
    ? SlideInRight.duration(200).springify().damping(18)
    : SlideInLeft.duration(200).springify().damping(18);

  return (
    <Animated.View
      entering={entering}
      style={[
        s.bubble,
        hasImage && s.bubbleWithImage,
        isOwn
          ? [s.bubbleOwn, { backgroundColor: ownBg }]
          : [s.bubbleTheirs, { backgroundColor: otherBg }],
      ]}
    >
      {hasImage && (
        <ChatImage
          uri={imageUrl}
          isOwn={isOwn}
          bubbleBg={isOwn ? ownBg : otherBg}
        />
      )}

      {meetup ? (
        <MeetupCard
          meetup={meetup}
          isOwn={isOwn}
          ownText={ownText}
          otherText={otherText}
          timeColor={timeColor}
          accent={accent}
          isDark={isDark}
          readAt={message.read_at}
          createdAt={message.created_at}
          c={c}
          t={t}
        />
      ) : (
        <View style={hasImage ? s.textBelowImage : undefined}>
          <View style={s.messageRow}>
            {hasText && (
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
              {isOwn && <ReadTick readAt={message.read_at} timeColor={timeColor} bgColor={c.auth.bg} />}
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  );
}, (prev, next) => prev.message.id === next.message.id && prev.message.read_at === next.message.read_at);

function ReadTick({ readAt, timeColor, bgColor }: { readAt: string | null; timeColor: string; bgColor: string }) {
  return readAt ? (
    <CheckCheck size={14} color={bgColor} />
  ) : (
    <Check size={14} color={timeColor} />
  );
}

function ChatImage({ uri, isOwn, bubbleBg }: { uri: string; isOwn: boolean; bubbleBg: string }) {
  const { t } = useTranslation();
  const c = useColors();
  const isDark = useIsDark();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const placeholderBg = isOwn ? 'rgba(0,0,0,0.08)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)');

  if (error) {
    return (
      <View style={[s.imagePlaceholder, { backgroundColor: placeholderBg }]}>
        <ImageOff size={24} color={isOwn ? 'rgba(21,32,24,0.3)' : c.text.placeholder} />
        <Text style={[s.imageErrorText, { color: isOwn ? 'rgba(21,32,24,0.4)' : c.text.placeholder }]}>
          {t('messaging.imageUnavailable', 'Image unavailable')}
        </Text>
      </View>
    );
  }

  return (
    <View style={s.imageContainer}>
      {loading && (
        <View style={[s.imagePlaceholder, s.imageLoading, { backgroundColor: placeholderBg }]}>
          <ActivityIndicator size="small" color={isOwn ? 'rgba(21,32,24,0.4)' : c.text.placeholder} />
        </View>
      )}
      <Pressable>
        <Image
          source={{ uri }}
          style={s.image}
          contentFit="cover"
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          recyclingKey={uri}
        />
      </Pressable>
    </View>
  );
}

interface MeetupCardProps {
  meetup: { name: string; address: string };
  isOwn: boolean;
  ownText: string;
  otherText: string;
  timeColor: string;
  accent: string;
  isDark: boolean;
  readAt: string | null;
  createdAt: string;
  c: ReturnType<typeof useColors>;
  t: ReturnType<typeof useTranslation>['t'];
}

function MeetupCard({ meetup, isOwn, ownText, otherText, timeColor, accent, isDark, readAt, createdAt, c, t }: MeetupCardProps) {
  const cardBg = isOwn ? 'rgba(0,0,0,0.06)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)');

  return (
    <View>
      <View style={[s.meetupCard, { backgroundColor: cardBg }]}>
        <View style={[s.meetupIcon, { backgroundColor: isOwn ? 'rgba(0,0,0,0.1)' : (isDark ? c.auth.cardBorder : c.neutral[200]) }]}>
          <MapPin size={20} color={isOwn ? ownText : accent} />
        </View>
        <View style={s.meetupContent}>
          <Text style={[s.meetupLabel, { color: isOwn ? 'rgba(21,32,24,0.55)' : c.text.secondary }]}>
            {t('messaging.meetupProposal', 'Meetup suggestion')}
          </Text>
          <Text style={[s.meetupName, { color: isOwn ? ownText : otherText }]} numberOfLines={2}>
            {meetup.name}
          </Text>
          {!!meetup.address && (
            <Text
              style={[s.meetupAddr, { color: isOwn ? 'rgba(21,32,24,0.6)' : c.text.secondary }]}
              numberOfLines={2}
            >
              {meetup.address}
            </Text>
          )}
        </View>
      </View>
      <View style={s.timeRow}>
        <Text style={[s.time, { color: timeColor }]}>
          {formatTime(createdAt)}
        </Text>
        {isOwn && <ReadTick readAt={readAt} timeColor={timeColor} bgColor={c.auth.bg} />}
      </View>
    </View>
  );
}

const IMAGE_WIDTH = 220;
const IMAGE_HEIGHT = 180;

const s = StyleSheet.create({
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 4,
    borderRadius: radius.lg + 2,
    marginBottom: spacing.xs + 2,
  },
  bubbleWithImage: {
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    overflow: 'hidden',
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
  textBelowImage: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
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
  imageContainer: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  image: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },
  imagePlaceholder: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  imageLoading: {
    position: 'absolute',
    zIndex: 1,
    marginBottom: 0,
    borderRadius: 0,
  },
  imageErrorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  meetupCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.sm + 2,
    marginBottom: spacing.xs,
    minWidth: 200,
  },
  meetupIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    marginBottom: 3,
  },
  meetupName: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  meetupAddr: {
    fontSize: 13,
    lineHeight: 17,
    marginTop: 2,
  },
});
