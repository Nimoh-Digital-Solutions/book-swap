import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { ProfileStackParamList } from '@/navigation/types';

type Route = RouteProp<ProfileStackParamList, 'EditBook'>;

export function EditBookScreen() {
  const { params } = useRoute<Route>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit book</Text>
      <Text style={styles.meta}>bookId: {params.bookId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  meta: { fontSize: 14, color: '#6B7280' },
});
