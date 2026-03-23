/**
 * Messaging feature public API
 *
 * Import from '@features/messaging' in consuming code — never reach
 * into sub-directories directly from outside this feature.
 *
 * @example
 * import { useMessages, useSendMessage, useChatWebSocket, ChatPanel } from '@features/messaging';
 */

// Components
export { ChatHeader } from './components/ChatHeader/ChatHeader';
export { ChatPanel } from './components/ChatPanel/ChatPanel';
export { MeetupSuggestionPanel } from './components/MeetupSuggestionPanel/MeetupSuggestionPanel';
export { MessageBubble } from './components/MessageBubble/MessageBubble';
export { MessageInput } from './components/MessageInput/MessageInput';
export { TypingIndicator } from './components/TypingIndicator/TypingIndicator';

// Hooks
export { messagingKeys } from './hooks/messagingKeys';
export type {
  UseChatWebSocketOptions,
  UseChatWebSocketReturn,
} from './hooks/useChatWebSocket';
export { useChatWebSocket } from './hooks/useChatWebSocket';
export { useMarkMessagesRead } from './hooks/useMarkMessagesRead';
export { useMeetupSuggestions } from './hooks/useMeetupSuggestions';
export { useMessages } from './hooks/useMessages';
export { useSendMessage } from './hooks/useSendMessage';

// Service
export { messagingService } from './services/messaging.service';

// Schemas
export type { SendMessageFormValues } from './schemas/messaging.schemas';
export { sendMessageSchema } from './schemas/messaging.schemas';

// Types
export type {
  ChatMessage,
  ChatWsMessage,
  ChatWsOutbound,
  MarkReadResponse,
  MeetupCategory,
  MeetupLocation,
  MessageSender,
  PaginatedMessages,
  SendMessagePayload,
} from './types/messaging.types';
