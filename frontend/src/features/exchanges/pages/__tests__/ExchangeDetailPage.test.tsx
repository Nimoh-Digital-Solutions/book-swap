/**
 * ExchangeDetailPage — dedicated focused tests (AUD-W-603).
 *
 * The cross-feature integration suite in `features/exchanges/__tests__/exchanges.test.tsx`
 * already covers the happy-path render and primary CTAs. This file zooms in on
 * the branches that file does not — counter-offer flow, both-sides confirmed
 * states, terminal statuses (cancelled / expired / returned), and the
 * conditional Chat / RatingPrompt rendering.
 */
import { Route, Routes } from 'react-router-dom';

import {
  MOCK_EXCHANGE_DETAIL,
} from '@test/mocks/handlers';
import { renderWithProviders } from '@test/renderWithProviders';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExchangeDetail } from '../../types/exchange.types';

// ---------------------------------------------------------------------------
// Mocks — keep ChatPanel/RatingPrompt out of the way so we can assert on
// presence/absence purely via test IDs.
// ---------------------------------------------------------------------------

const mockUseExchange = vi.fn();
const mockUseBooks = vi.fn();
vi.mock('../../hooks/useExchange', () => ({
  useExchange: () => mockUseExchange(),
}));

vi.mock('@features/books', () => ({
  useBooks: () => mockUseBooks(),
}));

vi.mock('@features/auth/stores/authStore', () => ({
  useAuthStore: (
    selector: (s: { user: { id: string } | null; isAuthenticated: boolean }) => unknown,
  ) => selector({ user: { id: 'usr_test_001' }, isAuthenticated: true }),
}));

vi.mock('@features/messaging/components/ChatPanel/ChatPanel', () => ({
  ChatPanel: ({ exchangeId }: { exchangeId: string }) => (
    <div data-testid="chat-panel">chat for {exchangeId}</div>
  ),
}));

vi.mock('@features/ratings', () => ({
  RatingPrompt: ({ exchangeId }: { exchangeId: string }) => (
    <div data-testid="rating-prompt">rating for {exchangeId}</div>
  ),
}));

vi.mock('../../hooks/useExchangeMutations', () => ({
  useAcceptExchange: () => ({ mutate: vi.fn(), isPending: false }),
  useDeclineExchange: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelExchange: () => ({ mutate: vi.fn(), isPending: false }),
  useAcceptConditions: () => ({ mutate: vi.fn(), isPending: false }),
  useConfirmSwap: () => ({ mutate: vi.fn(), isPending: false }),
  useRequestReturn: () => ({ mutate: vi.fn(), isPending: false }),
  useConfirmReturn: () => ({ mutate: vi.fn(), isPending: false }),
  useCounterExchange: () => ({ mutate: vi.fn(), isPending: false }),
  useApproveCounter: () => ({ mutate: vi.fn(), isPending: false }),
}));

// Resolve the page after mocks are set so the page picks them up.
const { default: ExchangeDetailPage } = await import('../ExchangeDetailPage');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CURRENT_USER_ID = 'usr_test_001';

function asRequester(overrides: Partial<ExchangeDetail> = {}): ExchangeDetail {
  return {
    ...MOCK_EXCHANGE_DETAIL,
    requester: { ...MOCK_EXCHANGE_DETAIL.requester, id: CURRENT_USER_ID },
    owner: { ...MOCK_EXCHANGE_DETAIL.owner, id: 'usr_other' },
    ...overrides,
  } as ExchangeDetail;
}

function asOwner(overrides: Partial<ExchangeDetail> = {}): ExchangeDetail {
  return {
    ...MOCK_EXCHANGE_DETAIL,
    requester: { ...MOCK_EXCHANGE_DETAIL.requester, id: 'usr_other' },
    owner: { ...MOCK_EXCHANGE_DETAIL.owner, id: CURRENT_USER_ID },
    ...overrides,
  } as ExchangeDetail;
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/exchanges/:id" element={<ExchangeDetailPage />} />
    </Routes>,
    { routerProps: { initialEntries: ['/exchanges/exch_001'] } },
  );
}

beforeEach(() => {
  mockUseExchange.mockReset();
  mockUseBooks.mockReturnValue({
    data: { count: 0, next: null, previous: null, results: [] },
    isLoading: false,
  });
});

// ---------------------------------------------------------------------------
// Counter-offer flow
// ---------------------------------------------------------------------------

describe('ExchangeDetailPage — counter-offer flow', () => {
  it('shows the requester approve button for a pending owner counter', () => {
    mockUseExchange.mockReturnValue({
      data: asRequester({
        status: 'pending',
        last_counter_by: 'usr_other',
        counter_approved_at: null,
      }),
      isLoading: false,
      isError: false,
    });
    renderPage();

    expect(screen.getByText(/accept counter/i)).toBeInTheDocument();
    expect(screen.getByText(/cancel request/i)).toBeInTheDocument();
  });

  it('shows the owner waiting message after they send a counter', () => {
    mockUseExchange.mockReturnValue({
      data: asOwner({
        status: 'pending',
        last_counter_by: CURRENT_USER_ID,
        counter_approved_at: null,
      }),
      isLoading: false,
      isError: false,
    });
    renderPage();

    expect(
      screen.getByText(/waiting for testuser/i),
    ).toBeInTheDocument();
  });

  it('shows a counter picker from the other participant shelf', async () => {
    const user = userEvent.setup();
    mockUseBooks.mockReturnValue({
      data: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 'book_alt_001',
            title: 'Kindred',
            author: 'Octavia Butler',
            status: 'available',
          },
        ],
      },
      isLoading: false,
    });
    mockUseExchange.mockReturnValue({
      data: asOwner({ status: 'pending' }),
      isLoading: false,
      isError: false,
    });
    renderPage();

    await user.click(screen.getByRole('button', { name: /counter offer/i }));

    expect(screen.getByText(/choose a book from testuser/i)).toBeInTheDocument();
    expect(screen.getByText('Kindred')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send counter offer/i })).toBeDisabled();
  });

  it('shows the counter cap message instead of the counter button', () => {
    mockUseExchange.mockReturnValue({
      data: asOwner({
        status: 'pending',
        owner_counter_count: 2,
        counter_offers_remaining_by_me: 0,
      }),
      isLoading: false,
      isError: false,
    });
    renderPage();

    expect(screen.getByText(/counter offer limit reached \(2\/2\)/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /counter offer/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Conditions acceptance
// ---------------------------------------------------------------------------

describe('ExchangeDetailPage — conditions step', () => {
  it('shows the "you accepted" state once the current user has accepted', () => {
    mockUseExchange.mockReturnValue({
      data: asRequester({
        status: 'conditions_pending',
        conditions_accepted_by_me: true,
        conditions_accepted_count: 1,
      }),
      isLoading: false,
      isError: false,
    });
    renderPage();

    expect(screen.getByText(/you accepted the conditions/i)).toBeInTheDocument();
    expect(screen.getByText(/waiting for/i)).toBeInTheDocument();
  });

  it('celebrates when both parties have accepted', () => {
    mockUseExchange.mockReturnValue({
      data: asRequester({
        status: 'conditions_pending',
        conditions_accepted_by_me: true,
        conditions_accepted_count: 2,
      }),
      isLoading: false,
      isError: false,
    });
    renderPage();

    expect(
      screen.getByText(/both parties accepted the conditions/i),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Active-step swap confirmations
// ---------------------------------------------------------------------------

describe('ExchangeDetailPage — active step', () => {
  it('shows partner-confirmed state when partner has confirmed but viewer has not', () => {
    mockUseExchange.mockReturnValue({
      data: asRequester({
        status: 'active',
        owner_confirmed_at: '2025-07-20T10:00:00Z',
        requester_confirmed_at: null,
      }),
      isLoading: false,
      isError: false,
    });
    renderPage();

    expect(screen.getByText(/confirm swap/i)).toBeInTheDocument();
    expect(screen.getByText(/bookworm confirmed/i)).toBeInTheDocument();
  });

  it('shows the "you confirmed" state when only the viewer has confirmed', () => {
    mockUseExchange.mockReturnValue({
      data: asRequester({
        status: 'active',
        owner_confirmed_at: null,
        requester_confirmed_at: '2025-07-20T10:00:00Z',
      }),
      isLoading: false,
      isError: false,
    });
    renderPage();

    expect(screen.getByText(/you confirmed the swap/i)).toBeInTheDocument();
    expect(screen.getByText(/waiting for/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Terminal statuses
// ---------------------------------------------------------------------------

describe('ExchangeDetailPage — terminal statuses', () => {
  it('renders the cancelled state', () => {
    mockUseExchange.mockReturnValue({
      data: asRequester({ status: 'cancelled' }),
      isLoading: false,
      isError: false,
    });
    renderPage();
    expect(screen.getAllByText(/cancelled/i).length).toBeGreaterThan(0);
  });

  it('renders the expired state', () => {
    mockUseExchange.mockReturnValue({
      data: asRequester({ status: 'expired' }),
      isLoading: false,
      isError: false,
    });
    renderPage();
    expect(screen.getAllByText(/expired/i).length).toBeGreaterThan(0);
  });

  it('renders the returned state', () => {
    mockUseExchange.mockReturnValue({
      data: asRequester({ status: 'returned' }),
      isLoading: false,
      isError: false,
    });
    renderPage();
    expect(screen.getAllByText(/returned/i).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Chat + Rating panel visibility
// ---------------------------------------------------------------------------

describe('ExchangeDetailPage — chat + rating panels', () => {
  it('hides the chat panel during pending status', () => {
    mockUseExchange.mockReturnValue({
      data: asRequester({ status: 'pending' }),
      isLoading: false,
      isError: false,
    });
    renderPage();
    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument();
  });

  it('shows the chat panel once the swap is active', () => {
    mockUseExchange.mockReturnValue({
      data: asRequester({ status: 'active' }),
      isLoading: false,
      isError: false,
    });
    renderPage();
    expect(screen.getByTestId('chat-panel')).toHaveTextContent(
      'chat for exch_001',
    );
  });

  it('hides the rating prompt while the exchange is still active', () => {
    mockUseExchange.mockReturnValue({
      data: asRequester({ status: 'active' }),
      isLoading: false,
      isError: false,
    });
    renderPage();
    expect(screen.queryByTestId('rating-prompt')).not.toBeInTheDocument();
  });

  it('shows the rating prompt once the exchange is completed', () => {
    mockUseExchange.mockReturnValue({
      data: asRequester({ status: 'completed' }),
      isLoading: false,
      isError: false,
    });
    renderPage();
    expect(screen.getByTestId('rating-prompt')).toHaveTextContent(
      'rating for exch_001',
    );
  });

  it('shows the rating prompt for a returned exchange', () => {
    mockUseExchange.mockReturnValue({
      data: asRequester({ status: 'returned' }),
      isLoading: false,
      isError: false,
    });
    renderPage();
    expect(screen.getByTestId('rating-prompt')).toBeInTheDocument();
  });
});
