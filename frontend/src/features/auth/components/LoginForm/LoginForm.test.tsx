import { MemoryRouter } from 'react-router-dom';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach,describe, expect, it, vi } from 'vitest';

import { axe } from '../../../../test/a11y.setup';
import { LoginForm } from './LoginForm';

const renderForm = (props: Parameters<typeof LoginForm>[0]) =>
  render(
    <MemoryRouter>
      <LoginForm {...props} />
    </MemoryRouter>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LoginForm', () => {
  const onSubmit = vi.fn();
  const onToggle = vi.fn();
  const onForgotPassword = vi.fn();

  beforeEach(() => {
    onSubmit.mockClear();
    onToggle.mockClear();
    onForgotPassword.mockClear();
  });

  const defaultProps = () => ({ onSubmit, onToggle, onForgotPassword });

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------

  it('renders email/username and password fields with labels', () => {
    renderForm(defaultProps());

    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('renders loading state on submit button', () => {
    renderForm({ ...defaultProps(), isLoading: true });

    const button = screen.getByRole('button', { name: /signing in/i });
    // Button should indicate loading — either via text or aria attribute
    expect(
      button.textContent?.toLowerCase().includes('signing in') ||
        button.getAttribute('aria-busy') === 'true' ||
        button.getAttribute('disabled') !== null,
    ).toBe(true);
  });

  it('renders server error when provided', () => {
    renderForm({ ...defaultProps(), serverError: 'Invalid credentials' });

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
  });

  it('does not render server error when null', () => {
    renderForm({ ...defaultProps(), serverError: null });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Validation
  // -----------------------------------------------------------------------

  it('shows required error when submitting empty form', async () => {
    const user = userEvent.setup();
    renderForm(defaultProps());

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/email or username is required/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows min-length error for short password', async () => {
    const user = userEvent.setup();
    renderForm(defaultProps());

    await user.type(screen.getByLabelText(/email or username/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'short');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 8/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Successful submission
  // -----------------------------------------------------------------------

  it('calls onSubmit with valid data', async () => {
    const user = userEvent.setup();
    renderForm(defaultProps());

    await user.type(screen.getByLabelText(/email or username/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });

    expect(onSubmit).toHaveBeenCalledWith(
      { email_or_username: 'user@example.com', password: 'password123' },
      expect.anything(), // react-hook-form event
    );
  });

  it('does not call onSubmit when isLoading', async () => {
    const user = userEvent.setup();
    renderForm({ ...defaultProps(), isLoading: true });

    await user.type(screen.getByLabelText(/email or username/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    // Submit button should be disabled during loading
    const button = screen.getByRole('button', { name: /signing in/i });
    expect(button).toBeDisabled();

    // Should not call onSubmit because loading blocks interaction
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Accessibility
  // -----------------------------------------------------------------------

  it('has no axe violations', async () => {
    const { container } = renderForm(defaultProps());
    expect(await axe(container)).toHaveNoViolations();
  });

  it('has no axe violations with server error displayed', async () => {
    const { container } = renderForm({ ...defaultProps(), serverError: 'Bad request' });
    expect(await axe(container)).toHaveNoViolations();
  });
});
