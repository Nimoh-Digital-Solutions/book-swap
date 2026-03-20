import { render, screen } from '@testing-library/react';
import { describe, expect,it } from 'vitest';

import { Card } from './Card';

describe('Card', () => {
  describe('Rendering', () => {
    it('renders children', () => {
      render(<Card>Hello card</Card>);
      expect(screen.getByText('Hello card')).toBeInTheDocument();
    });

    it('renders as a div', () => {
      render(<Card data-testid="card">Content</Card>);
      expect(screen.getByTestId('card').tagName).toBe('DIV');
    });

    it('applies a custom className', () => {
      render(<Card className="my-card">Content</Card>);
      expect(screen.getByText('Content').closest('div')).toHaveClass('my-card');
    });

    it('forwards extra props', () => {
      render(<Card data-testid="labelled-card" aria-label="User card">Content</Card>);
      expect(screen.getByTestId('labelled-card')).toHaveAttribute('aria-label', 'User card');
    });
  });

  describe('Padding variants', () => {
    (['none', 'sm', 'md', 'lg'] as const).forEach((padding) => {
      it(`renders padding="${padding}"`, () => {
        render(<Card padding={padding} data-testid="c">Content</Card>);
        expect(screen.getByTestId('c')).toBeInTheDocument();
      });
    });
  });

  describe('Shadow variants', () => {
    (['none', 'sm', 'md', 'lg'] as const).forEach((shadow) => {
      it(`renders shadow="${shadow}"`, () => {
        render(<Card shadow={shadow} data-testid="c">Content</Card>);
        expect(screen.getByTestId('c')).toBeInTheDocument();
      });
    });
  });
});
