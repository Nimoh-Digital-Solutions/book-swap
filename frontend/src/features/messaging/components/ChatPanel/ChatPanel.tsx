import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Lock, MessageCircle } from 'lucide-react';

import { useChatWebSocket } from '../../hooks/useChatWebSocket';
import { useMarkMessagesRead } from '../../hooks/useMarkMessagesRead';
import { useMeetupSuggestions } from '../../hooks/useMeetupSuggestions';
import { useMessages } from '../../hooks/useMessages';
import { useSendMessage } from '../../hooks/useSendMessage';
import type { ChatMessage, MeetupLocation, PaginatedMessages } from '../../types/messaging.types';
import { ChatHeader } from '../ChatHeader/ChatHeader';
import { MeetupSuggestionPanel } from '../MeetupSuggestionPanel/MeetupSuggestionPanel';
import { MessageBubble } from '../MessageBubble/MessageBubble';
import { MessageInput } from '../MessageInput/MessageInput';
import { TypingIndicator } from '../TypingIndicator/TypingIndicator';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPING_TIMEOUT_MS = 3_000;
const TYPING_COOLDOWN_MS = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatPanelProps {
  exchangeId: string;
  currentUserId: string;
  partnerName: string;
  partnerAvatar: string | null;
  isReadOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatPanel({
  exchangeId,
  currentUserId,
  partnerName,
  partnerAvatar,
  isReadOnly = false,
}: ChatPanelProps): ReactElement {
  const { t } = useTranslation('messaging');

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showMeetup, setShowMeetup] = useState(false);

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Data hooks
  // ---------------------------------------------------------------------------
  const {
    data: messagesData,
    isLoading: messagesLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMessages(exchangeId);

  const sendMessageMutation = useSendMessage();
  const markReadMutation = useMarkMessagesRead();

  const { data: meetupLocations = [], isLoading: meetupsLoading } =
    useMeetupSuggestions(exchangeId);

  // ---------------------------------------------------------------------------
  // WebSocket
  // ---------------------------------------------------------------------------
  const {
    isConnected,
    isLocked,
    sendMessage: wsSendMessage,
    sendTyping: wsSendTyping,
    sendRead: wsSendRead,
  } = useChatWebSocket({
    exchangeId,
    enabled: !isReadOnly,
    onNewMessage: () => {
      // Auto-scroll to bottom on new messages
      scrollToBottom();
      // Mark as read
      markReadMutation.mutate(exchangeId);
      wsSendRead();
    },
    onTyping: (userId, username) => {
      if (userId === currentUserId) return;
      setTypingUser(username);
      // Clear after timeout
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => setTypingUser(null), TYPING_TIMEOUT_MS);
    },
    onLocked: () => {
      // Chat locked — UI will reflect via isLocked
    },
  });

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------
  const messages = useMemo<ChatMessage[]>(() => {
    const data = messagesData as { pages: PaginatedMessages[] } | undefined;
    return data?.pages.flatMap((page) => page.results) ?? [];
  }, [messagesData]);

  const chatDisabled = isReadOnly || isLocked;

  // ---------------------------------------------------------------------------
  // Scroll helpers
  // ---------------------------------------------------------------------------
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  // Auto-scroll on first load
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark messages as read on mount
  useEffect(() => {
    if (messages.length > 0) {
      markReadMutation.mutate(exchangeId);
    }
  }, [exchangeId, messages.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleSend = useCallback(
    (content: string, image?: File) => {
      // Always use REST for sending (reliable, handles images)
      sendMessageMutation.mutate(
        { exchangeId, payload: { content: content || undefined, image } },
        {
          onSuccess: () => {
            scrollToBottom();
          },
        },
      );
      // Also broadcast via WS for real-time (text only, no image via WS)
      if (content && !image) {
        wsSendMessage(content);
      }
    },
    [exchangeId, sendMessageMutation, wsSendMessage, scrollToBottom],
  );

  const handleTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingSentRef.current > TYPING_COOLDOWN_MS) {
      wsSendTyping();
      lastTypingSentRef.current = now;
    }
  }, [wsSendTyping]);

  const handleMeetupSelect = useCallback(
    (location: MeetupLocation) => {
      const text = t('meetup.suggestionMessage', {
        name: location.name,
        distance: location.distance_km?.toFixed(1) ?? '?',
      });
      setShowMeetup(false);
      // Auto-send the meetup suggestion message
      handleSend(text);
    },
    [t, handleSend],
  );

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    // Load older messages when scrolled near top
    if (container.scrollTop < 50 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="bg-[#1A251D] rounded-xl border border-[#28382D] overflow-hidden flex flex-col max-h-[600px]">
      {/* Header */}
      <ChatHeader
        partnerName={partnerName}
        partnerAvatar={partnerAvatar}
        isConnected={isConnected}
        onSuggestMeetup={() => setShowMeetup(!showMeetup)}
        showMeetupButton={!chatDisabled}
      />

      {/* Read-only banner */}
      {chatDisabled && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#28382D]/50 text-xs text-[#8C9C92]">
          <Lock className="w-3 h-3" aria-hidden="true" />
          {t('chat.readOnly')}
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-3 min-h-[200px]"
      >
        {/* Load more button */}
        {hasNextPage && (
          <div className="text-center mb-3">
            <button
              type="button"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-xs text-[#E4B643] hover:underline disabled:opacity-50"
            >
              {isFetchingNextPage ? '...' : t('chat.loadMore')}
            </button>
          </div>
        )}

        {/* Loading */}
        {messagesLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-pulse text-sm text-[#8C9C92]">{t('chat.connecting')}</div>
          </div>
        )}

        {/* Empty state */}
        {!messagesLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-[#8C9C92]">
            <MessageCircle className="w-10 h-10 mb-3 opacity-30" aria-hidden="true" />
            <p className="text-sm">{t('chat.noMessages')}</p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender.id === currentUserId}
          />
        ))}

        {/* Typing indicator */}
        {typingUser && <TypingIndicator username={typingUser} />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Meetup suggestion panel */}
      {showMeetup && (
        <MeetupSuggestionPanel
          locations={meetupLocations}
          isLoading={meetupsLoading}
          onSelect={handleMeetupSelect}
          onClose={() => setShowMeetup(false)}
        />
      )}

      {/* Input */}
      {!chatDisabled && (
        <MessageInput
          onSend={handleSend}
          onTyping={handleTyping}
          disabled={sendMessageMutation.isPending}
        />
      )}
    </div>
  );
}
