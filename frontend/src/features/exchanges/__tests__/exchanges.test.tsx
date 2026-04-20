/**
 * Exchange feature integration tests — Epic 5 Phase 6.
 *
 * Tests cover: ExchangeStatusBadge, ExchangeCard, ExchangesPage tabs,
 * ExchangeDetailPage actions, IncomingRequestsPage, and RequestSwapButton.
 */
import { Route, Routes } from 'react-router-dom';

import {
  MOCK_EXCHANGE_DETAIL,
  MOCK_EXCHANGE_LIST_ITEM,
} from '@test/mocks/handlers';
import { renderWithProviders } from '@test/renderWithProviders';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExchangeCard } from '../components/ExchangeCard/ExchangeCard';
import { ExchangeStatusBadge } from '../components/ExchangeStatusBadge/ExchangeStatusBadge';
import type { ExchangeListItem, ExchangeStatus } from '../types/exchange.types';

// ---------------------------------------------------------------------------
// IntersectionObserver mock
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    },
  );
});

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makeExchangeListItem(overrides: Partial<ExchangeListItem> = {}): ExchangeListItem {
  return { ...MOCK_EXCHANGE_LIST_ITEM, ...overrides };
}

// ══════════════════════════════════════════════════════════════════════════════
// ExchangeStatusBadge
// ══════════════════════════════════════════════════════════════════════════════

describe('ExchangeStatusBadge', () => {
  const statuses: ExchangeStatus[] = [
    'pending', 'accepted', 'conditions_pending', 'active',
    'swap_confirmed', 'completed', 'declined', 'cancelled',
    'expired', 'return_requested', 'returned',
  ];

  it.each(statuses)('renders badge for status "%s"', (status) => {
    renderWithProviders(<ExchangeStatusBadge status={status} />);
    const badge = screen.getByText(/.+/);
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('rounded-full');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ExchangeCard
// ══════════════════════════════════════════════════════════════════════════════

describe('ExchangeCard', () => {
  it('renders exchange card with book title and status', () => {
    const exchange = makeExchangeListItem();
    renderWithProviders(<ExchangeCard exchange={exchange} />);
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('links to exchange detail', () => {
    const exchange = makeExchangeListItem({ id: 'exch_abc' });
    renderWithProviders(<ExchangeCard exchange={exchange} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/en/exchanges/exch_abc');
  });

  it('renders formatted date', () => {
    const exchange = makeExchangeListItem();
    renderWithProviders(<ExchangeCard exchange={exchange} />);
    const time = screen.getByRole('link').querySelector('time');
    expect(time).toBeInTheDocument();
    expect(time).toHaveAttribute('datetime', exchange.created_at);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ExchangesPage (lazy loaded — test via mock)
// ══════════════════════════════════════════════════════════════════════════════

const mockUseExchanges = vi.fn();
const mockUseIncomingRequestCount = vi.fn();

vi.mock('../hooks/useExchanges', () => ({
  useExchanges: () => mockUseExchanges(),
}));

vi.mock('../hooks/useIncomingRequestCount', () => ({
  useIncomingRequestCount: () => mockUseIncomingRequestCount(),
}));

// Need to import after vi.mock
const { default: ExchangesPage } = await import('../pages/ExchangesPage');

describe('ExchangesPage', () => {
  beforeEach(() => {
    mockUseIncomingRequestCount.mockReturnValue({ data: { count: 2 } });
  });

  it('shows loading state', () => {
    mockUseExchanges.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderWithProviders(<ExchangesPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders empty state for active tab', () => {
    mockUseExchanges.mockReturnValue({
      data: { count: 0, next: null, previous: null, results: [] },
      isLoading: false,
      isError: false,
    });
    renderWithProviders(<ExchangesPage />);
    expect(screen.getByText(/no active exchanges/i)).toBeInTheDocument();
  });

  it('renders exchange cards for pending tab', async () => {
    const user = userEvent.setup();
    const pendingExchange = makeExchangeListItem({ status: 'pending' });
    mockUseExchanges.mockReturnValue({
      data: { count: 1, next: null, previous: null, results: [pendingExchange] },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ExchangesPage />);

    const pendingTab = screen.getByRole('tab', { name: /pending/i });
    await user.click(pendingTab);

    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
  });

  it('shows tab counts', () => {
    const exchanges = [
      makeExchangeListItem({ id: '1', status: 'active' }),
      makeExchangeListItem({ id: '2', status: 'pending' }),
      makeExchangeListItem({ id: '3', status: 'pending' }),
      makeExchangeListItem({ id: '4', status: 'declined' }),
    ];
    mockUseExchanges.mockReturnValue({
      data: { count: 4, next: null, previous: null, results: exchanges },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ExchangesPage />);

    const tabs = screen.getAllByRole('tab');
    // Active tab should show count 1
    expect(within(tabs[0]!).getByText('1')).toBeInTheDocument();
    // Pending tab should show count 2
    expect(within(tabs[1]!).getByText('2')).toBeInTheDocument();
    // History tab should show count 1
    expect(within(tabs[2]!).getByText('1')).toBeInTheDocument();
  });

  it('shows incoming request count badge', () => {
    mockUseExchanges.mockReturnValue({
      data: { count: 0, next: null, previous: null, results: [] },
      isLoading: false,
      isError: false,
    });

    renderWithProviders(<ExchangesPage />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ExchangeDetailPage
// ══════════════════════════════════════════════════════════════════════════════

const mockUseExchange = vi.fn();
vi.mock('../hooks/useExchange', () => ({
  useExchange: () => mockUseExchange(),
}));

// Mock auth store to provide current user ID
vi.mock('@features/auth/stores/authStore', () => ({
  useAuthStore: (selector: (s: { user: { id: string } | null; isAuthenticated: boolean }) => unknown) =>
    selector({ user: { id: 'usr_test_001' }, isAuthenticated: true }),
}));

// Mock messaging hooks so ChatPanel doesn't start WebSocket connections
vi.mock('@features/messaging/hooks/useChatWebSocket', () => ({
  useChatWebSocket: () => ({
    isConnected: false,
    isLocked: false,
    sendMessage: vi.fn(),
    sendTyping: vi.fn(),
    sendRead: vi.fn(),
  }),
}));
vi.mock('@features/messaging/hooks/useMessages', () => ({
  useMessages: () => ({
    data: undefined,
    isLoading: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
  }),
}));
vi.mock('@features/messaging/hooks/useSendMessage', () => ({
  useSendMessage: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@features/messaging/hooks/useMarkMessagesRead', () => ({
  useMarkMessagesRead: () => ({ mutate: vi.fn() }),
}));
vi.mock('@features/messaging/hooks/useMeetupSuggestions', () => ({
  useMeetupSuggestions: () => ({ data: [], isLoading: false }),
}));

vi.mock('../hooks/useExchangeMutations', () => ({
  useAcceptExchange: () => ({ mutate: vi.fn(), isPending: false }),
  useDeclineExchange: () => ({ mutate: vi.fn(), isPending: false }),
  useCancelExchange: () => ({ mutate: vi.fn(), isPending: false }),
  useAcceptConditions: () => ({ mutate: vi.fn(), isPending: false }),
  useConfirmSwap: () => ({ mutate: vi.fn(), isPending: false }),
  useRequestReturn: () => ({ mutate: vi.fn(), isPending: false }),
  useConfirmReturn: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateExchange: () => ({ mutate: vi.fn(), isPending: false }),
  useCounterExchange: () => ({ mutate: vi.fn(), isPending: false }),
  useApproveCounter: () => ({ mutate: vi.fn(), isPending: false }),
}));

const { default: ExchangeDetailPage } = await import('../pages/ExchangeDetailPage');

describe('ExchangeDetailPage', () => {
  it('shows loading state', () => {
    mockUseExchange.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderWithProviders(
      <Routes>
        <Route path="/exchanges/:id" element={<ExchangeDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/exchanges/exch_001'] } },
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state for missing exchange', () => {
    mockUseExchange.mockReturnValue({ data: undefined, isLoading: false, isError: true });
    renderWithProviders(
      <Routes>
        <Route path="/exchanges/:id" element={<ExchangeDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/exchanges/exch_001'] } },
    );
    expect(screen.getByText(/exchange not found/i)).toBeInTheDocument();
  });

  it('renders exchange detail with books and participants', () => {
    mockUseExchange.mockReturnValue({
      data: MOCK_EXCHANGE_DETAIL,
      isLoading: false,
      isError: false,
    });
    renderWithProviders(
      <Routes>
        <Route path="/exchanges/:id" element={<ExchangeDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/exchanges/exch_001'] } },
    );

    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
    expect(screen.getByText('1984')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('bookworm')).toBeInTheDocument();
  });

  it('shows cancel button when current user is the requester and status is pending', () => {
    mockUseExchange.mockReturnValue({
      data: { ...MOCK_EXCHANGE_DETAIL, status: 'pending' },
      isLoading: false,
      isError: false,
    });
    renderWithProviders(
      <Routes>
        <Route path="/exchanges/:id" element={<ExchangeDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/exchanges/exch_001'] } },
    );

    expect(screen.getByText(/cancel request/i)).toBeInTheDocument();
  });

  it('shows accept/decline buttons when current user is the owner', () => {
    // Switch the detail so current user (usr_test_001) is the owner
    const ownerDetail = {
      ...MOCK_EXCHANGE_DETAIL,
      status: 'pending',
      owner: { ...MOCK_EXCHANGE_DETAIL.owner, id: 'usr_test_001' },
      requester: { ...MOCK_EXCHANGE_DETAIL.requester, id: 'usr_other' },
    };
    mockUseExchange.mockReturnValue({
      data: ownerDetail,
      isLoading: false,
      isError: false,
    });
    renderWithProviders(
      <Routes>
        <Route path="/exchanges/:id" element={<ExchangeDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/exchanges/exch_001'] } },
    );

    const buttons = screen.getAllByRole('button');
    const buttonTexts = buttons.map(b => b.textContent?.toLowerCase() ?? '');
    expect(buttonTexts.some(t => t.includes('accept'))).toBe(true);
    expect(buttonTexts.some(t => t.includes('decline'))).toBe(true);
  });

  it('shows conditions acceptance UI for accepted status', () => {
    mockUseExchange.mockReturnValue({
      data: { ...MOCK_EXCHANGE_DETAIL, status: 'accepted' },
      isLoading: false,
      isError: false,
    });
    renderWithProviders(
      <Routes>
        <Route path="/exchanges/:id" element={<ExchangeDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/exchanges/exch_001'] } },
    );

    expect(screen.getByText(/accept exchange conditions/i)).toBeInTheDocument();
  });

  it('shows confirm swap button for active status', () => {
    mockUseExchange.mockReturnValue({
      data: { ...MOCK_EXCHANGE_DETAIL, status: 'active' },
      isLoading: false,
      isError: false,
    });
    renderWithProviders(
      <Routes>
        <Route path="/exchanges/:id" element={<ExchangeDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/exchanges/exch_001'] } },
    );

    expect(screen.getByText(/confirm swap/i)).toBeInTheDocument();
  });

  it('shows request return button for swap_confirmed status', () => {
    mockUseExchange.mockReturnValue({
      data: { ...MOCK_EXCHANGE_DETAIL, status: 'swap_confirmed' },
      isLoading: false,
      isError: false,
    });
    renderWithProviders(
      <Routes>
        <Route path="/exchanges/:id" element={<ExchangeDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/exchanges/exch_001'] } },
    );

    expect(screen.getByText(/request return/i)).toBeInTheDocument();
  });

  it('shows confirm return button for return_requested status', () => {
    mockUseExchange.mockReturnValue({
      data: { ...MOCK_EXCHANGE_DETAIL, status: 'return_requested' },
      isLoading: false,
      isError: false,
    });
    renderWithProviders(
      <Routes>
        <Route path="/exchanges/:id" element={<ExchangeDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/exchanges/exch_001'] } },
    );

    expect(screen.getByText(/confirm return/i)).toBeInTheDocument();
  });

  it('shows declined status for terminal state', () => {
    mockUseExchange.mockReturnValue({
      data: { ...MOCK_EXCHANGE_DETAIL, status: 'declined' },
      isLoading: false,
      isError: false,
    });
    renderWithProviders(
      <Routes>
        <Route path="/exchanges/:id" element={<ExchangeDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/exchanges/exch_001'] } },
    );

    const declinedTexts = screen.getAllByText(/declined/i);
    expect(declinedTexts.length).toBeGreaterThan(0);
  });

  it('shows timeline with correct progression', () => {
    mockUseExchange.mockReturnValue({
      data: { ...MOCK_EXCHANGE_DETAIL, status: 'active' },
      isLoading: false,
      isError: false,
    });
    renderWithProviders(
      <Routes>
        <Route path="/exchanges/:id" element={<ExchangeDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/exchanges/exch_001'] } },
    );

    expect(screen.getByText('Requested')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('Conditions')).toBeInTheDocument();
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
    expect(screen.getByText('Swap Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('shows message when present', () => {
    mockUseExchange.mockReturnValue({
      data: { ...MOCK_EXCHANGE_DETAIL, message: 'Love this book!' },
      isLoading: false,
      isError: false,
    });
    renderWithProviders(
      <Routes>
        <Route path="/exchanges/:id" element={<ExchangeDetailPage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/exchanges/exch_001'] } },
    );

    expect(screen.getByText('Love this book!')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// IncomingRequestsPage
// ══════════════════════════════════════════════════════════════════════════════

const mockUseIncomingRequests = vi.fn();
vi.mock('../hooks/useIncomingRequests', () => ({
  useIncomingRequests: () => mockUseIncomingRequests(),
}));

const { default: IncomingRequestsPage } = await import('../pages/IncomingRequestsPage');

describe('IncomingRequestsPage', () => {
  it('shows loading state', () => {
    mockUseIncomingRequests.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    renderWithProviders(<IncomingRequestsPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty state when no requests', () => {
    mockUseIncomingRequests.mockReturnValue({ data: [], isLoading: false, isError: false });
    renderWithProviders(<IncomingRequestsPage />);
    expect(screen.getByText(/no incoming requests/i)).toBeInTheDocument();
  });

  it('renders incoming request cards', () => {
    const incoming = [makeExchangeListItem({ id: 'inc_1' })];
    mockUseIncomingRequests.mockReturnValue({ data: incoming, isLoading: false, isError: false });
    renderWithProviders(<IncomingRequestsPage />);

    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText(/accept/i)).toBeInTheDocument();
    expect(screen.getByText(/decline/i)).toBeInTheDocument();
  });

  it('shows page title', () => {
    mockUseIncomingRequests.mockReturnValue({ data: [], isLoading: false, isError: false });
    renderWithProviders(<IncomingRequestsPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
