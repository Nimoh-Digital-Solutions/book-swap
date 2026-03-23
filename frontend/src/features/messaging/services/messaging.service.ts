/**
 * messaging.service.ts
 *
 * Thin API wrappers for messaging endpoints.
 * Consumed by TanStack Query hooks — never called directly from components.
 */
import { API } from '@configs/apiEndpoints';
import { http } from '@services';

import type {
  ChatMessage,
  MarkReadResponse,
  MeetupLocation,
  PaginatedMessages,
  SendMessagePayload,
} from '../types/messaging.types';

export const messagingService = {
  /** Fetch paginated messages for an exchange. */
  async listMessages(
    exchangeId: string,
    cursor?: string,
  ): Promise<PaginatedMessages> {
    const url = cursor ?? API.messaging.messages(exchangeId);
    const { data } = await http.get<PaginatedMessages>(url);
    return data;
  },

  /** Send a new message (text and/or image). */
  async sendMessage(
    exchangeId: string,
    payload: SendMessagePayload,
  ): Promise<ChatMessage> {
    const hasImage = payload.image instanceof File;

    if (hasImage) {
      const formData = new FormData();
      if (payload.content) formData.append('content', payload.content);
      formData.append('image', payload.image as File);
      const { data } = await http.post<ChatMessage>(
        API.messaging.messages(exchangeId),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    }

    const { data } = await http.post<ChatMessage>(
      API.messaging.messages(exchangeId),
      { content: payload.content },
    );
    return data;
  },

  /** Mark all unread messages in an exchange as read. */
  async markRead(exchangeId: string): Promise<MarkReadResponse> {
    const { data } = await http.post<MarkReadResponse>(
      API.messaging.markRead(exchangeId),
    );
    return data;
  },

  /** Fetch meetup suggestions near the midpoint of both users. */
  async getMeetupSuggestions(exchangeId: string): Promise<MeetupLocation[]> {
    const { data } = await http.get<MeetupLocation[]>(
      API.messaging.meetupSuggestions(exchangeId),
    );
    return data;
  },
};
