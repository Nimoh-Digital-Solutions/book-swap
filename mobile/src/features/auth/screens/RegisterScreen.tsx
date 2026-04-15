import React, { useState, useCallback } from 'react';
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
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { http } from '@/services/http';
import { API } from '@/configs/apiEndpoints';
import type { AuthStackParamList } from '@/navigation/types';
import type { RegisterPayload } from '@/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export function RegisterScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = useCallback(async () => {
    if (!email.trim() || !password.trim() || !username.trim()) {
      Alert.alert(t('common.error'), t('auth.fillRequired'));
      return;
    }
    setLoading(true);
    const payload: RegisterPayload = {
      email: email.trim(),
      username: username.trim(),
      password,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    };
    try {
      await http.post(API.auth.register, payload);
      Alert.alert(t('common.success'), t('auth.registerSuccess'), [
        { text: t('common.done'), onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: Record<string, unknown> } };
      const raw = ax.response?.data;
      const msg =
        typeof raw?.detail === 'string'
          ? raw.detail
          : raw
            ? JSON.stringify(raw)
            : t('common.error');
      Alert.alert(t('common.error'), String(msg));
    } finally {
      setLoading(false);
    }
  }, [email, password, username, firstName, lastName, navigation, t]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('auth.register')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('auth.firstName')}
          value={firstName}
          onChangeText={setFirstName}
          autoComplete="name-given"
        />
        <TextInput
          style={styles.input}
          placeholder={t('auth.lastName')}
          value={lastName}
          onChangeText={setLastName}
          autoComplete="name-family"
        />
        <TextInput
          style={styles.input}
          placeholder={t('auth.username')}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoComplete="username"
        />
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
          autoComplete="new-password"
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('auth.register')}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>{t('auth.hasAccount')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingHorizontal: 24, paddingVertical: 32 },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 24, color: '#111827' },
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
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { color: '#2563EB', textAlign: 'center', marginTop: 20, fontSize: 14 },
});
