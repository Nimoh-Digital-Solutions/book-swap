import { MemoryRouter } from 'react-router-dom';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EmailVerifyPendingPage } from './EmailVerifyPendingPage';

// Mock authService
vi.mock('../services/auth.service', () => ({
  authService: {
    resendVerificationEmail: vi.fn(),
  },
}));

// Mock auth store
vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: { user: { email: string } | null }) => unknown) =>
    selector({ user: { email: 'test@example.com' } }),
  ),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/auth/email/verify-pending']}>
      <EmailVerifyPendingPage />
    </MemoryRouter>,
  );
}

describe('EmailVerifyPendingPage', () => {
  it('renders the verification prompt with user email', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/test@example\.com/)).toBeInTheDocument();
  });

  it('shows resend button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument();
  });

  it('calls resendVerificationEmail on click and shows success', async () => {
    const { authService } = await import('../services/auth.service');
    vi.mocked(authService.resendVerificationEmail).mockResolvedValueOnce({
      detail: 'sent',
    });

    renderPage();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /resend/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
    expect(authService.resendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it('shows error state when resend fails', async () => {
    const { authService } = await import('../services/auth.service');
    vi.mocked(authService.resendVerificationEmail).mockRejectedValueOnce(
      new Error('fail'),
    );

    renderPage();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /resend/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('has a link to sign in', () => {
    renderPage();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login',
    );
  });
});
