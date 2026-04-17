import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react-native';

import { spacing } from '@/constants/theme';
import { useColors, useIsDark } from '@/hooks/useColors';
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

  const { data: messages = [], isLoading } = useMessages(params.exchangeId);
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
    (content: string) => {
      sendMutation.mutate(
        { exchangeId: params.exchangeId, content },
        {
          onSuccess: () => {
            isNearBottom.current = true;
            setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
          },
        },
      );
    },
    [params.exchangeId, sendMutation],
  );

  const handleMeetupSelect = useCallback(
    (loc: { name: string }) => {
      setShowMeetup(false);
      handleSend(t('messaging.meetupSuggestion', {
        defaultValue: "Let's meet at {{name}}!",
        name: loc.name,
      }));
    },
    [handleSend, t],
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

  if (isLoading) {
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
          <ActivityIndicator size="large" color={c.auth.golden} />
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
});
