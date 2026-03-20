import { render, screen } from '@testing-library/react';
import { describe, expect,it } from 'vitest';

import { Badge } from './Badge';

describe('Badge', () => {
  describe('Rendering', () => {
    it('renders children', () => {
      render(<Badge>Active</Badge>);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('applies a custom className', () => {
      render(<Badge className="extra">Active</Badge>);
      expect(screen.getByText('Active')).toHaveClass('extra');
    });

    it('forwards extra props', () => {
      render(<Badge data-testid="my-badge">OK</Badge>);
      expect(screen.getByTestId('my-badge')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    const variants = ['success', 'warning', 'error', 'neutral', 'info'] as const;

    variants.forEach((variant) => {
      it(`renders variant="${variant}"`, () => {
        render(<Badge variant={variant}>{variant}</Badge>);
        expect(screen.getByText(variant)).toBeInTheDocument();
      });
    });
  });

  describe('Sizes', () => {
    it('renders size="sm"', () => {
      render(<Badge size="sm">Small</Badge>);
      expect(screen.getByText('Small')).toBeInTheDocument();
    });

    it('renders size="md"', () => {
      render(<Badge size="md">Medium</Badge>);
      expect(screen.getByText('Medium')).toBeInTheDocument();
    });
  });
});
