import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ScanStackParamList } from "@/navigation/types";
import { ScannerScreen } from "@/features/scanner/screens/ScannerScreen";
import { ScanResultScreen } from "@/features/scanner/screens/ScanResultScreen";
import { AddBookScreen } from "@/features/books/screens/AddBookScreen";
import {
  useSharedHeaderOptions,
  useChildHeaderOptions,
} from "@/navigation/headerOptions";

const Stack = createNativeStackNavigator<ScanStackParamList>();

export function ScanStack() {
  const shared = useSharedHeaderOptions();
  const child = useChildHeaderOptions();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{ ...shared, headerTitle: "Scan" }}
      />
      <Stack.Screen
        name="ScanResult"
        component={ScanResultScreen}
        options={{ ...child, headerTitle: "Book found" }}
      />
      <Stack.Screen
        name="AddBook"
        component={AddBookScreen}
        options={{ ...child, headerTitle: "Add book" }}
      />
    </Stack.Navigator>
  );
}
