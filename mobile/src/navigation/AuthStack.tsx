import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { RegisterScreen } from '@/features/auth/screens/RegisterScreen';
import { ForgotPasswordScreen } from '@/features/auth/screens/ForgotPasswordScreen';
import { EmailVerifyPendingScreen } from '@/features/auth/screens/EmailVerifyPendingScreen';
import { EmailVerifyConfirmScreen } from '@/features/auth/screens/EmailVerifyConfirmScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="EmailVerifyPending" component={EmailVerifyPendingScreen} />
      <Stack.Screen name="EmailVerifyConfirm" component={EmailVerifyConfirmScreen} />
    </Stack.Navigator>
  );
}
