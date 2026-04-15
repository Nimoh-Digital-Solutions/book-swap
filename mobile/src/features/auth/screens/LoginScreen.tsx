import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import { useAuthStore } from '@/stores/authStore';
import { mergePartialUser } from '@/lib/mergeUser';
import type { AuthStackParamList } from '@/navigation/types';
import type { LoginResponse } from '@/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    void LocalAuthentication.hasHardwareAsync().then((has) => {
      if (has) void LocalAuthentication.isEnrolledAsync().then(setBiometricAvailable);
    });
  }, []);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      const { data } = await http.post<LoginResponse>(API.auth.login, {
        email_or_username: email.trim(),
        password,
      });
      await setAuth(
        mergePartialUser(data.user as Parameters<typeof mergePartialUser>[0]),
        data.access_token,
        data.refresh_token,
      );
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string; message?: string } } };
      const msg =
        ax.response?.data?.detail ??
        ax.response?.data?.message ??
        (typeof ax.response?.data === 'object' && ax.response?.data !== null
          ? JSON.stringify(ax.response.data)
          : null) ??
        t('common.error');
      Alert.alert(t('common.error'), String(msg));
    } finally {
      setLoading(false);
    }
  }, [email, password, setAuth, t]);

  const handleBiometric = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: t('auth.biometricPrompt'),
    });
    if (result.success) {
      // Biometric success — session unlock when tokens already hydrated from secure storage
    }
  }, [t]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>BookSwap</Text>
        <Text style={styles.subtitle}>{t('auth.login')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('auth.login')}</Text>
          )}
        </TouchableOpacity>

        {biometricAvailable ? (
          <TouchableOpacity style={styles.biometricButton} onPress={handleBiometric}>
            <Text style={styles.biometricText}>{t('auth.biometricPrompt')}</Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>{t('auth.forgotPassword')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>{t('auth.noAccount')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#2563EB',
    marginBottom: 4,
  },
  subtitle: { fontSize: 18, textAlign: 'center', color: '#6B7280', marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  biometricButton: { alignItems: 'center', paddingVertical: 12, marginBottom: 8 },
  biometricText: { color: '#2563EB', fontSize: 14 },
  link: { color: '#2563EB', textAlign: 'center', marginTop: 12, fontSize: 14 },
});
