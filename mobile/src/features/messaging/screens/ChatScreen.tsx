import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react-native';

import { spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
import { hapticImpact } from '@/lib/haptics';
import type { MessagesStackParamList } from '@/navigation/types';
import type { Message } from '@/types';

import { ChatHeader } from '../components/ChatHeader';
import { MessageBubble } from '../components/MessageBubble';
import { MessageInput } from '../components/MessageInput';
import { MeetupSuggestionPanel } from '../components/MeetupSuggestionPanel';
import { ReadOnlyBanner } from '../components/ReadOnlyBanner';
import { TypingIndicator } from '../components/TypingIndicator';

import { useChatWebSocket } from '../hooks/useChatWebSocket';
import { useMarkMessagesRead, useMessages, useSendMessage } from '../hooks/useMessages';
import { useMeetupSuggestions } from '../hooks/useMeetupSuggestions';
import { useAuthStore } from '@/stores/authStore';
import { useExchangeDetail } from '@/features/exchanges/hooks/useExchanges';
import { showErrorToast } from '@/components/Toast';
import { BrandedLoader } from '@/components/BrandedLoader';
import { useEmailVerificationGate } from '@/hooks/useEmailVerificationGate';

type Route = RouteProp<MessagesStackParamList, 'Chat'>;

const CHAT_WRITABLE = new Set(['active', 'swap_confirmed']);

export function ChatScreen() {
  const { t } = useTranslation();
  const { params } = useRoute<Route>();
  const c = useColors();
  const isDark = useIsDark();
  const currentUser = useAuthStore((s) => s.user);

  const { data: exchangeDetail } = useExchangeDetail(params.exchangeId);
  const isOwner = exchangeDetail ? currentUser?.id === exchangeDetail.owner.id : false;
  const { requireVerified } = useEmailVerificationGate();
  const other = exchangeDetail
    ? (isOwner ? exchangeDetail.requester : exchangeDetail.owner)
    : null;

  const partnerName = params.partnerName ?? other?.username ?? '...';
  const partnerAvatar = params.partnerAvatar ?? other?.avatar ?? null;
  const exchangeStatus = params.exchangeStatus ?? exchangeDetail?.status ?? 'active';

  const bg = isDark ? c.auth.bg : c.neutral[50];
  const isReadOnly = !CHAT_WRITABLE.has(exchangeStatus);

  const listRef = useRef<FlatList<Message>>(null);
  const isNearBottom = useRef(true);
  const [showMeetup, setShowMeetup] = useState(false);
  const [androidKbHeight, setAndroidKbHeight] = useState(0);

  const {
    data: messages = [],
    isLoading,
    isError,
    refetch: refetchMessages,
    isFetching,
  } = useMessages(params.exchangeId);
  const sendMutation = useSendMessage();
  const markRead = useMarkMessagesRead();
  const { data: meetupLocations = [], isLoading: meetupsLoading } =
    useMeetupSuggestions(params.exchangeId);

  const {
    isConnected,
    isLocked,
    typingUser,
    sendTyping,
  } = useChatWebSocket({
    exchangeId: params.exchangeId,
    enabled: !isReadOnly,
  });

  const chatDisabled = isReadOnly || isLocked;

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setAndroidKbHeight(e.endCoordinates.height + 10);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setAndroidKbHeight(0);
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      markRead.mutate(params.exchangeId);
    }
  }, [params.exchangeId, messages.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = useCallback(
    (content: string, imageUri?: string) => {
      void hapticImpact('light');
      requireVerified(() => {
        sendMutation.mutate(
          { exchangeId: params.exchangeId, content: content || undefined, imageUri },
          {
            onSuccess: () => {
              isNearBottom.current = true;
              setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
            },
            onError: () => {
              showErrorToast(
                t('messaging.sendFailed', 'Message could not be sent. Try again.'),
              );
            },
          },
        );
      });
    },
    [params.exchangeId, sendMutation, t, requireVerified],
  );

  const handleMeetupSelect = useCallback(
    (loc: { name: string; address?: string }) => {
      setShowMeetup(false);
      const meetupContent = `[MEETUP]${loc.name}|${loc.address ?? ''}`;
      handleSend(meetupContent);
    },
    [handleSend],
  );

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <MessageBubble
        message={item}
        isOwn={item.sender.id === currentUser?.id}
      />
    ),
    [currentUser?.id],
  );

  if (isLoading && !isError) {
    return (
      <View style={[s.root, { backgroundColor: bg }]}>
        <ChatHeader
          partnerName={partnerName}
          partnerAvatar={partnerAvatar}
          isConnected={isConnected}
          onSuggestMeetup={() => {}}
          showMeetupButton={false}
        />
        <View style={s.loadingCenter}>
          <BrandedLoader size="lg" fill={false} />
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[s.root, { backgroundColor: bg }]}>
        <ChatHeader
          partnerName={partnerName}
          partnerAvatar={partnerAvatar}
          isConnected={isConnected}
          onSuggestMeetup={() => {}}
          showMeetupButton={false}
        />
        <View style={s.errorWrap}>
          <Text style={[s.errorTitle, { color: c.text.primary }]}>
            {t('messaging.loadFailedTitle', 'Could not load messages')}
          </Text>
          <Text style={[s.errorBody, { color: c.text.secondary }]}>
            {t('messaging.loadFailedBody', 'Check your connection and try again.')}
          </Text>
          <Pressable
            onPress={() => refetchMessages()}
            disabled={isFetching}
            style={({ pressed }) => [
              s.retryBtn,
              {
                backgroundColor: c.auth.golden,
                opacity: isFetching || pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('common.retry', 'Retry')}
          >
            {isFetching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.retryBtnText}>{t('common.retry', 'Retry')}</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <ChatHeader
        partnerName={partnerName}
        partnerAvatar={partnerAvatar}
        isConnected={isConnected}
        onSuggestMeetup={() => setShowMeetup(true)}
        showMeetupButton={!chatDisabled}
      />

      <KeyboardAvoidingView
        style={[
          s.flex,
          Platform.OS === 'android' && androidKbHeight > 0 && { paddingBottom: androidKbHeight },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        enabled={Platform.OS === 'ios'}
      >
        {chatDisabled && <ReadOnlyBanner />}

        {messages.length === 0 ? (
          <View style={s.emptyContainer}>
            <MessageCircle size={48} color={c.text.placeholder} style={{ opacity: 0.3 }} />
            <Text style={[s.emptyTitle, { color: c.text.primary }]}>
              {t('messaging.noMessages', 'No messages yet')}
            </Text>
            <Text style={[s.emptyHint, { color: c.text.secondary }]}>
              {t('messaging.noMessagesHint', 'Send the first message!')}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={s.list}
            onContentSizeChange={() => {
              if (isNearBottom.current) {
                listRef.current?.scrollToEnd({ animated: true });
              }
            }}
            onScroll={(e) => {
              const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
              isNearBottom.current =
                contentOffset.y + layoutMeasurement.height >= contentSize.height - 80;
            }}
            scrollEventThrottle={100}
            windowSize={7}
            maxToRenderPerBatch={15}
            removeClippedSubviews
          />
        )}

        {typingUser && <TypingIndicator username={typingUser} />}

        {!chatDisabled && (
          <MessageInput
            onSend={handleSend}
            onTyping={sendTyping}
            disabled={sendMutation.isPending}
          />
        )}

        {chatDisabled && !isReadOnly && isLocked && (
          <ReadOnlyBanner />
        )}
      </KeyboardAvoidingView>

      <MeetupSuggestionPanel
        visible={showMeetup}
        locations={meetupLocations}
        isLoading={meetupsLoading}
        onSelect={handleMeetupSelect}
        onClose={() => setShowMeetup(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  emptyHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  errorWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  errorTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  errorBody: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: spacing.sm },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
    minWidth: 120,
    alignItems: 'center',
  },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
