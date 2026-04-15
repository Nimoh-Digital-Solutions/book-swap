import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ScanStackParamList } from '@/navigation/types';
import { ScannerScreen } from '@/features/scanner/screens/ScannerScreen';
import { ScanResultScreen } from '@/features/scanner/screens/ScanResultScreen';
import { AddBookScreen } from '@/features/books/screens/AddBookScreen';

const Stack = createNativeStackNavigator<ScanStackParamList>();

export function ScanStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Scan' }} />
      <Stack.Screen name="ScanResult" component={ScanResultScreen} options={{ title: 'Result' }} />
      <Stack.Screen name="AddBook" component={AddBookScreen} options={{ title: 'Add book' }} />
    </Stack.Navigator>
  );
}
