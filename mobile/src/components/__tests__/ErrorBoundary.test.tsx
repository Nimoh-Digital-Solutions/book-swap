import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '@/components/ErrorBoundary';

jest.mock('@/lib/sentry', () => ({
  captureException: jest.fn(),
}));
jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    text: { primary: '#000', secondary: '#666', inverse: '#fff' },
    surface: { warm: '#f5f5f5', white: '#fff' },
    border: { default: '#ddd' },
    brand: { primary: '#2563EB' },
    status: { error: '#e53e3e' },
  }),
}));

import { captureException } from '@/lib/sentry';

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test crash');
  return <Text>Working</Text>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(getByText('Working')).toBeTruthy();
  });

  it('renders fallback UI on error and reports to Sentry', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(getByText('common.error')).toBeTruthy();
    expect(getByText('common.retry')).toBeTruthy();
    expect(captureException).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('recovers when retry is pressed', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;
    const { getByText, rerender } = render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>,
    );

    expect(getByText('common.error')).toBeTruthy();

    shouldThrow = false;
    fireEvent.press(getByText('common.retry'));

    rerender(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>,
    );

    consoleSpy.mockRestore();
  });
});
