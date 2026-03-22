import type { ReactNode } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DeleteAccountDialog } from '../components/DeleteAccountDialog';

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };
}

describe('DeleteAccountDialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <DeleteAccountDialog open={false} onClose={vi.fn()} />,
      { wrapper: createWrapper() },
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the dialog when open', () => {
    render(
      <DeleteAccountDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /delete account/i })).toBeInTheDocument();
  });

  it('shows warning text about permanent deletion', () => {
    render(
      <DeleteAccountDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText(/permanently delete/i)).toBeInTheDocument();
    expect(screen.getByText(/30 days/i)).toBeInTheDocument();
  });

  it('has a password input field', () => {
    render(
      <DeleteAccountDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('disables the delete button when password is empty', () => {
    render(
      <DeleteAccountDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() },
    );
    const buttons = screen.getAllByRole('button');
    const deleteBtn = buttons.find(b => b.textContent?.includes('Delete Account'));
    expect(deleteBtn).toBeDisabled();
  });

  it('enables the delete button when password is entered', async () => {
    const user = userEvent.setup();
    render(
      <DeleteAccountDialog open={true} onClose={vi.fn()} />,
      { wrapper: createWrapper() },
    );

    await user.type(screen.getByLabelText(/password/i), 'mypassword');
    const buttons = screen.getAllByRole('button');
    const deleteBtn = buttons.find(b => b.textContent?.includes('Delete Account'));
    expect(deleteBtn).not.toBeDisabled();
  });

  it('calls onClose when clicking Cancel', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <DeleteAccountDialog open={true} onClose={onClose} />,
      { wrapper: createWrapper() },
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
