import { MemoryRouter, Route,Routes } from 'react-router-dom';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { server } from '../../../test/mocks/server';
import { useAuthStore } from '../stores/authStore';
import { LoginPage } from './LoginPage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetStore() {
  useAuthStore.setState({
    accessToken: null,
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
}

function renderLoginPage(initialEntries: string[] = ['/en/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/:lng">
          <Route path="login" element={<LoginPage />} />
          <Route index element={<p>Home page</p>} />
          <Route path="dashboard" element={<p>Dashboard page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LoginPage', () => {
  beforeEach(() => {
    resetStore();
    vi.clearAllMocks();
  });

  it('renders the sign-in heading and form', () => {
    renderLoginPage();

    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('successful login navigates to home page', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Home page')).toBeInTheDocument();
    });

    // Store should have the user authenticated
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('shows server error on failed login', async () => {
    // Override handler to return 401
    server.use(
      http.post('*/api/v1/auth/login/', () => {
        return HttpResponse.json(
          { detail: 'Invalid credentials' },
          { status: 401 },
        );
      }),
    );

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(useAuthStore.getState().error).toBeTruthy();
    });
  });

  it('navigates to returnUrl after successful login', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        initialEntries={[
          { pathname: '/en/login', state: { returnUrl: '/dashboard' } },
        ]}
      >
        <Routes>
          <Route path="/:lng">
            <Route path="login" element={<LoginPage />} />
            <Route index element={<p>Home page</p>} />
            <Route path="dashboard" element={<p>Dashboard page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Dashboard page')).toBeInTheDocument();
    });
  });
});
