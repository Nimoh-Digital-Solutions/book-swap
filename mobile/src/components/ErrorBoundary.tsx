import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AlertTriangle, RotateCcw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { captureException } from '@/lib/sentry';
import { useColors } from '@/hooks/useColors';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

function ErrorBoundaryFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  const c = useColors();

  return (
    <View style={[styles.container, { backgroundColor: c.surface.warm }]}>
      <View
        style={[
          styles.card,
          { borderColor: c.border.default, backgroundColor: c.surface.white },
        ]}
      >
        <AlertTriangle color={c.status.error} size={48} strokeWidth={1.75} />
        <Text style={[styles.title, { color: c.text.primary }]}>{t('common.error')}</Text>
        <Text style={[styles.subtitle, { color: c.text.secondary }]}>
          {t('errorBoundary.message')}
        </Text>
        <Pressable
          onPress={onRetry}
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: c.brand.primary, opacity: pressed ? 0.9 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('common.retry')}
        >
          <RotateCcw color={c.text.inverse} size={18} strokeWidth={2} />
          <Text style={[styles.buttonLabel, { color: c.text.inverse }]}>{t('common.retry')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    const stack = info.componentStack;
    captureException(error, stack ? { componentStack: stack } : undefined);
  }

  private handleRetry = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return <ErrorBoundaryFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
