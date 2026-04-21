import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/types';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { RegisterScreen } from '@/features/auth/screens/RegisterScreen';
import { ForgotPasswordScreen } from '@/features/auth/screens/ForgotPasswordScreen';
import { EmailVerifyPendingScreen } from '@/features/auth/screens/EmailVerifyPendingScreen';
import { EmailVerifyConfirmScreen } from '@/features/auth/screens/EmailVerifyConfirmScreen';
import { PasswordResetConfirmScreen } from '@/features/auth/screens/PasswordResetConfirmScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="PasswordResetConfirm" component={PasswordResetConfirmScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="EmailVerifyPending" component={EmailVerifyPendingScreen} options={{ animation: 'fade_from_bottom' }} />
      <Stack.Screen name="EmailVerifyConfirm" component={EmailVerifyConfirmScreen} options={{ animation: 'fade' }} />
    </Stack.Navigator>
  );
}
