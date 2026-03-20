import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Toast } from './Toast';

describe('Toast', () => {
  describe('Rendering', () => {
    it('renders the message', () => {
      render(<Toast id="t1" message="Saved successfully" />);
      expect(screen.getByText('Saved successfully')).toBeInTheDocument();
    });

    it('renders as a status region', () => {
      render(<Toast id="t1" message="Hello" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders dismiss button when onDismiss is provided', () => {
      render(<Toast id="t1" message="Hello" onDismiss={vi.fn()} />);
      expect(screen.getByRole('button', { name: /dismiss notification/i })).toBeInTheDocument();
    });

    it('does not render dismiss button when onDismiss is absent', () => {
      render(<Toast id="t1" message="Hello" />);
      expect(
        screen.queryByRole('button', { name: /dismiss notification/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    (['info', 'success', 'warning', 'error'] as const).forEach((variant) => {
      it(`renders variant="${variant}"`, () => {
        render(<Toast id="t1" message={`${variant} message`} variant={variant} />);
        expect(screen.getByText(`${variant} message`)).toBeInTheDocument();
      });
    });
  });

  describe('Behaviour', () => {
    it('calls onDismiss with the id when dismiss clicked', async () => {
      const onDismiss = vi.fn();
      render(<Toast id="toast-42" message="Hello" onDismiss={onDismiss} />);
      await userEvent.click(screen.getByRole('button', { name: /dismiss notification/i }));
      expect(onDismiss).toHaveBeenCalledWith('toast-42');
    });
  });
});
