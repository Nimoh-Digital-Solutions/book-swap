import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';

export function AddBookScreen() {
  const { params } = useRoute();
  const p = params as { isbn?: string; title?: string; author?: string } | undefined;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add book</Text>
      {p?.isbn ? <Text style={styles.meta}>ISBN: {p.isbn}</Text> : null}
      {p?.title ? <Text style={styles.meta}>{p.title}</Text> : null}
      {p?.author ? <Text style={styles.meta}>{p.author}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  meta: { fontSize: 14, color: '#6B7280' },
});
