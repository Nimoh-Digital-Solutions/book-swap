/**
 * RequestSwapScreen tests (AUD-M-702)
 *
 * Verifies the page-level branching of the swap-request screen:
 *   - error state renders the empty-state retry CTA
 *   - empty available-books state renders the "no books" copy
 *   - book selection enables the submit button
 *   - submit dispatches the createExchange mutation with the right payload
 *   - mutation error path triggers an Alert
 */
import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import type { Book } from '@/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGoBack = jest.fn();
const mockUseMyBooks = jest.fn();
const mockCreateExchangeMutate = jest.fn();
const mockUseCreateExchange = jest.fn(() => ({
  mutate: mockCreateExchangeMutate,
  isPending: false,
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: jest.fn() }),
  useRoute: () => ({ params: { bookId: 'book_target_001' } }),
}));

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    text: { primary: '#fff', secondary: '#aaa', placeholder: '#666' },
    auth: { bg: '#152018', card: '#1A251D', cardBorder: '#28382D', golden: '#E4B643' },
    neutral: { 50: '#fff' },
    surface: { white: '#fff' },
    border: { default: '#ddd' },
    status: { error: '#ef4444' },
  }),
  useIsDark: () => true,
}));

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return { Image: View };
});

jest.mock('@/features/books/hooks/useBooks', () => ({
  useMyBooks: (...args: unknown[]) => mockUseMyBooks(...args),
}));

jest.mock('../hooks/useExchanges', () => ({
  useCreateExchange: () => mockUseCreateExchange(),
}));

// Skeleton + EmptyState are simple visual stubs so we don't pull in their
// dependencies.
jest.mock('@/components/Skeleton', () => {
  const { View } = require('react-native');
  return { SkeletonCard: () => <View testID="skeleton-card" /> };
});

jest.mock('@/components/EmptyState', () => {
  const { Pressable, Text, View } = require('react-native');
  return {
    EmptyState: ({
      title,
      subtitle,
      actionLabel,
      onAction,
    }: {
      title: string;
      subtitle?: string;
      actionLabel?: string;
      onAction?: () => void;
    }) => (
      <View testID="empty-state">
        <Text>{title}</Text>
        {subtitle ? <Text>{subtitle}</Text> : null}
        {actionLabel && onAction ? (
          <Pressable testID="empty-state-action" onPress={onAction}>
            <Text>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    ),
  };
});

// Import AFTER mocks
import { RequestSwapScreen } from '../screens/RequestSwapScreen';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseBook: Book = {
  id: 'book_offer_001',
  title: 'Norwegian Wood',
  author: 'Haruki Murakami',
  description: '',
  isbn: '',
  cover_url: '',
  primary_photo: null,
  condition: 'good',
  language: 'en',
  status: 'available',
  swap_type: 'temporary',
  notes: '',
  page_count: null,
  publish_year: null,
  photos: [],
  owner: {
    id: 'usr_test_001',
    username: 'testuser',
    avatar: null,
    neighborhood: 'Jordaan',
    avg_rating: '4.5',
  },
  created_at: '2025-07-10T10:00:00Z',
  updated_at: '2025-07-10T10:00:00Z',
} as Book;

const secondBook: Book = { ...baseBook, id: 'book_offer_002', title: 'Kafka on the Shore' };
const reservedBook: Book = { ...baseBook, id: 'book_offer_003', status: 'reserved' };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  mockUseCreateExchange.mockReturnValue({
    mutate: mockCreateExchangeMutate,
    isPending: false,
  });
});

describe('RequestSwapScreen', () => {
  it('renders the error state with a retry CTA when the books query fails', () => {
    const refetch = jest.fn();
    mockUseMyBooks.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    });
    const { getByTestId } = render(<RequestSwapScreen />);
    fireEvent.press(getByTestId('empty-state-action'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('renders skeleton placeholders while loading', () => {
    mockUseMyBooks.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });
    const { getAllByTestId } = render(<RequestSwapScreen />);
    expect(getAllByTestId('skeleton-card').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the empty state when the user has no available books', () => {
    mockUseMyBooks.mockReturnValue({
      data: [reservedBook],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    const { getByText } = render(<RequestSwapScreen />);
    expect(getByText('exchanges.noBooks')).toBeTruthy();
  });

  it('lists each available book the user owns and filters reserved ones', () => {
    mockUseMyBooks.mockReturnValue({
      data: [baseBook, secondBook, reservedBook],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    const { getAllByText, getAllByLabelText } = render(<RequestSwapScreen />);
    // Title appears twice per card (cover fallback + card body); use length
    // checks rather than getByText to disambiguate.
    expect(getAllByText('Norwegian Wood').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Kafka on the Shore').length).toBeGreaterThanOrEqual(1);
    // Only two of the three should be rendered (reserved one filtered out).
    expect(getAllByLabelText('exchanges.selectBookA11y')).toHaveLength(2);
  });

  it('keeps the submit button disabled until a book is picked', () => {
    mockUseMyBooks.mockReturnValue({
      data: [baseBook],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    const { getByLabelText } = render(<RequestSwapScreen />);
    const submit = getByLabelText('exchanges.sendRequest');
    expect(submit.props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('dispatches createExchange with the selected book id when submitted', () => {
    mockUseMyBooks.mockReturnValue({
      data: [baseBook, secondBook],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    const { getByLabelText, getAllByLabelText } = render(<RequestSwapScreen />);

    fireEvent.press(getAllByLabelText('exchanges.selectBookA11y')[0]);
    fireEvent.press(getByLabelText('exchanges.sendRequest'));

    expect(mockCreateExchangeMutate).toHaveBeenCalledTimes(1);
    expect(mockCreateExchangeMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        requested_book_id: 'book_target_001',
        offered_book_id: 'book_offer_001',
      }),
      expect.any(Object),
    );
  });

  it('navigates back after a successful create-exchange mutation', () => {
    mockUseMyBooks.mockReturnValue({
      data: [baseBook],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(
      (_title, _msg, buttons) => {
        const okButton = buttons?.find((b) => b.text === 'common.ok');
        okButton?.onPress?.();
      },
    );

    mockCreateExchangeMutate.mockImplementation((_payload, opts) => {
      opts?.onSuccess?.();
    });

    const { getByLabelText, getAllByLabelText } = render(<RequestSwapScreen />);
    fireEvent.press(getAllByLabelText('exchanges.selectBookA11y')[0]);
    fireEvent.press(getByLabelText('exchanges.sendRequest'));

    expect(mockGoBack).toHaveBeenCalledTimes(1);
    alertSpy.mockRestore();
  });

  it('alerts the user when create-exchange returns a DRF error payload', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockUseMyBooks.mockReturnValue({
      data: [baseBook],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockCreateExchangeMutate.mockImplementation((_payload, opts) => {
      opts?.onError?.({
        response: { data: { detail: 'Book is no longer available.' } },
      });
    });

    const { getByLabelText, getAllByLabelText } = render(<RequestSwapScreen />);
    fireEvent.press(getAllByLabelText('exchanges.selectBookA11y')[0]);
    fireEvent.press(getByLabelText('exchanges.sendRequest'));

    expect(alertSpy).toHaveBeenCalledWith(
      'common.error',
      'Book is no longer available.',
    );
    alertSpy.mockRestore();
  });
});
