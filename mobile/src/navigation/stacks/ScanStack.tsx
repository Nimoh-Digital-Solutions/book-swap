import React from "react";
import { useTranslation } from "react-i18next";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ScanStackParamList } from "@/navigation/types";
import { ScannerScreen } from "@/features/scanner/screens/ScannerScreen";
import { ScanResultScreen } from "@/features/scanner/screens/ScanResultScreen";
import { BookSearchScreen } from "@/features/books/screens/BookSearchScreen";
import { AddBookScreen } from "@/features/books/screens/AddBookScreen";
import {
  useSharedHeaderOptions,
  useChildHeaderOptions,
} from "@/navigation/headerOptions";

const Stack = createNativeStackNavigator<ScanStackParamList>();

export function ScanStack() {
  const { t } = useTranslation();
  const shared = useSharedHeaderOptions();
  const child = useChildHeaderOptions();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{ ...shared, headerTitle: t('navigation.scan', 'Scan') }}
      />
      <Stack.Screen
        name="BookSearch"
        component={BookSearchScreen}
        options={{ ...child, headerTitle: t('navigation.searchBooks', 'Search books') }}
      />
      <Stack.Screen
        name="ScanResult"
        component={ScanResultScreen}
        options={{ ...child, headerTitle: t('navigation.bookFound', 'Book found') }}
      />
      <Stack.Screen
        name="AddBook"
        component={AddBookScreen}
        options={{ ...child, headerTitle: t('navigation.addBook', 'Add book') }}
      />
    </Stack.Navigator>
  );
}
