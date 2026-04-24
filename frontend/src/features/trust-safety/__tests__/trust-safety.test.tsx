import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';

import { server } from '../../../test/mocks/server';
import { renderWithProviders } from '../../../test/renderWithProviders';
import {
  BlockedUsersList,
  BlockUserButton,
  CookieConsentBanner,
  DataExportButton,
  ReportButton,
  UnblockButton,
} from '../index';

// ══════════════════════════════════════════════════════════════════════════════
// BlockUserButton
// ══════════════════════════════════════════════════════════════════════════════

describe('BlockUserButton', () => {
  it('renders block button with text', () => {
    renderWithProviders(
      <BlockUserButton userId="usr_other_001" displayName="Alice" />,
    );
    expect(screen.getByText(/block/i)).toBeInTheDocument();
  });

  it('opens confirmation dialog on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <BlockUserButton userId="usr_other_001" displayName="Alice" />,
    );

    await user.click(screen.getByRole('button', { name: /block/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/alice/i)).toBeInTheDocument();
  });

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <BlockUserButton userId="usr_other_001" displayName="Alice" />,
    );

    await user.click(screen.getByRole('button', { name: /block/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByText(/cancel/i));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls block API on confirm', async () => {
    const user = userEvent.setup();
    let blocked = false;
    server.use(
      http.post('*/api/v1/users/block/', () => {
        blocked = true;
        return HttpResponse.json(
          { id: 'blk_new', blocked_user: 'usr_other_001', created_at: new Date().toISOString() },
          { status: 201 },
        );
      }),
    );

    renderWithProviders(
      <BlockUserButton userId="usr_other_001" displayName="Alice" />,
    );

    // Open confirm dialog
    await user.click(screen.getByRole('button', { name: /block/i }));

    // Find the confirm button inside the dialog (text "Block" from block.confirm)
    const dialog = screen.getByRole('dialog');
    const dialogButtons = dialog.querySelectorAll('button');
    // Last button in the dialog is the confirm button
    const confirmBtn = dialogButtons[dialogButtons.length - 1]!;
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(blocked).toBe(true);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// UnblockButton
// ══════════════════════════════════════════════════════════════════════════════

describe('UnblockButton', () => {
  it('renders unblock button', () => {
    renderWithProviders(<UnblockButton userId="usr_blocked_001" />);
    expect(screen.getByRole('button', { name: /unblock/i })).toBeInTheDocument();
  });

  it('calls unblock API on click', async () => {
    const user = userEvent.setup();
    let unblocked = false;
    server.use(
      http.delete('*/api/v1/users/block/usr_blocked_001/', () => {
        unblocked = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<UnblockButton userId="usr_blocked_001" />);
    await user.click(screen.getByRole('button', { name: /unblock/i }));

    await waitFor(() => {
      expect(unblocked).toBe(true);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// BlockedUsersList
// ══════════════════════════════════════════════════════════════════════════════

describe('BlockedUsersList', () => {
  it('renders blocked users from API', async () => {
    server.use(
      http.get('*/api/v1/users/block/', () => {
        return HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 'blk_001',
              blocked_user: {
                id: 'usr_blocked_001',
                username: 'blockeduser',
                first_name: 'Blocked',
                avatar: null,
              },
              created_at: '2025-01-15T10:00:00Z',
            },
          ],
        });
      }),
    );

    renderWithProviders(<BlockedUsersList />);

    await waitFor(() => {
      expect(screen.getByText('Blocked')).toBeInTheDocument();
      expect(screen.getByText('@blockeduser')).toBeInTheDocument();
    });
  });

  it('shows empty state when no blocked users', async () => {
    server.use(
      http.get('*/api/v1/users/block/', () => {
        return HttpResponse.json({
          count: 0,
          next: null,
          previous: null,
          results: [],
        });
      }),
    );

    renderWithProviders(<BlockedUsersList />);

    await waitFor(() => {
      expect(screen.getByText(/haven't blocked/i)).toBeInTheDocument();
    });
  });

  it('shows unblock button for each blocked user', async () => {
    server.use(
      http.get('*/api/v1/users/block/', () => {
        return HttpResponse.json({
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 'blk_001',
              blocked_user: {
                id: 'usr_blocked_001',
                username: 'blockeduser',
                first_name: 'Blocked',
                avatar: null,
              },
              created_at: '2025-01-15T10:00:00Z',
            },
          ],
        });
      }),
    );

    renderWithProviders(<BlockedUsersList />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /unblock/i })).toBeInTheDocument();
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ReportButton + ReportDialog
// ══════════════════════════════════════════════════════════════════════════════

describe('ReportButton', () => {
  it('renders report button with text', () => {
    renderWithProviders(<ReportButton reportedUserId="usr_other_001" />);
    expect(screen.getByText(/report/i)).toBeInTheDocument();
  });

  it('opens report dialog on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportButton reportedUserId="usr_other_001" />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows category dropdown and description field', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportButton reportedUserId="usr_other_001" />);

    await user.click(screen.getByRole('button'));

    // <select> element for category
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
    // <textarea> for description
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it('submits report and shows success notification', async () => {
    const user = userEvent.setup();
    let reported = false;
    server.use(
      http.post('*/api/v1/reports/', () => {
        reported = true;
        return HttpResponse.json(
          {
            id: 'rpt_new',
            reporter: 'usr_test_001',
            reported_user: 'usr_other_001',
            category: 'spam',
            status: 'open',
            created_at: new Date().toISOString(),
          },
          { status: 201 },
        );
      }),
    );

    renderWithProviders(<ReportButton reportedUserId="usr_other_001" />);
    await user.click(screen.getByRole('button'));

    // Select category and submit
    const submitButton = screen.getByText(/submit report/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(reported).toBe(true);
    });
  });

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ReportButton reportedUserId="usr_other_001" />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByText(/cancel/i));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// CookieConsentBanner
// ══════════════════════════════════════════════════════════════════════════════

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    localStorage.removeItem('bookswap_cookie_consent');
  });

  it('shows banner when no consent stored', () => {
    renderWithProviders(<CookieConsentBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/essential cookies/i)).toBeInTheDocument();
  });

  it('hides banner when consent is already stored', () => {
    localStorage.setItem(
      'bookswap_cookie_consent',
      JSON.stringify({ accepted: true, timestamp: new Date().toISOString() }),
    );
    renderWithProviders(<CookieConsentBanner />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('dismisses banner and stores consent on accept', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CookieConsentBanner />);

    await user.click(screen.getByText(/accept/i));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem('bookswap_cookie_consent')!) as { accepted: boolean };
    expect(stored.accepted).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DataExportButton
// ══════════════════════════════════════════════════════════════════════════════

describe('DataExportButton', () => {
  it('renders the email-export button', () => {
    renderWithProviders(<DataExportButton />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText(/email me my data/i)).toBeInTheDocument();
  });

  it('POSTs to the data export endpoint on click (AUD-B-704)', async () => {
    const user = userEvent.setup();
    let queued = false;

    server.use(
      http.post('*/api/v1/users/me/data-export/', () => {
        queued = true;
        return HttpResponse.json(
          {
            queued: true,
            detail: 'Your data export will be emailed to you shortly.',
          },
          { status: 202 },
        );
      }),
    );

    renderWithProviders(<DataExportButton />);
    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(queued).toBe(true);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EmailVerificationGate
// ══════════════════════════════════════════════════════════════════════════════

describe('EmailVerificationGate', () => {
  // Mock the hook used by EmailVerificationGate
  const mockUseEmailVerificationGate = vi.hoisted(() => vi.fn());

  vi.mock('../../auth/hooks/useEmailVerificationGate', () => ({
    useEmailVerificationGate: () => mockUseEmailVerificationGate(),
  }));

  // Dynamically import after mock
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  let EmailVerificationGateCmp: typeof import('../components/EmailVerificationGate/EmailVerificationGate')['EmailVerificationGate'];

  beforeAll(async () => {
    const mod = await import('../components/EmailVerificationGate/EmailVerificationGate');
    EmailVerificationGateCmp = mod.EmailVerificationGate;
  });

  it('renders children when user is verified', () => {
    mockUseEmailVerificationGate.mockReturnValue({ isVerified: true, showPrompt: false });

    renderWithProviders(
      <EmailVerificationGateCmp action="list books">
        <div>Protected Content</div>
      </EmailVerificationGateCmp>,
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows verification prompt when user is not verified', () => {
    mockUseEmailVerificationGate.mockReturnValue({ isVerified: false, showPrompt: true });

    renderWithProviders(
      <EmailVerificationGateCmp action="list books">
        <div>Protected Content</div>
      </EmailVerificationGateCmp>,
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.getByText(/verify/i)).toBeInTheDocument();
  });
});
