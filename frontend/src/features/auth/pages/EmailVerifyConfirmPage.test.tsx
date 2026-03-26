import { MemoryRouter } from 'react-router-dom';

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EmailVerifyConfirmPage } from './EmailVerifyConfirmPage';

// Mock authService
vi.mock('../services/auth.service', () => ({
  authService: {
    verifyEmail: vi.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
let authServiceMock: typeof import('../services/auth.service');

beforeEach(async () => {
  authServiceMock = await import('../services/auth.service');
  vi.mocked(authServiceMock.authService.verifyEmail).mockReset();
});

function renderPage(search = '?token=abc123') {
  return render(
    <MemoryRouter initialEntries={[`/auth/email/verify${search}`]}>
      <EmailVerifyConfirmPage />
    </MemoryRouter>,
  );
}

describe('EmailVerifyConfirmPage', () => {
  it('shows loading state initially', () => {
    vi.mocked(authServiceMock.authService.verifyEmail).mockReturnValue(
      new Promise(() => {}),
    );

    renderPage();
    expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
  });

  it('shows success state on successful verification', async () => {
    vi.mocked(authServiceMock.authService.verifyEmail).mockResolvedValueOnce({
      detail: 'ok',
    });

    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/email verified/i)).toBeInTheDocument();
    });
    expect(authServiceMock.authService.verifyEmail).toHaveBeenCalledWith('abc123');
  });

  it('shows error state when token is missing', async () => {
    renderPage('');
    await waitFor(() => {
      expect(screen.getByText(/no verification token/i)).toBeInTheDocument();
    });
  });

  it('shows error state when verification fails', async () => {
    vi.mocked(authServiceMock.authService.verifyEmail).mockRejectedValueOnce(
      new Error('expired'),
    );

    renderPage();
    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });
  });

  it('shows sign in link on success', async () => {
    vi.mocked(authServiceMock.authService.verifyEmail).mockResolvedValueOnce({
      detail: 'ok',
    });

    renderPage();
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
        'href',
        '/login',
      );
    });
  });

  it('has a resend link on error', async () => {
    vi.mocked(authServiceMock.authService.verifyEmail).mockRejectedValueOnce(
      new Error('expired'),
    );

    renderPage();
    await waitFor(() => {
      expect(
        screen.getByRole('link', { name: /resend verification/i }),
      ).toHaveAttribute('href', '/auth/email/verify-pending');
    });
  });
});
