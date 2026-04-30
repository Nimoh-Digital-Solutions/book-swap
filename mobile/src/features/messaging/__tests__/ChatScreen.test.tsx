/**
 * ChatScreen tests (AUD-M-702)
 *
 * Verifies the page-level branching of the chat surface:
 *   - loading state shows the branded loader
 *   - error state shows a retry CTA that triggers refetch
 *   - empty state shows the "no messages yet" copy
 *   - messages list renders bubbles in order
 *   - read-only banner appears when the exchange is not writable
 *   - sending a message dispatches the mutation
 */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import type { Message } from '@/types';

// ---------------------------------------------------------------------------
// Hook + child-component mocks
// ---------------------------------------------------------------------------

const mockUseMessages = jest.fn();
const mockUseSendMessage = jest.fn();
const mockUseMarkRead = jest.fn();
const mockUseExchangeDetail = jest.fn();
const mockUseChatWebSocket = jest.fn();
const mockUseMeetupSuggestions = jest.fn();
const mockRequireVerified = jest.fn((cb: () => void) => cb());

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { exchangeId: 'exch_001', partnerName: 'bookworm' } }),
  useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }),
  useFocusEffect: (cb: () => void) => {
    const React = require('react');
    React.useEffect(cb, [cb]);
  },
}));

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    text: { primary: '#fff', secondary: '#aaa', placeholder: '#666' },
    auth: { bg: '#152018', card: '#1A251D', cardBorder: '#28382D', golden: '#E4B643' },
    neutral: { 50: '#fff' },
    surface: { white: '#fff' },
    status: { error: '#ef4444' },
  }),
  useIsDark: () => true,
}));

jest.mock('@/lib/haptics', () => ({
  hapticImpact: jest.fn(),
}));

jest.mock('@/components/Toast', () => ({
  showErrorToast: jest.fn(),
}));

jest.mock('@/components/BrandedLoader', () => ({
  BrandedLoader: () => {
    const { View } = require('react-native');
    return <View testID="branded-loader" />;
  },
}));

jest.mock('@/hooks/useEmailVerificationGate', () => ({
  useEmailVerificationGate: () => ({ requireVerified: mockRequireVerified }),
}));

jest.mock('@/stores/authStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string } }) => unknown) =>
    selector({ user: { id: 'usr_test_001' } }),
}));

jest.mock('@/features/exchanges/hooks/useExchanges', () => ({
  useExchangeDetail: (...args: unknown[]) => mockUseExchangeDetail(...args),
}));

jest.mock('../hooks/useMessages', () => ({
  useMessages: (...args: unknown[]) => mockUseMessages(...args),
  useSendMessage: () => mockUseSendMessage(),
  useMarkMessagesRead: () => mockUseMarkRead(),
}));

jest.mock('../hooks/useChatWebSocket', () => ({
  useChatWebSocket: (...args: unknown[]) => mockUseChatWebSocket(...args),
}));

jest.mock('../hooks/useMeetupSuggestions', () => ({
  useMeetupSuggestions: (...args: unknown[]) => mockUseMeetupSuggestions(...args),
}));

// Render child components as testIDs so we can assert without dragging their
// implementations into the test.
jest.mock('../components/ChatHeader', () => ({
  ChatHeader: ({ partnerName }: { partnerName: string }) => {
    const { Text, View } = require('react-native');
    return (
      <View testID="chat-header">
        <Text>{partnerName}</Text>
      </View>
    );
  },
}));

jest.mock('../components/MessageBubble', () => ({
  MessageBubble: ({ message }: { message: { id: string; content: string } }) => {
    const { Text, View } = require('react-native');
    return (
      <View testID={`message-${message.id}`}>
        <Text>{message.content}</Text>
      </View>
    );
  },
}));

jest.mock('../components/MessageInput', () => ({
  MessageInput: ({ onSend, disabled }: { onSend: (s: string) => void; disabled: boolean }) => {
    const { Pressable, Text, View } = require('react-native');
    return (
      <View testID="message-input" accessibilityState={{ disabled }}>
        <Pressable testID="send-button" onPress={() => onSend('hello world')}>
          <Text>send</Text>
        </Pressable>
      </View>
    );
  },
}));

jest.mock('../components/MeetupSuggestionPanel', () => ({
  MeetupSuggestionPanel: ({ visible }: { visible: boolean }) =>
    visible ? (() => {
      const { View } = require('react-native');
      return <View testID="meetup-panel" />;
    })() : null,
}));

jest.mock('../components/ReadOnlyBanner', () => ({
  ReadOnlyBanner: () => {
    const { View } = require('react-native');
    return <View testID="readonly-banner" />;
  },
}));

jest.mock('../components/TypingIndicator', () => ({
  TypingIndicator: ({ username }: { username: string }) => {
    const { Text, View } = require('react-native');
    return (
      <View testID="typing-indicator">
        <Text>{username}</Text>
      </View>
    );
  },
}));

// Import AFTER mocks
import { ChatScreen } from '../screens/ChatScreen';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseExchange = {
  id: 'exch_001',
  status: 'active',
  owner: { id: 'usr_owner', username: 'bookworm', avatar: null },
  requester: { id: 'usr_test_001', username: 'testuser', avatar: null },
};

const messages: Message[] = [
  {
    id: 'msg_001',
    exchange: 'exch_001',
    sender: { id: 'usr_test_001', username: 'testuser', avatar: null },
    content: 'Hello!',
    image: null,
    read_at: null,
    created_at: '2025-07-16T10:00:00Z',
  },
  {
    id: 'msg_002',
    exchange: 'exch_001',
    sender: { id: 'usr_owner', username: 'bookworm', avatar: null },
    content: 'Hi back!',
    image: null,
    read_at: null,
    created_at: '2025-07-16T10:01:00Z',
  },
];

function applyDefaults() {
  mockUseExchangeDetail.mockReturnValue({ data: baseExchange });
  mockUseMessages.mockReturnValue({
    data: messages,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    isFetching: false,
  });
  mockUseSendMessage.mockReturnValue({ mutate: jest.fn(), isPending: false });
  mockUseMarkRead.mockReturnValue({ mutate: jest.fn() });
  mockUseChatWebSocket.mockReturnValue({
    isConnected: true,
    isLocked: false,
    typingUser: null,
    sendTyping: jest.fn(),
  });
  mockUseMeetupSuggestions.mockReturnValue({ data: [], isLoading: false });
}

beforeEach(() => {
  jest.clearAllMocks();
  applyDefaults();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ChatScreen', () => {
  it('renders the branded loader while messages are loading', () => {
    mockUseMessages.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
      isFetching: false,
    });
    const { getByTestId } = render(<ChatScreen />);
    expect(getByTestId('branded-loader')).toBeTruthy();
    expect(getByTestId('chat-header')).toBeTruthy();
  });

  it('renders an error state with a retry button', () => {
    const refetch = jest.fn();
    mockUseMessages.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
      refetch,
      isFetching: false,
    });
    const { getByText } = render(<ChatScreen />);
    refetch.mockClear();
    fireEvent.press(getByText('common.retry'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders the empty state when no messages exist', () => {
    mockUseMessages.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isFetching: false,
    });
    const { getByText } = render(<ChatScreen />);
    expect(getByText('messaging.noMessages')).toBeTruthy();
    expect(getByText('messaging.noMessagesHint')).toBeTruthy();
  });

  it('renders message bubbles for each message', () => {
    const { getByTestId } = render(<ChatScreen />);
    expect(getByTestId('message-msg_001')).toBeTruthy();
    expect(getByTestId('message-msg_002')).toBeTruthy();
  });

  it('shows the message input when the chat is writable', () => {
    const { getByTestId, queryByTestId } = render(<ChatScreen />);
    expect(getByTestId('message-input')).toBeTruthy();
    expect(queryByTestId('readonly-banner')).toBeNull();
  });

  it('shows the read-only banner and hides the input when the exchange is not writable', () => {
    mockUseExchangeDetail.mockReturnValue({
      data: { ...baseExchange, status: 'completed' },
    });
    const { getByTestId, queryByTestId } = render(<ChatScreen />);
    expect(getByTestId('readonly-banner')).toBeTruthy();
    expect(queryByTestId('message-input')).toBeNull();
  });

  it('shows the read-only banner when the WebSocket reports the chat is locked', () => {
    mockUseChatWebSocket.mockReturnValue({
      isConnected: true,
      isLocked: true,
      typingUser: null,
      sendTyping: jest.fn(),
    });
    const { getAllByTestId, queryByTestId } = render(<ChatScreen />);
    expect(getAllByTestId('readonly-banner').length).toBeGreaterThanOrEqual(1);
    expect(queryByTestId('message-input')).toBeNull();
  });

  it('dispatches the send mutation through the email-verification gate', () => {
    const mutate = jest.fn();
    mockUseSendMessage.mockReturnValue({ mutate, isPending: false });

    const { getByTestId } = render(<ChatScreen />);
    fireEvent.press(getByTestId('send-button'));

    expect(mockRequireVerified).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        exchangeId: 'exch_001',
        content: 'hello world',
      }),
      expect.any(Object),
    );
  });

  it('renders the typing indicator when the partner is typing', () => {
    mockUseChatWebSocket.mockReturnValue({
      isConnected: true,
      isLocked: false,
      typingUser: 'bookworm',
      sendTyping: jest.fn(),
    });
    const { getByTestId } = render(<ChatScreen />);
    expect(getByTestId('typing-indicator')).toBeTruthy();
  });
});
