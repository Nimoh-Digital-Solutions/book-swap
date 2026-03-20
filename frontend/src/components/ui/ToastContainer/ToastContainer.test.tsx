import type { ToastItem } from '@hooks';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ToastContainer } from './ToastContainer';

const mockToasts: ToastItem[] = [
  { id: '1', message: 'Info message', variant: 'info' },
  { id: '2', message: 'Success message', variant: 'success' },
];

describe('ToastContainer', () => {
  it('renders an aria-live region', () => {
    render(<ToastContainer toasts={[]} onDismiss={() => {}} />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-relevant', 'additions removals');
  });

  it('renders toast items', () => {
    render(<ToastContainer toasts={mockToasts} onDismiss={() => {}} />);
    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('renders nothing when toasts array is empty', () => {
    render(<ToastContainer toasts={[]} onDismiss={() => {}} />);
    const region = screen.getByRole('status');
    expect(region.children).toHaveLength(0);
  });
});
