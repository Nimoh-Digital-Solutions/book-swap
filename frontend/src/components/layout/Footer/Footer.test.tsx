import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { axe } from '../../../test/a11y.setup';
import { Footer } from './Footer';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Footer', () => {
  it('renders the copyright year and app name', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
    expect(screen.getByText(/React Starter Kit/)).toBeInTheDocument();
  });

  it('renders the translated rights text', () => {
    render(<Footer />);
    expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    render(<Footer className="custom-footer" />);
    const footer = screen.getByRole('contentinfo');
    expect(footer.className).toContain('custom-footer');
  });

  it('has no a11y violations', async () => {
    const { container } = render(<Footer />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
