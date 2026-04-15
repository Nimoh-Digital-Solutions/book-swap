import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function MyProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My profile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600' },
});
