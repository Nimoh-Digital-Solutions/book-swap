/**
 * Notifications feature tests — Epic 9 (US-901 / US-902).
 *
 * Tests cover:
 *   - NotificationBell: renders badge, opens/closes panel
 *   - NotificationPanel: lists notifications, mark-read, mark-all-read
 *   - NotificationPreferencesSection: renders toggles, handles patch
 *   - UnsubscribePage: success and error states
 */
import { Route, Routes } from 'react-router-dom';

import {
  MOCK_NOTIFICATION,
  MOCK_NOTIFICATION_PREFS,
} from '@test/mocks/handlers';
import { renderWithProviders } from '@test/renderWithProviders';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationBell } from '../components/NotificationBell/NotificationBell';
import { NotificationPanel } from '../components/NotificationPanel/NotificationPanel';
import { NotificationPreferencesSection } from '../components/NotificationPreferencesSection/NotificationPreferencesSection';
import { UnsubscribePage } from '../pages/UnsubscribePage';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Stub useNotificationWebSocket to avoid real WebSocket in tests
vi.mock('../hooks/useNotificationWebSocket', () => ({
  useNotificationWebSocket: () => ({ isConnected: false }),
}));

// ---------------------------------------------------------------------------
// NotificationBell
// ---------------------------------------------------------------------------

describe('NotificationBell', () => {
  it('renders bell button', async () => {
    renderWithProviders(<NotificationBell />);
    // aria-haspopup="dialog" is the reliable selector regardless of translation
    const btn = await screen.findByRole('button', { name: /bell/i });
    expect(btn).toBeInTheDocument();
  });

  it('shows unread count badge when there are unread notifications', async () => {
    renderWithProviders(<NotificationBell />);
    // Wait for the query to resolve (MSW returns unread_count: 1)
    // The badge span appears when unread_count > 0
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /bell/i });
      expect(btn.querySelector('span[aria-hidden="true"]')).toBeInTheDocument();
    });
  });

  it('opens the notification panel on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationBell />);

    const btn = await screen.findByRole('button', { name: /bell/i });
    await user.click(btn);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('closes the panel when Escape is pressed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationBell />);

    const btn = await screen.findByRole('button', { name: /bell/i });
    await user.click(btn);
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// NotificationPanel
// ---------------------------------------------------------------------------

describe('NotificationPanel', () => {
  it('renders a list of notifications', async () => {
    renderWithProviders(<NotificationPanel onClose={vi.fn()} />);
    expect(await screen.findByText(MOCK_NOTIFICATION.title)).toBeInTheDocument();
    expect(screen.getByText(MOCK_NOTIFICATION.body)).toBeInTheDocument();
  });

  it('shows empty state when there are no notifications', async () => {
    const { server } = await import('@test/mocks/server');
    server.use(
      http.get('*/api/v1/notifications/', () =>
        HttpResponse.json({ unread_count: 0, results: [] }),
      ),
    );

    renderWithProviders(<NotificationPanel onClose={vi.fn()} />);
    // i18n key is rendered as-is in test env
    expect(await screen.findByText('bell.empty')).toBeInTheDocument();
  });

  it('shows "mark all as read" button when there are unread notifications', async () => {
    renderWithProviders(<NotificationPanel onClose={vi.fn()} />);
    // i18n key rendered as-is in test env
    expect(await screen.findByRole('button', { name: 'bell.markAllRead' })).toBeInTheDocument();
  });

  it('does not show "mark all as read" when all are read', async () => {
    const { server } = await import('@test/mocks/server');
    server.use(
      http.get('*/api/v1/notifications/', () =>
        HttpResponse.json({
          unread_count: 0,
          results: [{ ...MOCK_NOTIFICATION, is_read: true }],
        }),
      ),
    );

    renderWithProviders(<NotificationPanel onClose={vi.fn()} />);
    await screen.findByText(MOCK_NOTIFICATION.title);
    expect(screen.queryByRole('button', { name: /mark all/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// NotificationPreferencesSection
// ---------------------------------------------------------------------------

describe('NotificationPreferencesSection', () => {
  it('renders all 6 email preference toggles', async () => {
    renderWithProviders(<NotificationPreferencesSection />);

    await waitFor(() => {
      // All 6 toggle switches should be rendered
      const switches = screen.getAllByRole('switch');
      expect(switches).toHaveLength(6);
    });
  });

  it('all toggles are on by default (from mock prefs)', async () => {
    renderWithProviders(<NotificationPreferencesSection />);

    await waitFor(() => {
      const switches = screen.getAllByRole('switch');
      switches.forEach((sw) => {
        expect(sw).toHaveAttribute('aria-checked', 'true');
      });
    });
  });

  it('calls PATCH when a toggle is clicked', async () => {
    const user = userEvent.setup();
    let patchCalled = false;

    const { server } = await import('@test/mocks/server');
    server.use(
      http.patch('*/api/v1/notifications/preferences/', async () => {
        patchCalled = true;
        return HttpResponse.json({ ...MOCK_NOTIFICATION_PREFS, email_new_request: false });
      }),
    );

    renderWithProviders(<NotificationPreferencesSection />);
    const switches = await screen.findAllByRole('switch');
    await user.click(switches[0]!);

    await waitFor(() => expect(patchCalled).toBe(true));
  });
});

// ---------------------------------------------------------------------------
// UnsubscribePage
// ---------------------------------------------------------------------------

describe('UnsubscribePage', () => {
  it('shows success message for a valid token', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/notifications/unsubscribe/:token" element={<UnsubscribePage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/notifications/unsubscribe/valid-token'] } },
    );
    // i18n key rendered as-is in test env
    expect(await screen.findByText('unsubscribe.success')).toBeInTheDocument();
  });

  it('shows error message for an invalid token', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/notifications/unsubscribe/:token" element={<UnsubscribePage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/notifications/unsubscribe/bad-token'] } },
    );
    // i18n key rendered as-is in test env
    expect(await screen.findByText('unsubscribe.error')).toBeInTheDocument();
  });

  it('shows a link back to home after success', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/notifications/unsubscribe/:token" element={<UnsubscribePage />} />
      </Routes>,
      { routerProps: { initialEntries: ['/notifications/unsubscribe/valid-token'] } },
    );

    const link = await screen.findByRole('link');
    expect(link).toHaveAttribute('href', '/');
  });
});
