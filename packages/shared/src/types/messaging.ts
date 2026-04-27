export interface MessageSender {
  id: string;
  username: string;
  avatar: string | null;
}

export interface ChatMessage {
  id: string;
  exchange: string;
  sender: MessageSender;
  content: string;
  image: string | null;
  read_at: string | null;
  created_at: string;
}

export interface PaginatedMessages {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChatMessage[];
}

export type MeetupCategory = 'library' | 'cafe' | 'park' | 'station';

export interface MeetupLocation {
  id: string;
  name: string;
  address: string;
  category: MeetupCategory;
  city: string;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | null;
}

// WebSocket inbound messages
export interface WsChatMessage {
  type: 'chat.message';
  message: ChatMessage;
}

export interface WsChatTyping {
  type: 'chat.typing';
  user_id: string;
  username: string;
}

export interface WsChatRead {
  type: 'chat.read';
  user_id: string;
  read_at: string;
}

export interface WsChatLocked {
  type: 'chat.locked';
  message: string;
}

export interface WsChatError {
  type: 'chat.error';
  message: string;
}

export type ChatWsMessage =
  | WsChatMessage
  | WsChatTyping
  | WsChatRead
  | WsChatLocked
  | WsChatError;

// WebSocket outbound actions
export interface WsSendMessage {
  type: 'chat.message';
  content: string;
}

export interface WsSendTyping {
  type: 'chat.typing';
}

export interface WsSendRead {
  type: 'chat.read';
}

export type ChatWsOutbound = WsSendMessage | WsSendTyping | WsSendRead;
