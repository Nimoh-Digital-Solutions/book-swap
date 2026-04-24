/**
 * SettingsPage tests (AUD-W-602)
 *
 * The page is mostly a layout for several feature sections — the meaningful
 * page-level logic is the pending-deletion banner and the "cancel deletion"
 * action. Section components are stubbed so we can assert the orchestrator's
 * branching cleanly without booting their internal data layers.
 */
import { renderWithProviders } from '@test/renderWithProviders';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockUseProfile = vi.fn();
const mockCancelDeletion = vi.fn();
const mockAddNotification = vi.fn();

vi.mock('@features/profile', () => ({
  useProfile: () => mockUseProfile(),
  profileService: {
    cancelDeletion: (...args: unknown[]) => mockCancelDeletion(...args),
  },
}));

vi.mock('@features/profile/components/DeleteAccountDialog', () => ({
  DeleteAccountDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="delete-dialog" /> : null,
}));

vi.mock('@features/profile/components/LocationSection', () => ({
  LocationSection: () => <div data-testid="location-section" />,
}));

vi.mock('@features/profile/components/PasswordChangeSection/PasswordChangeSection', () => ({
  PasswordChangeSection: () => <div data-testid="password-section" />,
}));

vi.mock('@features/profile/components/PrivacySection/PrivacySection', () => ({
  PrivacySection: () => <div data-testid="privacy-section" />,
}));

vi.mock('@features/notifications', () => ({
  NotificationPreferencesSection: () => <div data-testid="notif-section" />,
}));

vi.mock('@features/trust-safety', () => ({
  BlockedUsersList: () => <div data-testid="blocked-users" />,
  DataExportButton: () => <button data-testid="data-export">Export</button>,
}));

vi.mock('@data/useAppStore', () => ({
  useAppStore: (selector: (s: { addNotification: typeof mockAddNotification }) => unknown) =>
    selector({ addNotification: mockAddNotification }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function renderPage() {
  const { default: SettingsPage } = await import('../SettingsPage');
  return renderWithProviders(<SettingsPage />, {
    routerProps: { initialEntries: ['/en/settings'] },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SettingsPage', () => {
  beforeEach(() => {
    mockUseProfile.mockReturnValue({
      data: {
        id: 'usr_test_001',
        email: 'test@example.com',
        auth_provider: 'email',
        deletion_requested_at: null,
      },
      refetch: vi.fn(),
    });
  });

  it('renders the heading and core sections', async () => {
    await renderPage();
    expect(screen.getByRole('heading', { name: /settings/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByTestId('location-section')).toBeInTheDocument();
    expect(screen.getByTestId('notif-section')).toBeInTheDocument();
    expect(screen.getByTestId('privacy-section')).toBeInTheDocument();
    expect(screen.getByTestId('blocked-users')).toBeInTheDocument();
    expect(screen.getByTestId('data-export')).toBeInTheDocument();
  });

  it('shows the password-change section for email-authenticated users', async () => {
    await renderPage();
    expect(screen.getByTestId('password-section')).toBeInTheDocument();
  });

  it('hides the password-change section for SSO users', async () => {
    mockUseProfile.mockReturnValue({
      data: {
        id: 'usr_test_001',
        email: 'test@example.com',
        auth_provider: 'google',
        deletion_requested_at: null,
      },
      refetch: vi.fn(),
    });
    await renderPage();
    expect(screen.queryByTestId('password-section')).not.toBeInTheDocument();
  });

  it('shows the danger-zone delete button when no deletion is pending', async () => {
    await renderPage();
    expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
    expect(screen.queryByText(/account deletion pending/i)).not.toBeInTheDocument();
  });

  it('opens the DeleteAccountDialog when "Delete Account" is clicked', async () => {
    const user = userEvent.setup();
    await renderPage();
    await user.click(screen.getByRole('button', { name: /delete account/i }));
    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
  });

  it('shows the pending-deletion banner instead of the danger zone when deletion is requested', async () => {
    mockUseProfile.mockReturnValue({
      data: {
        id: 'usr_test_001',
        email: 'test@example.com',
        auth_provider: 'email',
        deletion_requested_at: '2026-04-01T10:00:00Z',
      },
      refetch: vi.fn(),
    });
    await renderPage();
    expect(screen.getByText(/account deletion pending/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel deletion/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete account/i })).not.toBeInTheDocument();
  });

  it('warns the user when no cancel-token is available', async () => {
    const user = userEvent.setup();
    mockUseProfile.mockReturnValue({
      data: {
        id: 'usr_test_001',
        email: 'test@example.com',
        auth_provider: 'email',
        deletion_requested_at: '2026-04-01T10:00:00Z',
      },
      refetch: vi.fn(),
    });
    await renderPage();
    await user.click(screen.getByRole('button', { name: /cancel deletion/i }));
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.stringMatching(/no cancellation token/i),
      expect.objectContaining({ variant: 'error' }),
    );
    expect(mockCancelDeletion).not.toHaveBeenCalled();
  });

  it('cancels the deletion when a cancel-token is present in localStorage', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    mockCancelDeletion.mockResolvedValueOnce(undefined);
    localStorage.setItem('bs_deletion_cancel_token', 'tok-abc');
    mockUseProfile.mockReturnValue({
      data: {
        id: 'usr_test_001',
        email: 'test@example.com',
        auth_provider: 'email',
        deletion_requested_at: '2026-04-01T10:00:00Z',
      },
      refetch,
    });
    await renderPage();
    await user.click(screen.getByRole('button', { name: /cancel deletion/i }));

    expect(mockCancelDeletion).toHaveBeenCalledWith({ token: 'tok-abc' });
    // Wait microtask flush
    await Promise.resolve();
    expect(localStorage.getItem('bs_deletion_cancel_token')).toBeNull();
    expect(mockAddNotification).toHaveBeenCalledWith(
      expect.stringMatching(/cancelled/i),
      expect.objectContaining({ variant: 'success' }),
    );
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
