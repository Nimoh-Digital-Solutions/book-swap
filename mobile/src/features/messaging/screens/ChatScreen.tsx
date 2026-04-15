import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import { wsManager } from '@/services/websocket';
import { useAuthStore } from '@/stores/authStore';
import type { MessagesStackParamList } from '@/navigation/types';
import type { Message } from '@/types';

type Route = RouteProp<MessagesStackParamList, 'Chat'>;

export function ChatScreen() {
  const { t } = useTranslation();
  const { params } = useRoute<Route>();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList<Message>>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', params.exchangeId],
    queryFn: async () => {
      const { data } = await http.get<{ results: Message[] }>(
        API.messaging.messages(params.exchangeId),
      );
      return data.results;
    },
  });

  useEffect(() => {
    wsManager.connect(`/ws/chat/${params.exchangeId}/`);

    const unsubscribe = wsManager.on('chat_message', (data: unknown) => {
      const payload = data as { message?: Message };
      if (!payload.message) return;
      queryClient.setQueryData<Message[]>(
        ['messages', params.exchangeId],
        (prev = []) => [...prev, payload.message!],
      );
    });

    return () => {
      unsubscribe();
      wsManager.disconnect();
      if (useAuthStore.getState().isAuthenticated) {
        wsManager.connect('/ws/notifications/');
      }
    };
  }, [params.exchangeId, queryClient]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await http.post<Message>(
        API.messaging.messages(params.exchangeId),
        { content },
      );
      return data;
    },
    onSuccess: (newMessage) => {
      queryClient.setQueryData<Message[]>(
        ['messages', params.exchangeId],
        (prev = []) => [...prev, newMessage],
      );
      setText('');
    },
  });

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMutation.mutate(trimmed);
  }, [text, sendMutation]);

  useEffect(() => {
    http.post(API.messaging.markRead(params.exchangeId)).catch(() => {});
  }, [params.exchangeId]);

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isOwn = item.sender.id === currentUser?.id;
      return (
        <View
          style={[
            styles.messageBubble,
            isOwn ? styles.ownMessage : styles.otherMessage,
          ]}
        >
          {!isOwn && (
            <Text style={styles.senderName}>
              {item.sender.first_name}
            </Text>
          )}
          <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.timestamp, isOwn && styles.ownTimestamp]}>
            {new Date(item.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      );
    },
    [currentUser?.id],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        ListEmptyComponent={
          isLoading ? null : (
            <Text style={styles.emptyText}>Send the first message!</Text>
          )
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sendMutation.isPending}
        >
          <Ionicons
            name="send"
            size={20}
            color={text.trim() ? '#fff' : '#9CA3AF'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  messagesList: { padding: 16, gap: 8 },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  senderName: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 2 },
  messageText: { fontSize: 15, color: '#1F2937', lineHeight: 20 },
  ownMessageText: { color: '#fff' },
  timestamp: { fontSize: 11, color: '#9CA3AF', marginTop: 4, alignSelf: 'flex-end' },
  ownTimestamp: { color: 'rgba(255,255,255,0.7)' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#E5E7EB' },
});
