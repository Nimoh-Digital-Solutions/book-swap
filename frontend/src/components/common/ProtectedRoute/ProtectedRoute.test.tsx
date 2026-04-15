import { MemoryRouter, Route,Routes } from 'react-router-dom';

import { useAuthStore } from '@features/auth/stores/authStore';
import { render, screen } from '@testing-library/react';
import { beforeEach,describe, expect, it } from 'vitest';

import { axe } from '../../../test/a11y.setup';
import ProtectedRoute from './ProtectedRoute';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Set auth store state before rendering. */
function setAuthState(overrides: Partial<ReturnType<typeof useAuthStore.getState>>) {
  useAuthStore.setState(overrides);
}

/**
 * Renders a ProtectedRoute inside a MemoryRouter with a sentinel route at
 * the redirect destination so we can assert which page was landed on.
 */
function renderProtectedRoute({
  redirectTo,
}: {
  redirectTo?: string;
} = {}) {
  return render(
    <MemoryRouter initialEntries={['/en/protected']}>
      <Routes>
        <Route path="/:lng">
          <Route
            path="protected"
            element={
              redirectTo ? (
                <ProtectedRoute redirectTo={redirectTo}>
                  <p>Protected content</p>
                </ProtectedRoute>
              ) : (
                <ProtectedRoute>
                  <p>Protected content</p>
                </ProtectedRoute>
              )
            }
          />
          <Route path="login" element={<p>Login page</p>} />
          <Route path="custom-login" element={<p>Custom login page</p>} />
          <Route index element={<p>Home page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProtectedRoute', () => {
  beforeEach(() => {
    // Reset auth store to unauthenticated, not loading
    useAuthStore.setState({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('renders children when the user is authenticated', () => {
    setAuthState({ isAuthenticated: true, accessToken: 'tok' });
    renderProtectedRoute();

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('does not render children when the user is not authenticated', () => {
    setAuthState({ isAuthenticated: false });
    renderProtectedRoute();

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects to /login by default when not authenticated', () => {
    setAuthState({ isAuthenticated: false });
    renderProtectedRoute();

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('redirects to a custom path when redirectTo is provided and not authenticated', () => {
    setAuthState({ isAuthenticated: false });
    renderProtectedRoute({ redirectTo: '/custom-login' });

    expect(screen.getByText('Custom login page')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children for authenticated user even when redirectTo is supplied', () => {
    setAuthState({ isAuthenticated: true, accessToken: 'tok' });

    render(
      <MemoryRouter initialEntries={['/en/protected']}>
        <Routes>
          <Route path="/:lng">
            <Route
              path="protected"
              element={
                <ProtectedRoute redirectTo="/custom-login">
                  <p>Authenticated content</p>
                </ProtectedRoute>
              }
            />
            <Route path="custom-login" element={<p>Custom login page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Authenticated content')).toBeInTheDocument();
    expect(screen.queryByText('Custom login page')).not.toBeInTheDocument();
  });

  it('shows loading state while isLoading is true', () => {
    setAuthState({ isLoading: true, isAuthenticated: false });
    renderProtectedRoute();

    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });

  describe('Accessibility (axe)', () => {
    it('has no violations rendering protected content', async () => {
      setAuthState({ isAuthenticated: true, accessToken: 'tok' });
      const { container } = renderProtectedRoute();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no violations for the redirect destination', async () => {
      setAuthState({ isAuthenticated: false });
      const { container } = renderProtectedRoute();
      expect(await axe(container)).toHaveNoViolations();
    });

    it('has no violations for the loading state', async () => {
      setAuthState({ isLoading: true });
      const { container } = renderProtectedRoute();
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
