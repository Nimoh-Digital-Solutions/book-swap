import { render, screen } from '@testing-library/react';
import { describe, expect,it } from 'vitest';

import { Spinner } from './Spinner';

describe('Spinner', () => {
  describe('Rendering', () => {
    it('renders a status region', () => {
      render(<Spinner />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders the default label', () => {
      render(<Spinner />);
      expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('renders a custom label', () => {
      render(<Spinner label="Fetching data" />);
      expect(screen.getByText('Fetching data')).toBeInTheDocument();
    });

    it('applies a custom className', () => {
      render(<Spinner className="my-spinner" />);
      expect(screen.getByRole('status')).toHaveClass('my-spinner');
    });
  });

  describe('Sizes', () => {
    (['sm', 'md', 'lg'] as const).forEach((size) => {
      it(`renders size="${size}"`, () => {
        render(<Spinner size={size} />);
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });
  });
});
