import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
type BookDetailRoute = RouteProp<{ BookDetail: { bookId: string } }, 'BookDetail'>;

export function BookDetailScreen() {
  const { params } = useRoute<BookDetailRoute>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book detail</Text>
      <Text style={styles.meta}>bookId: {params.bookId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  meta: { fontSize: 14, color: '#6B7280' },
});
