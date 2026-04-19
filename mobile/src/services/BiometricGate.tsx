import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  type AppStateStatus,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Fingerprint } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useBiometric } from '@/hooks/useBiometric';
import { useColors } from '@/hooks/useColors';
import { tokenStorage } from '@/lib/storage';
import { useAuthStore } from '@/stores/authStore';

let _lastExternalAuthAt = 0;
export function markBiometricAuthCompleted() {
  _lastExternalAuthAt = Date.now();
}

export function BiometricGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const c = useColors();
  const { authenticate } = useBiometric();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const lastAuthAt = useRef(0);

  const AUTH_COOLDOWN_MS = 3000;

  const tryUnlock = useCallback(async () => {
    setBusy(true);
    try {
      const result = await authenticate();
      lastAuthAt.current = Date.now();
      if (result.success) setLocked(false);
    } finally {
      setBusy(false);
    }
  }, [authenticate]);

  useEffect(() => {
    let unmounted = false;
    const sub = AppState.addEventListener('change', (next) => {
      const wasBackground = appState.current.match(/inactive|background/);
      if (wasBackground && next === 'active') {
        const now = Date.now();
        const recentInternal = now - lastAuthAt.current < AUTH_COOLDOWN_MS;
        const recentExternal = now - _lastExternalAuthAt < AUTH_COOLDOWN_MS;
        if (recentInternal || recentExternal) {
          appState.current = next;
          return;
        }
        void (async () => {
          if (unmounted) return;
          const enabled = tokenStorage.getBiometricEnabled();
          if (enabled && useAuthStore.getState().isAuthenticated) {
            setLocked(true);
            const result = await authenticate();
            if (unmounted) return;
            lastAuthAt.current = Date.now();
            if (result.success) setLocked(false);
          }
        })();
      }
      appState.current = next;
    });
    return () => {
      unmounted = true;
      sub.remove();
    };
  }, [authenticate]);

  const handleLogout = useCallback(() => {
    void clearAuth();
    setLocked(false);
  }, [clearAuth]);

  if (!isAuthenticated || !locked) return <>{children}</>;

  return (
    <View style={styles.root}>
      {children}
      <View style={[styles.overlay, { backgroundColor: `${c.neutral[100]}F2` }]}>
        <View style={[styles.card, { backgroundColor: c.surface.white, borderColor: c.border.default }]}>
          <Fingerprint color={c.brand.primary} size={56} strokeWidth={1.5} />
          <Text style={[styles.title, { color: c.text.primary }]}>{t('auth.biometricPrompt')}</Text>
          <Text style={[styles.hint, { color: c.text.secondary }]}>
            {t('biometricGate.hint')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.retry')}
            onPress={() => void tryUnlock()}
            disabled={busy}
            accessibilityState={{ disabled: busy }}
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: c.brand.primary, opacity: pressed || busy ? 0.85 : 1 },
            ]}
          >
            {busy ? (
              <ActivityIndicator color={c.text.inverse} />
            ) : (
              <Text style={[styles.primaryLabel, { color: c.text.inverse }]}>
                {t('common.retry')}
              </Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('auth.logout')}
            onPress={handleLogout}
            style={styles.secondaryBtn}
          >
            <Text style={[styles.secondaryLabel, { color: c.brand.primary }]}>{t('auth.logout')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  hint: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryLabel: { fontSize: 16, fontWeight: '600' },
  secondaryBtn: { paddingVertical: 8 },
  secondaryLabel: { fontSize: 16, fontWeight: '600' },
});
