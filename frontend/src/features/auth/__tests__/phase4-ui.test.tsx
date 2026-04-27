import { MemoryRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthSplitPanel } from '../components/AuthSplitPanel/AuthSplitPanel';
import { ForgotPasswordForm } from '../components/ForgotPasswordForm/ForgotPasswordForm';
import { RegisterForm } from '../components/RegisterForm/RegisterForm';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const wrap = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

// ---------------------------------------------------------------------------
// AuthSplitPanel
// ---------------------------------------------------------------------------

describe('AuthSplitPanel', () => {
  const panelProps = {
    view: 'login' as const,
    brandingTitle: <>Test <span>Title</span></>,
    brandingSubtitle: 'Test subtitle',
    quote: 'Great app',
    authorName: 'Tester',
    authorDetails: 'Since 2024',
    formContent: <div data-testid="form">Form</div>,
  };

  it('renders form content passed as prop', () => {
    wrap(<AuthSplitPanel {...panelProps} />);
    expect(screen.getByTestId('form')).toBeInTheDocument();
  });

  it('renders branding subtitle and testimonial', () => {
    wrap(<AuthSplitPanel {...panelProps} />);
    // Subtitle is rendered twice — once in the desktop branding panel
    // and once in the condensed mobile brand block (RESP-016).
    expect(screen.getAllByText('Test subtitle').length).toBeGreaterThan(0);
    expect(screen.getByText(/Great app/)).toBeInTheDocument();
    expect(screen.getByText('Tester')).toBeInTheDocument();
  });

  it('renders progress bar with correct width', () => {
    const { container } = wrap(
      <AuthSplitPanel {...panelProps} view="register" progress={50} />,
    );
    const bar = container.querySelector('[style*="width: 50%"]');
    expect(bar).toBeInTheDocument();
  });

  it('defaults progress to 100%', () => {
    const { container } = wrap(<AuthSplitPanel {...panelProps} />);
    const bar = container.querySelector('[style*="width: 100%"]');
    expect(bar).toBeInTheDocument();
  });

  it('renders BookSwap logo link(s)', () => {
    wrap(<AuthSplitPanel {...panelProps} />);
    expect(screen.getAllByText('BookSwap').length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// RegisterForm (Tailwind version)
// ---------------------------------------------------------------------------

describe('RegisterForm', () => {
  const onSubmit = vi.fn();
  const onToggle = vi.fn();

  beforeEach(() => {
    onSubmit.mockClear();
    onToggle.mockClear();
  });

  const defaults = () => ({ onSubmit, onToggle });

  it('renders "Step 1 of 2" header', () => {
    wrap(<RegisterForm {...defaults()} />);
    expect(screen.getByText(/step 1 of 2/i)).toBeInTheDocument();
  });

  it('renders username, email, and date of birth fields (name fields deferred to onboarding)', () => {
    wrap(<RegisterForm {...defaults()} />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
  });

  it('renders password and confirm password fields', () => {
    wrap(<RegisterForm {...defaults()} />);
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('renders Google and Apple OAuth buttons', () => {
    wrap(<RegisterForm {...defaults()} />);
    expect(screen.getByText('Google')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
  });

  it('renders legal checkboxes for terms and privacy', () => {
    wrap(<RegisterForm {...defaults()} />);
    expect(screen.getByRole('checkbox', { name: /terms of service/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /privacy policy/i })).toBeInTheDocument();
  });

  it('calls onToggle when "Already a member?" is clicked', async () => {
    const user = userEvent.setup();
    wrap(<RegisterForm {...defaults()} />);

    await user.click(screen.getByText(/already a member/i));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('shows "Continue to Step 2" submit button', () => {
    wrap(<RegisterForm {...defaults()} />);
    expect(screen.getByRole('button', { name: /continue to step 2/i })).toBeInTheDocument();
  });

  it('shows server error when provided', () => {
    wrap(<RegisterForm {...defaults()} serverError="Email already exists" />);
    expect(screen.getByText('Email already exists')).toBeInTheDocument();
  });

  it('shows DOB age hint text', () => {
    wrap(<RegisterForm {...defaults()} />);
    expect(screen.getByText(/at least 16 years old/i)).toBeInTheDocument();
  });

  it('disables submit button when loading', () => {
    wrap(<RegisterForm {...defaults()} isLoading />);
    const btn = screen.getByRole('button', { name: /signing in/i });
    expect(btn).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// ForgotPasswordForm (Tailwind version)
// ---------------------------------------------------------------------------

describe('ForgotPasswordForm', () => {
  const onSubmit = vi.fn();
  const onBack = vi.fn();

  beforeEach(() => {
    onSubmit.mockClear();
    onBack.mockClear();
  });

  const defaults = () => ({ onSubmit, onBack });

  it('renders email field and submit button', () => {
    wrap(<ForgotPasswordForm {...defaults()} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('renders back to login button', () => {
    wrap(<ForgotPasswordForm {...defaults()} />);
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup();
    wrap(<ForgotPasswordForm {...defaults()} />);

    await user.click(screen.getByText(/back to login/i));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('renders success state with submitted email', () => {
    wrap(
      <ForgotPasswordForm
        {...defaults()}
        isSuccess
        submittedEmail="test@example.com"
      />,
    );
    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows server error when provided', () => {
    wrap(<ForgotPasswordForm {...defaults()} serverError="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('disables submit button when loading', () => {
    wrap(<ForgotPasswordForm {...defaults()} isLoading />);
    const btn = screen.getByRole('button', { name: /sending/i });
    expect(btn).toBeDisabled();
  });
});
