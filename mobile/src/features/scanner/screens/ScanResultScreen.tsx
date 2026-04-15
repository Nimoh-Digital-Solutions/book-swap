import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import type { ScanStackParamList } from '@/navigation/types';

type Route = RouteProp<ScanStackParamList, 'ScanResult'>;
type Nav = NativeStackNavigationProp<ScanStackParamList, 'ScanResult'>;

export function ScanResultScreen() {
  const { t } = useTranslation();
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['isbn-lookup', params.isbn],
    queryFn: async () => {
      const { data: result } = await http.get(API.books.isbnLookup, {
        params: { isbn: params.isbn },
      });
      return result as {
        title: string;
        author: string;
        isbn: string;
        cover_url?: string;
        description?: string;
      };
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Looking up ISBN {params.isbn}...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t('common.error')}</Text>
        <Text style={styles.subText}>No results found for ISBN {params.isbn}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            navigation.navigate('AddBook', { isbn: params.isbn })
          }
        >
          <Text style={styles.buttonText}>Add Manually</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {data.cover_url && (
        <Image source={{ uri: data.cover_url }} style={styles.cover} />
      )}
      <Text style={styles.title}>{data.title}</Text>
      <Text style={styles.author}>{data.author}</Text>
      <Text style={styles.isbn}>ISBN: {data.isbn}</Text>
      {data.description && (
        <Text style={styles.description} numberOfLines={4}>
          {data.description}
        </Text>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          navigation.navigate('AddBook', {
            isbn: data.isbn,
            title: data.title,
            author: data.author,
          })
        }
      >
        <Text style={styles.addButtonText}>{t('books.addBook')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  cover: { width: 160, height: 240, borderRadius: 8, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  author: { fontSize: 16, color: '#6B7280', marginBottom: 8 },
  isbn: { fontSize: 14, color: '#9CA3AF', marginBottom: 16 },
  description: { fontSize: 14, color: '#374151', lineHeight: 20, textAlign: 'center', marginBottom: 24 },
  loadingText: { fontSize: 14, color: '#6B7280', marginTop: 12 },
  errorText: { fontSize: 18, fontWeight: '600', color: '#DC2626' },
  subText: { fontSize: 14, color: '#6B7280' },
  button: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  addButton: { backgroundColor: '#2563EB', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 24, width: '100%', alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
